import { randomInt } from 'node:crypto'
import { DateTime } from 'luxon'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import RoleUtilisateur, { type Role } from '#models/role_utilisateur'
import JournalService from '#services/journal_service'

/** Taille d'une page de la liste des comptes (pagination serveur). */
export const COMPTES_PAR_PAGE = 25

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

/** Mot de passe provisoire lisible (sans 0/O, 1/l/I), 14 caractères. */
const motDePasseProvisoire = () =>
  Array.from({ length: 14 }, () => ALPHABET[randomInt(0, ALPHABET.length)]).join('')

type Auteur = { id: number; ip: string | null }

export type RefusCompte = { ok: false; message: string }

/**
 * Gestion des comptes par l'administrateur : création avec mot de passe
 * provisoire (changement imposé à la première connexion), rôles cumulés,
 * activation. Chaque opération est journalisée (RG22) dans sa transaction.
 */
export default class CompteService {
  static lister(page: number, recherche?: string) {
    const q = User.query()
      .whereNull('deleted_at')
      .preload('rolesUtilisateur')
      .orderBy('full_name', 'asc')
    if (recherche) {
      const motif = `%${recherche}%`
      q.where((w) => w.whereILike('full_name', motif).orWhereILike('email', motif))
    }
    return q.paginate(page, COMPTES_PAR_PAGE)
  }

  static async creer(
    donnees: { fullName: string; email: string; sousTitre?: string | null; roles: Role[] },
    auteur: Auteur
  ) {
    const motDePasse = motDePasseProvisoire()
    const user = await db.transaction(async (trx) => {
      const u = await User.create(
        {
          fullName: donnees.fullName,
          email: donnees.email,
          sousTitre: donnees.sousTitre ?? null,
          password: motDePasse,
          actif: true,
          doubleFacteur: donnees.roles.some((r) => r === 'admin' || r === 'direction'),
          doitChangerMotDePasse: true,
          echecsConnexion: 0,
        },
        { client: trx }
      )
      await RoleUtilisateur.createMany(
        donnees.roles.map((role) => ({ userId: u.id, role })),
        { client: trx }
      )
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Création de compte',
          entite: 'users',
          entiteId: u.id,
          apres: { email: u.email, roles: donnees.roles },
          ip: auteur.ip,
        },
        trx
      )
      return u
    })
    return { user, motDePasse }
  }

  /**
   * Remplace les rôles d'un compte. Un rôle retiré est supprimé logiquement
   * (RG21) ; l'administrateur ne peut pas retirer son propre rôle admin.
   */
  static async changerRoles(
    user: User,
    roles: Role[],
    auteur: Auteur
  ): Promise<{ ok: true } | RefusCompte> {
    await user.load('rolesUtilisateur')
    const avant = user.roles
    if (user.id === auteur.id && avant.includes('admin') && !roles.includes('admin')) {
      return { ok: false, message: 'Vous ne pouvez pas retirer votre propre rôle administrateur.' }
    }
    const retires = avant.filter((r) => !roles.includes(r))
    const ajoutes = roles.filter((r) => !avant.includes(r))
    if (!retires.length && !ajoutes.length) return { ok: true }

    await db.transaction(async (trx) => {
      if (retires.length) {
        await RoleUtilisateur.query({ client: trx })
          .where('user_id', user.id)
          .whereIn('role', retires)
          .whereNull('deleted_at')
          .update({ deleted_at: DateTime.now().toSQL() })
      }
      if (ajoutes.length) {
        await RoleUtilisateur.createMany(
          ajoutes.map((role) => ({ userId: user.id, role })),
          { client: trx }
        )
      }
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Changement de rôle',
          entite: 'users',
          entiteId: user.id,
          avant: { roles: avant },
          apres: { roles },
          ip: auteur.ip,
        },
        trx
      )
    })
    return { ok: true }
  }

  static async changerActivation(
    user: User,
    actif: boolean,
    auteur: Auteur
  ): Promise<{ ok: true } | RefusCompte> {
    if (user.id === auteur.id && !actif) {
      return { ok: false, message: 'Vous ne pouvez pas désactiver votre propre compte.' }
    }
    if (user.actif === actif) return { ok: true }

    await db.transaction(async (trx) => {
      user.useTransaction(trx)
      user.actif = actif
      await user.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: actif ? 'Compte activé' : 'Compte désactivé',
          entite: 'users',
          entiteId: user.id,
          avant: { actif: !actif },
          apres: { actif },
          ip: auteur.ip,
        },
        trx
      )
    })
    return { ok: true }
  }
}

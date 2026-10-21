import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import JournalService from '#services/journal_service'

/** Nombre d'échecs consécutifs avant verrouillage temporaire du compte. */
export const MAX_ECHECS = 5
/** Durée du verrouillage temporaire. */
export const DUREE_VERROUILLAGE_MINUTES = 15

export type ResultatConnexion =
  | { ok: true; user: User }
  | { ok: false; raison: 'identifiants' }
  | { ok: false; raison: 'verrouille'; jusqua: DateTime }

/**
 * Règles d'authentification du cahier des charges (§ 12) : verrouillage
 * temporaire après 5 échecs consécutifs, comptes désactivés ou supprimés
 * refusés, connexions échouées journalisées.
 */
export default class AuthentificationService {
  static async verifierIdentifiants(
    email: string,
    motDePasse: string,
    ip: string | null
  ): Promise<ResultatConnexion> {
    const user = await User.query()
      .where('email', email.trim().toLowerCase())
      .whereNull('deleted_at')
      .first()

    if (!user || !user.actif) {
      // Vérification factice pour un temps de réponse identique : on ne
      // révèle pas l'existence d'un compte.
      await hash.make(motDePasse)
      await JournalService.enregistrer({
        userId: null,
        action: 'Connexion échouée',
        entite: 'users',
        apres: { email, motif: user ? 'compte désactivé' : 'compte inconnu' },
        ip,
      })
      return { ok: false, raison: 'identifiants' }
    }

    if (user.verrouilleJusquA && user.verrouilleJusquA > DateTime.now()) {
      return { ok: false, raison: 'verrouille', jusqua: user.verrouilleJusquA }
    }

    if (!(await hash.verify(user.password, motDePasse))) {
      return this.#echec(user, ip)
    }

    if (user.echecsConnexion > 0 || user.verrouilleJusquA) {
      user.echecsConnexion = 0
      user.verrouilleJusquA = null
      await user.save()
    }
    return { ok: true, user }
  }

  static async #echec(user: User, ip: string | null): Promise<ResultatConnexion> {
    return db.transaction(async (trx) => {
      user.useTransaction(trx)
      const echecs = user.echecsConnexion + 1
      const verrouiller = echecs >= MAX_ECHECS
      user.echecsConnexion = verrouiller ? 0 : echecs
      user.verrouilleJusquA = verrouiller
        ? DateTime.now().plus({ minutes: DUREE_VERROUILLAGE_MINUTES })
        : null
      await user.save()

      await JournalService.enregistrer(
        {
          userId: user.id,
          action: verrouiller ? 'Compte verrouillé' : 'Connexion échouée',
          entite: 'users',
          entiteId: user.id,
          apres: { essais: `${echecs}/${MAX_ECHECS}` },
          ip,
        },
        trx
      )

      return verrouiller
        ? { ok: false as const, raison: 'verrouille' as const, jusqua: user.verrouilleJusquA! }
        : { ok: false as const, raison: 'identifiants' as const }
    })
  }

  /**
   * Changement de mot de passe par l'utilisateur lui-même. Lève le
   * changement imposé à la première connexion.
   */
  static async changerMotDePasse(
    user: User,
    actuel: string,
    nouveau: string,
    ip: string | null
  ): Promise<{ ok: true } | { ok: false; champ: 'actuel' | 'nouveau'; message: string }> {
    if (!(await hash.verify(user.password, actuel))) {
      return { ok: false, champ: 'actuel', message: 'Mot de passe actuel incorrect.' }
    }
    if (actuel === nouveau) {
      return {
        ok: false,
        champ: 'nouveau',
        message: 'Le nouveau mot de passe doit être différent de l’actuel.',
      }
    }

    await db.transaction(async (trx) => {
      user.useTransaction(trx)
      // Le hachage (scrypt) est appliqué par le mixin withAuthFinder.
      user.password = nouveau
      user.doitChangerMotDePasse = false
      await user.save()
      await JournalService.enregistrer(
        {
          userId: user.id,
          action: 'Changement de mot de passe',
          entite: 'users',
          entiteId: user.id,
          ip,
        },
        trx
      )
    })
    return { ok: true }
  }
}

import db from '@adonisjs/lucid/services/db'
import type Eleve from '#models/eleve'
import Tuteur from '#models/tuteur'
import User from '#models/user'
import CompteService from '#services/compte_service'
import JournalService from '#services/journal_service'
import type { Auteur } from '#services/annee_scolaire_service'
import type { DonneesTuteur } from '#services/inscription_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'

/**
 * Tuteurs et contacts (§ 3) : au moins un tuteur par élève, un tuteur
 * principal, réutilisable pour une fratrie.
 */
export default class TuteurService {
  /** Recherche d'un tuteur existant, par nom ou téléphone (fratrie). */
  static rechercher(texte: string) {
    const motif = `%${texte.trim()}%`
    const chiffres = texte.replace(/\D/g, '')
    return Tuteur.query()
      .whereNull('deleted_at')
      .where((w) => {
        w.whereRaw('sans_accent(lower(nom)) LIKE sans_accent(lower(?))', [motif])
        if (chiffres.length >= 4) {
          w.orWhereRaw(`regexp_replace(telephone, '[^0-9]', '', 'g') LIKE ?`, [`%${chiffres}%`])
        }
      })
      .orderBy('nom')
      .limit(8)
  }

  static async ajouter(
    eleve: Eleve,
    tuteur: { id?: number | null; donnees?: DonneesTuteur | null },
    auteur: Auteur
  ) {
    await db.transaction(async (trx) => {
      const t = tuteur.id
        ? await Tuteur.query({ client: trx })
            .where('id', tuteur.id)
            .whereNull('deleted_at')
            .firstOrFail()
        : await Tuteur.create(tuteur.donnees!, { client: trx })
      const rattaches = await trx
        .from('eleve_tuteur')
        .where('eleve_id', eleve.id)
        .whereNull('deleted_at')
      if (rattaches.some((r) => r.tuteur_id === t.id)) {
        throw new RegleGestionException('Ce tuteur est déjà rattaché à l’élève.')
      }
      await trx.table('eleve_tuteur').insert({
        eleve_id: eleve.id,
        tuteur_id: t.id,
        principal: rattaches.length === 0,
        created_at: new Date(),
      })
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Tuteur rattaché',
          entite: 'eleves',
          entiteId: eleve.id,
          apres: { tuteur: t.nom },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  static async definirPrincipal(eleve: Eleve, tuteurId: number, auteur: Auteur) {
    await db.transaction(async (trx) => {
      const lien = await trx
        .from('eleve_tuteur')
        .where({ eleve_id: eleve.id, tuteur_id: tuteurId })
        .whereNull('deleted_at')
        .first()
      if (!lien) throw new RegleGestionException('Ce tuteur n’est pas rattaché à l’élève.')
      await trx
        .from('eleve_tuteur')
        .where('eleve_id', eleve.id)
        .whereNull('deleted_at')
        .update({ principal: false })
      await trx
        .from('eleve_tuteur')
        .where('id', lien.id)
        .update({ principal: true, updated_at: new Date() })
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Tuteur principal désigné',
          entite: 'eleves',
          entiteId: eleve.id,
          apres: { tuteurId },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  /** Détachement (suppression logique, RG21) ; il reste au moins un tuteur. */
  static async detacher(eleve: Eleve, tuteurId: number, auteur: Auteur) {
    await db.transaction(async (trx) => {
      const rattaches = await trx
        .from('eleve_tuteur')
        .where('eleve_id', eleve.id)
        .whereNull('deleted_at')
      const lien = rattaches.find((r) => r.tuteur_id === tuteurId)
      if (!lien) throw new RegleGestionException('Ce tuteur n’est pas rattaché à l’élève.')
      if (rattaches.length === 1) {
        throw new RegleGestionException('Un élève garde au moins un tuteur.')
      }
      await trx
        .from('eleve_tuteur')
        .where('id', lien.id)
        .update({ deleted_at: new Date(), principal: false })
      if (lien.principal) {
        const suivant = rattaches.find((r) => r.id !== lien.id)!
        await trx.from('eleve_tuteur').where('id', suivant.id).update({ principal: true })
      }
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Tuteur détaché',
          entite: 'eleves',
          entiteId: eleve.id,
          avant: { tuteurId },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  static async modifier(tuteur: Tuteur, donnees: DonneesTuteur, auteur: Auteur) {
    await db.transaction(async (trx) => {
      tuteur.useTransaction(trx)
      tuteur.merge(donnees)
      await tuteur.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Tuteur modifié',
          entite: 'tuteurs',
          entiteId: tuteur.id,
          apres: { nom: tuteur.nom, telephone: tuteur.telephone },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  /**
   * Accès au portail famille : crée le compte du tuteur (rôle tuteur, mot
   * de passe provisoire à changer à la première connexion). Le mode de
   * remise des identifiants (papier ou SMS) reste à valider avec
   * l'établissement (§ 12) : le mot de passe est rendu une fois, à remettre.
   */
  static async creerAccesPortail(tuteur: Tuteur, email: string, auteur: Auteur) {
    if (tuteur.userId) throw new RegleGestionException('Ce tuteur a déjà un accès au portail.')
    const existe = await User.findBy('email', email)
    if (existe)
      throw new RegleGestionException('Cette adresse e-mail est déjà utilisée par un compte.')
    const { user, motDePasse } = await CompteService.creer(
      { fullName: tuteur.nom, email, sousTitre: 'Tuteur légal', roles: ['tuteur'] },
      auteur
    )
    tuteur.userId = user.id
    tuteur.email = email
    await tuteur.save()
    return { email: user.email, motDePasse }
  }
}

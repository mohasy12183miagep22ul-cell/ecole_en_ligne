import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import env from '#start/env'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import JetonReinitialisation from '#models/jeton_reinitialisation'
import JournalService from '#services/journal_service'
import MessagerieService from '#services/messagerie_service'

/** Durée de validité d'un lien de réinitialisation. */
export const VALIDITE_LIEN_MINUTES = 30

const empreinte = (jeton: string) => createHash('sha256').update(jeton).digest('hex')

/**
 * Réinitialisation du mot de passe par lien à usage unique, envoyé par
 * courriel. La réponse à une demande est la même que le compte existe ou
 * non : on ne révèle jamais les adresses inscrites.
 */
export default class ReinitialisationService {
  /**
   * Crée un jeton et envoie le lien si un compte actif correspond. Renvoie le
   * lien (pour l'affichage en développement) ou `null`.
   */
  static async demander(email: string, ip: string | null): Promise<string | null> {
    const user = await User.query()
      .where('email', email)
      .whereNull('deleted_at')
      .where('actif', true)
      .first()
    if (!user) return null

    const jeton = randomBytes(32).toString('base64url')
    await db.transaction(async (trx) => {
      // Un seul lien valable à la fois : les précédents sont invalidés.
      await JetonReinitialisation.query({ client: trx })
        .where('user_id', user.id)
        .whereNull('utilise_le')
        .update({ utilise_le: DateTime.now().toSQL() })
      await JetonReinitialisation.create(
        {
          userId: user.id,
          empreinte: empreinte(jeton),
          expireLe: DateTime.now().plus({ minutes: VALIDITE_LIEN_MINUTES }),
        },
        { client: trx }
      )
      await JournalService.enregistrer(
        {
          userId: user.id,
          action: 'Demande de réinitialisation du mot de passe',
          entite: 'users',
          entiteId: user.id,
          ip,
        },
        trx
      )
    })

    const lien = `${env.get('APP_URL')}/reinitialiser/${jeton}`
    await MessagerieService.envoyer({
      a: user.email,
      sujet: 'Réinitialisation de votre mot de passe',
      gabarit: 'reinitialisation',
      donnees: { nom: user.fullName ?? user.email, lien },
    })
    return lien
  }

  /** Jeton encore utilisable (non expiré, non utilisé), ou `null`. */
  static async jetonValide(jeton: string) {
    return JetonReinitialisation.query()
      .where('empreinte', empreinte(jeton))
      .whereNull('utilise_le')
      .where('expire_le', '>', DateTime.now().toSQL())
      .first()
  }

  /**
   * Fixe le nouveau mot de passe et consomme le jeton. Lève aussi un
   * éventuel verrouillage et le changement imposé.
   */
  static async reinitialiser(jeton: string, nouveau: string, ip: string | null) {
    const trouve = await this.jetonValide(jeton)
    if (!trouve) return false

    await db.transaction(async (trx) => {
      trouve.useTransaction(trx)
      trouve.utiliseLe = DateTime.now()
      await trouve.save()

      const user = await User.findOrFail(trouve.userId, { client: trx })
      user.password = nouveau
      user.doitChangerMotDePasse = false
      user.echecsConnexion = 0
      user.verrouilleJusquA = null
      await user.save()

      await JournalService.enregistrer(
        {
          userId: user.id,
          action: 'Réinitialisation du mot de passe',
          entite: 'users',
          entiteId: user.id,
          ip,
        },
        trx
      )
    })
    return true
  }
}

import db from '@adonisjs/lucid/services/db'
import ParametresEtablissement from '#models/parametres_etablissement'
import JournalService from '#services/journal_service'
import type { Auteur } from '#services/annee_scolaire_service'

export type DonneesEtablissement = {
  nom: string
  adresse?: string | null
  ville?: string | null
  pays?: string | null
  telephone?: string | null
  email?: string | null
  chefEtablissement?: string | null
  titreChef: string
}

/**
 * Paramètres de l'établissement (une seule ligne, mono-établissement).
 */
export default class EtablissementService {
  /** Paramètres courants ; valeur par défaut tant que rien n'est saisi. */
  static async parametres() {
    const p = await ParametresEtablissement.query().whereNull('deleted_at').first()
    return (
      p ??
      new ParametresEtablissement().merge({
        nom: 'Établissement à paramétrer',
        titreChef: 'Chef d’établissement',
      })
    )
  }

  static async enregistrer(donnees: DonneesEtablissement, auteur: Auteur) {
    await db.transaction(async (trx) => {
      const existant = await ParametresEtablissement.query({ client: trx })
        .whereNull('deleted_at')
        .forUpdate()
        .first()
      const avant = existant ? existant.serialize() : null
      const p = existant ?? new ParametresEtablissement()
      p.useTransaction(trx)
      p.merge(donnees)
      await p.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Paramètres de l’établissement modifiés',
          entite: 'parametres_etablissement',
          entiteId: p.id,
          avant: avant ? { nom: avant.nom, chefEtablissement: avant.chefEtablissement } : null,
          apres: { nom: p.nom, chefEtablissement: p.chefEtablissement },
          ip: auteur.ip,
        },
        trx
      )
    })
  }
}

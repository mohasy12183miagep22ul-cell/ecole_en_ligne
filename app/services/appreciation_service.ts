import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type Periode from '#models/periode'
import type Affectation from '#models/affectation'
import Appreciation from '#models/appreciation'
import AnneeScolaire from '#models/annee_scolaire'
import MoyenneService from '#services/moyenne_service'
import AnneeScolaireService, { type Auteur } from '#services/annee_scolaire_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'

/**
 * Appréciations par élève et par matière (§ 6), 250 caractères au plus.
 * Elles partent de l'affectation de l'enseignant (RG9).
 */
export default class AppreciationService {
  static async lister(affectation: Affectation, periode: Periode) {
    const eleves = await MoyenneService.elevesDeLaClasse(affectation.classeId, periode.debutSaisie)
    const textes = await Appreciation.query()
      .where('matiere_id', affectation.matiereId)
      .where('periode_id', periode.id)
      .whereIn(
        'eleve_id',
        eleves.map((e) => e.id)
      )
      .whereNull('deleted_at')
    const parEleve = new Map(textes.map((t) => [t.eleveId, t.texte]))
    return eleves.map((e) => ({
      id: e.id as number,
      nom: e.nom as string,
      prenoms: e.prenoms as string,
      texte: parEleve.get(e.id) ?? '',
    }))
  }

  /** Enregistre ou efface (texte vide : suppression logique) l'appréciation d'un élève. */
  static async enregistrer(
    affectation: Affectation,
    periode: Periode,
    eleveId: number,
    texte: string,
    auteur: Auteur
  ) {
    const annee = await AnneeScolaire.findOrFail(affectation.anneeId)
    AnneeScolaireService.verifierModifiable(annee)
    if (periode.anneeId !== affectation.anneeId) {
      throw new RegleGestionException('La période n’appartient pas à l’année de l’affectation.')
    }
    const eleves = await MoyenneService.elevesDeLaClasse(affectation.classeId, periode.debutSaisie)
    if (!eleves.some((e) => e.id === eleveId)) {
      throw new RegleGestionException('Cet élève n’appartient pas à la classe.', 'RG9')
    }
    const propre = texte.trim().slice(0, 250)

    await db.transaction(async (trx) => {
      const existante = await Appreciation.query({ client: trx })
        .where({ eleve_id: eleveId, matiere_id: affectation.matiereId, periode_id: periode.id })
        .whereNull('deleted_at')
        .forUpdate()
        .first()
      if (existante) {
        existante.useTransaction(trx)
        if (propre) existante.merge({ texte: propre, auteurId: auteur.id })
        else existante.deletedAt = DateTime.now()
        await existante.save()
      } else if (propre) {
        await Appreciation.create(
          {
            eleveId,
            matiereId: affectation.matiereId,
            periodeId: periode.id,
            texte: propre,
            auteurId: auteur.id,
          },
          { client: trx }
        )
      }
    })
  }
}

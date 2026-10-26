import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Note from '#models/note'
import Evaluation from '#models/evaluation'
import Affectation from '#models/affectation'
import AnneeScolaire from '#models/annee_scolaire'
import Periode from '#models/periode'
import MoyenneService from '#services/moyenne_service'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

/**
 * Notes de démonstration du 1er trimestre (livrable du lot : « un trimestre de
 * notes saisi et calculé »). Pour chaque affectation de l'année active : une
 * interrogation sur 10 et un devoir sur 20, avec quelques absents. États
 * variés pour exercer tous les écrans : validées, soumises à la direction, et
 * une évaluation en brouillon partiellement saisie (mathématiques, 3e A).
 * S'exécute après vie_scolaire_demo_seeder ; ne fait rien si des
 * évaluations existent déjà.
 */
const tirage = (i: number, graine: number) =>
  Math.imul(i * 31 + graine * 7919 + 1, 2654435761) >>> 16

export default class extends BaseSeeder {
  static environment = ['development']

  async run() {
    const annee = await AnneeScolaire.query()
      .where('etat', 'active')
      .whereNull('deleted_at')
      .first()
    if (!annee) return
    const deja = await db.from('evaluations').whereNull('deleted_at').count('* as n')
    if (Number(deja[0].n) > 0) return
    const periode = await Periode.query().where('annee_id', annee.id).orderBy('ordre').firstOrFail()
    const direction = await User.findByOrFail('email', 'm.camara@flamboyants.edu.gn')
    const affectations = await Affectation.query()
      .where('annee_id', annee.id)
      .whereNull('deleted_at')
      .preload('classe')
      .preload('matiere')

    await db.transaction(async (trx) => {
      for (const [k, a] of affectations.entries()) {
        const eleves = await MoyenneService.elevesDeLaClasse(a.classeId, periode.debutSaisie)
        const modeles = [
          {
            type: 'interrogation' as const,
            titre: 'Interrogation n°1',
            date: '2026-09-24',
            noteMax: 10,
            poids: 1,
          },
          {
            type: 'devoir' as const,
            titre: 'Devoir surveillé n°1',
            date: '2026-10-14',
            noteMax: 20,
            poids: 2,
          },
        ]
        for (const [j, m] of modeles.entries()) {
          const ev = await Evaluation.create(
            {
              affectationId: a.id,
              periodeId: periode.id,
              type: m.type,
              titre: m.titre,
              date: DateTime.fromISO(m.date),
              noteMax: m.noteMax,
              poids: m.poids,
              etat: 'brouillon',
            },
            { client: trx }
          )
          // Brouillon partiel : le devoir de mathématiques de la 3e A, à moitié saisi.
          const partiel = j === 1 && a.classe.libelle === '3e A' && a.matiere.code === 'MA'
          for (const [i, e] of eleves.entries()) {
            if (partiel && i % 2 === 1) continue
            const niveau = 0.35 + (tirage(e.id, 7) % 60) / 100 // aptitude de l'élève, stable
            const absent = tirage(e.id * 3 + j, k) % 23 === 0
            const brut = Math.min(
              1,
              Math.max(0, niveau + ((tirage(e.id, j * 11 + k) % 31) - 15) / 100)
            )
            await Note.create(
              {
                evaluationId: ev.id,
                eleveId: e.id,
                absent,
                valeur: absent ? null : Math.round(brut * m.noteMax * 2) / 2,
                saisiePar: a.enseignantId,
              },
              { client: trx }
            )
          }
          const etat = partiel ? 'brouillon' : j === 0 || k % 3 !== 0 ? 'validee' : 'soumise'
          ev.useTransaction(trx)
          ev.etat = etat
          ev.soumiseLe = etat === 'brouillon' ? null : DateTime.fromISO(m.date).plus({ days: 3 })
          if (etat === 'validee') {
            ev.valideePar = direction.id
            ev.valideeLe = DateTime.fromISO(m.date).plus({ days: 5 })
          }
          await ev.save()
        }
      }
    })
  }
}

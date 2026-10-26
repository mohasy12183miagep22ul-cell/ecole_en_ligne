import db from '@adonisjs/lucid/services/db'
import Note from '#models/note'
import type Evaluation from '#models/evaluation'
import AnneeScolaire from '#models/annee_scolaire'
import JournalService from '#services/journal_service'
import MoyenneService from '#services/moyenne_service'
import EvaluationService from '#services/evaluation_service'
import AnneeScolaireService, { type Auteur } from '#services/annee_scolaire_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'

export type Saisie = {
  eleveId: number
  valeur: number | null
  absent: boolean
  observation?: string | null
}

const lisible = (n: { valeur: number | null; absent: boolean } | null) =>
  n === null
    ? null
    : n.absent
      ? 'absent'
      : n.valeur === null
        ? 'vide'
        : String(n.valeur).replace('.', ',')

/**
 * Notes d'une évaluation (§ 6). Une note n'existe que pour un élève de la
 * classe, dans les bornes de l'évaluation (RG10), et tant que l'évaluation
 * est en brouillon dans la fenêtre de saisie (RG12, RG13). Chaque création ou
 * modification est journalisée avec l'avant et l'après (RG22).
 */
export default class NoteService {
  /** Élèves de la grille, par ordre alphabétique, et leurs notes. */
  static async grille(ev: Evaluation) {
    const eleves = await MoyenneService.elevesDeLaClasse(ev.affectation.classeId, ev.date)
    const notes = await Note.query().where('evaluation_id', ev.id).whereNull('deleted_at')
    const parEleve = new Map(notes.map((n) => [n.eleveId, n]))
    return eleves.map((e) => {
      const n = parEleve.get(e.id)
      return {
        id: e.id as number,
        matricule: e.matricule as string,
        nom: e.nom as string,
        prenoms: e.prenoms as string,
        valeur: n?.valeur ?? null,
        absent: n?.absent ?? false,
        observation: n?.observation ?? '',
      }
    })
  }

  /** Statistiques de l'évaluation, dans son barème. */
  static async statistiques(ev: Evaluation) {
    const lignes = await this.grille(ev)
    return MoyenneService.statistiquesEvaluation(lignes, lignes.length)
  }

  /**
   * Enregistrement d'un lot de saisies (frappe au fil de l'eau, ou file
   * locale renvoyée au retour du réseau). Tout ou rien.
   */
  static async enregistrer(evaluationId: number, saisies: Saisie[], auteur: Auteur) {
    const ev = await EvaluationService.trouver(evaluationId)
    if (ev.etat !== 'brouillon') {
      throw new RegleGestionException(
        ev.etat === 'soumise'
          ? 'Notes soumises à la direction : la saisie est fermée.'
          : 'Évaluation validée : elle n’est plus modifiable (RG12).',
        'RG12'
      )
    }
    const annee = await AnneeScolaire.findOrFail(ev.affectation.anneeId)
    AnneeScolaireService.verifierModifiable(annee)
    await EvaluationService.verifierSaisieOuverte(ev.affectationId, ev.periode)

    const grille = await this.grille(ev)
    const eleves = new Set(grille.map((e) => e.id))
    for (const s of saisies) {
      if (!eleves.has(s.eleveId)) {
        throw new RegleGestionException(
          'Un élève saisi n’appartient pas à la classe de cette évaluation.',
          'RG9'
        )
      }
      if (s.absent && s.valeur !== null) {
        throw new RegleGestionException('Un élève absent n’a pas de note (RG11).', 'RG11')
      }
      if (s.valeur !== null && (s.valeur < 0 || s.valeur > ev.noteMax)) {
        throw new RegleGestionException(
          `Note refusée : elle doit être comprise entre 0 et ${String(ev.noteMax).replace('.', ',')}.`,
          'RG10'
        )
      }
    }

    return db.transaction(async (trx) => {
      const existantes = await Note.query({ client: trx })
        .where('evaluation_id', ev.id)
        .whereIn(
          'eleve_id',
          saisies.map((s) => s.eleveId)
        )
        .whereNull('deleted_at')
        .forUpdate()
      const parEleve = new Map(existantes.map((n) => [n.eleveId, n]))
      let modifiees = 0

      for (const s of saisies) {
        const observation = s.observation?.trim() ? s.observation.trim().slice(0, 120) : null
        const n = parEleve.get(s.eleveId) ?? null
        if (n && n.valeur === s.valeur && n.absent === s.absent && n.observation === observation)
          continue
        if (!n && s.valeur === null && !s.absent && !observation) continue

        const avant = n ? { valeur: n.valeur, absent: n.absent } : null
        if (n) {
          n.useTransaction(trx)
          n.merge({ valeur: s.valeur, absent: s.absent, observation, saisiePar: auteur.id })
          await n.save()
        } else {
          await Note.create(
            {
              evaluationId: ev.id,
              eleveId: s.eleveId,
              valeur: s.valeur,
              absent: s.absent,
              observation,
              saisiePar: auteur.id,
            },
            { client: trx }
          )
        }
        modifiees++
        // RG22 : une entrée par note créée ou modifiée (l'observation seule n'est pas tracée).
        if (!avant || avant.valeur !== s.valeur || avant.absent !== s.absent) {
          await JournalService.enregistrer(
            {
              userId: auteur.id,
              action: avant ? 'Modification de note' : 'Saisie de note',
              entite: 'notes',
              entiteId: `${ev.id}:${s.eleveId}`,
              avant: avant ? { note: lisible(avant), evaluation: ev.titre } : null,
              apres: { note: lisible(s), evaluation: ev.titre, eleveId: s.eleveId },
              ip: auteur.ip,
            },
            trx
          )
        }
      }
      return modifiees
    })
  }
}

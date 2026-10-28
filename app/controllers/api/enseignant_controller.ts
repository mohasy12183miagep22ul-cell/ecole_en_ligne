import { DateTime } from 'luxon'
import Affectation from '#models/affectation'
import EvaluationPolicy from '#policies/evaluation_policy'
import { TYPES_EVALUATION, type TypeEvaluation } from '#models/evaluation'
import type Evaluation from '#models/evaluation'
import type Periode from '#models/periode'
import NoteService from '#services/note_service'
import MoyenneService from '#services/moyenne_service'
import EvaluationService from '#services/evaluation_service'
import { versAnnee } from '#controllers/api/moi_controller'
import {
  evaluationValidator,
  modifierEvaluationValidator,
  saisiesValidator,
} from '#validators/notes'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

const TYPES = (Object.keys(TYPES_EVALUATION) as TypeEvaluation[]).map((cle) => ({
  cle,
  libelle: TYPES_EVALUATION[cle],
}))

/** Fenêtre de saisie d'une affectation sur une période (RG13), dates ISO. */
async function saisie(affectationId: number, periode: Periode) {
  const s = await EvaluationService.saisieOuverte(affectationId, periode)
  return s.ouverte
    ? { ouverte: true, jusquAu: s.jusquAu.toISODate(), derogation: Boolean(s.derogation) }
    : { ouverte: false, jusquAu: null, derogation: false, raison: s.raison }
}

/** Listes d'évaluations du service (dates au format d'affichage) passées en dates ISO. */
export const enIso = <T extends { date: string }>(evaluations: T[]) =>
  evaluations.map((e) => ({ ...e, date: DateTime.fromFormat(e.date, 'dd/MM/yyyy').toISODate() }))

const versEvaluation = (ev: Evaluation) => ({
  id: ev.id,
  titre: ev.titre,
  type: ev.type,
  typeLibelle: TYPES_EVALUATION[ev.type],
  date: ev.date.toISODate(),
  noteMax: ev.noteMax,
  poids: ev.poids,
  etat: ev.etat,
  motifRetour: ev.motifRetour,
  affectationId: ev.affectationId,
  classe: ev.affectation.classe.libelle,
  matiere: ev.affectation.matiere.libelle,
  periodeId: ev.periodeId,
  periode: ev.periode.libelle,
})

/**
 * API mobile · espace enseignant (§ 6, RG9 à RG13). Tout part des
 * affectations de l'enseignant sur l'année active ; la policy refuse toute
 * évaluation ou affectation qui ne lui appartient pas.
 */
export default class EnseignantController {
  async #affectations(ctx: HttpContext) {
    const annee = ctx.anneeActive
    if (!annee) return { annee: null, affectations: [] }
    const affectations = await EvaluationService.affectationsDe(
      ctx.auth.getUserOrFail().id,
      annee.id
    )
    return { annee, affectations }
  }

  async #affectation(ctx: HttpContext, id: number) {
    const affectation = await Affectation.query()
      .where('id', id)
      .whereNull('deleted_at')
      .preload('classe')
      .preload('matiere')
      .firstOrFail()
    await ctx.bouncer.with(EvaluationPolicy).authorize('utiliserAffectation', affectation)
    return affectation
  }

  /** Mes classes : une carte par affectation, avec l'évaluation en cours. */
  async affectations(ctx: HttpContext) {
    const { annee, affectations } = await this.#affectations(ctx)
    const user = ctx.auth.getUserOrFail()
    const periodes = annee ? await EvaluationService.periodes(annee.id) : []
    const periode = EvaluationService.periodeCourante(periodes)
    const { evaluations } = annee
      ? await EvaluationService.listerAvecStatistiques({
          anneeId: annee.id,
          affectationIds: affectations.map((a) => a.id),
        })
      : { evaluations: [] }

    const cartes = []
    for (const a of affectations) {
      const siennes = evaluations.filter((e) => e.affectationId === a.id)
      const enCours = siennes.find((e) => e.etat === 'brouillon') ?? null
      const eleves = await MoyenneService.elevesDeLaClasse(
        a.classeId,
        periode?.debutSaisie ?? annee!.dateDebut
      )
      cartes.push({
        id: a.id,
        classe: a.classe.libelle,
        niveau: a.classe.niveau.libelle,
        matiere: a.matiere.libelle,
        noteMaxDefaut: a.matiere.noteMaxDefaut,
        effectif: eleves.length,
        evaluations: siennes.length,
        professeurPrincipal: a.classe.professeurPrincipalId === user.id,
        saisie: periode ? await saisie(a.id, periode) : null,
        enCours: enCours
          ? {
              id: enCours.id,
              titre: enCours.titre,
              faits: enCours.statistiques.notes + enCours.statistiques.absents,
              effectif: enCours.statistiques.effectif,
            }
          : null,
      })
    }
    return {
      annee: versAnnee(annee),
      periode: periode
        ? {
            id: periode.id,
            libelle: periode.libelle,
            debutSaisie: periode.debutSaisie.toISODate(),
            finSaisie: periode.finSaisie.toISODate(),
          }
        : null,
      affectations: cartes,
    }
  }

  /** Périodes de l'année et état de la saisie pour une affectation. */
  async periodes(ctx: HttpContext) {
    const affectation = await this.#affectation(ctx, Number(ctx.params.id))
    const periodes = await EvaluationService.periodes(affectation.anneeId)
    const courante = EvaluationService.periodeCourante(periodes)
    const lignes = []
    for (const p of periodes) {
      lignes.push({
        id: p.id,
        libelle: p.libelle,
        debutSaisie: p.debutSaisie.toISODate(),
        finSaisie: p.finSaisie.toISODate(),
        courante: p.id === courante?.id,
        saisie: await saisie(affectation.id, p),
      })
    }
    return { periodes: lignes }
  }

  async types() {
    return { types: TYPES }
  }

  /** Mes évaluations, filtrables par affectation, paginées. */
  async index(ctx: HttpContext) {
    const { annee, affectations } = await this.#affectations(ctx)
    const filtre = Number(ctx.request.input('affectation')) || null
    const page = Math.max(1, Number(ctx.request.input('page', 1)) || 1)
    const choisies = filtre ? affectations.filter((a) => a.id === filtre) : affectations
    if (!annee || choisies.length === 0) {
      return { evaluations: [], pagination: { page: 1, dernierePage: 1, total: 0 } }
    }
    const { evaluations, pagination } = await EvaluationService.listerAvecStatistiques({
      anneeId: annee.id,
      affectationIds: choisies.map((a) => a.id),
      page,
    })
    return { evaluations: enIso(evaluations), pagination }
  }

  async store(ctx: HttpContext) {
    const d = await ctx.request.validateUsing(evaluationValidator)
    const affectation = await this.#affectation(ctx, d.affectationId)
    const cree = await EvaluationService.creer(affectation, d, auteur(ctx))
    const ev = await EvaluationService.trouver(cree.id)
    return ctx.response.created({ evaluation: versEvaluation(ev) })
  }

  /** Grille de saisie : évaluation, fenêtre de saisie, élèves et notes. */
  async show(ctx: HttpContext) {
    const ev = await EvaluationService.trouver(ctx.params.id)
    await ctx.bouncer.with(EvaluationPolicy).authorize('saisir', ev)
    const lignes = await NoteService.grille(ev)
    return {
      evaluation: versEvaluation(ev),
      saisie: await saisie(ev.affectationId, ev.periode),
      lignes,
      statistiques: MoyenneService.statistiquesEvaluation(lignes, lignes.length),
    }
  }

  async update(ctx: HttpContext) {
    const ev = await EvaluationService.trouver(ctx.params.id)
    await ctx.bouncer.with(EvaluationPolicy).authorize('saisir', ev)
    const d = await ctx.request.validateUsing(modifierEvaluationValidator)
    await EvaluationService.modifier(ev, d, auteur(ctx))
    return { evaluation: versEvaluation(await EvaluationService.trouver(ev.id)) }
  }

  /**
   * Lot de saisies (frappe au fil de l'eau ou file hors ligne renvoyée au
   * retour du réseau). Tout ou rien : une saisie refusée annule le lot.
   */
  async notes(ctx: HttpContext) {
    const ev = await EvaluationService.trouver(ctx.params.id)
    await ctx.bouncer.with(EvaluationPolicy).authorize('saisir', ev)
    const { saisies } = await ctx.request.validateUsing(saisiesValidator)
    const modifiees = await NoteService.enregistrer(ev.id, saisies, auteur(ctx))
    return {
      modifiees,
      enregistreLe: new Date().toISOString(),
      statistiques: await NoteService.statistiques(ev),
    }
  }

  async soumettre(ctx: HttpContext) {
    const ev = await EvaluationService.trouver(ctx.params.id)
    await ctx.bouncer.with(EvaluationPolicy).authorize('saisir', ev)
    await EvaluationService.soumettre(ev, auteur(ctx))
    return { evaluation: versEvaluation(await EvaluationService.trouver(ev.id)) }
  }
}

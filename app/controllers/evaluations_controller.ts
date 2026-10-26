import Affectation from '#models/affectation'
import EvaluationPolicy from '#policies/evaluation_policy'
import { TYPES_EVALUATION, type TypeEvaluation } from '#models/evaluation'
import NoteService from '#services/note_service'
import MoyenneService from '#services/moyenne_service'
import EvaluationService from '#services/evaluation_service'
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

/** Évaluations et grille de saisie de l'enseignant (§ 6, RG9 à RG13). */
export default class EvaluationsController {
  /** Affectations de l'enseignant sur l'année active (vides entre deux années). */
  async #affectations(ctx: HttpContext) {
    const annee = ctx.anneeActive
    if (!annee) return { annee: null, affectations: [] }
    const affectations = await EvaluationService.affectationsDe(
      ctx.auth.getUserOrFail().id,
      annee.id
    )
    return { annee, affectations }
  }

  /** Mes classes : une carte par affectation, avec l'évaluation en cours. */
  async classes(ctx: HttpContext) {
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
    const saisie =
      periode && affectations[0]
        ? await EvaluationService.saisieOuverte(affectations[0].id, periode)
        : null

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
        effectif: eleves.length,
        evaluations: siennes.length,
        professeurPrincipal: a.classe.professeurPrincipalId === user.id,
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
    return ctx.inertia.render('enseignant/classes', {
      annee: annee ? { id: annee.id, libelle: annee.libelle } : null,
      periode: periode
        ? {
            libelle: periode.libelle,
            fin: periode.finSaisie.toFormat('dd/MM/yyyy'),
            ouverte: Boolean(saisie?.ouverte),
          }
        : null,
      cartes,
    })
  }

  /** Mes évaluations, filtrables par affectation. */
  async index(ctx: HttpContext) {
    const { annee, affectations } = await this.#affectations(ctx)
    const filtre = Number(ctx.request.input('affectation')) || null
    const choisies = filtre ? affectations.filter((a) => a.id === filtre) : affectations
    const { evaluations } = annee
      ? await EvaluationService.listerAvecStatistiques({
          anneeId: annee.id,
          affectationIds: choisies.map((a) => a.id),
        })
      : { evaluations: [] }
    return ctx.inertia.render('enseignant/evaluations', {
      annee: annee ? { id: annee.id, libelle: annee.libelle } : null,
      affectations: affectations.map((a) => ({
        id: a.id,
        libelle: `${a.classe.libelle} · ${a.matiere.libelle}`,
      })),
      filtre,
      evaluations,
    })
  }

  /** Formulaire de création : affectations et périodes avec l'état de leur saisie. */
  async create(ctx: HttpContext) {
    const { annee, affectations } = await this.#affectations(ctx)
    const periodes = annee ? await EvaluationService.periodes(annee.id) : []
    const courante = EvaluationService.periodeCourante(periodes)
    const etats = []
    for (const p of periodes) {
      const s = affectations[0]
        ? await EvaluationService.saisieOuverte(affectations[0].id, p)
        : null
      etats.push({
        id: p.id,
        libelle: p.libelle,
        debut: p.debutSaisie.toFormat('dd/MM/yyyy'),
        fin: p.finSaisie.toFormat('dd/MM/yyyy'),
        ouverte: Boolean(s?.ouverte),
      })
    }
    return ctx.inertia.render('enseignant/nouvelle_evaluation', {
      annee: annee ? { id: annee.id, libelle: annee.libelle } : null,
      affectations: affectations.map((a) => ({
        id: a.id,
        libelle: `${a.classe.libelle} — ${a.matiere.libelle}`,
        noteMax: a.matiere.noteMaxDefaut,
      })),
      periodes: etats,
      periodeCourante: courante?.id ?? null,
      types: TYPES,
      affectationChoisie: Number(ctx.request.input('affectation')) || null,
    })
  }

  async store(ctx: HttpContext) {
    const d = await ctx.request.validateUsing(evaluationValidator)
    const affectation = await Affectation.query()
      .where('id', d.affectationId)
      .whereNull('deleted_at')
      .firstOrFail()
    await ctx.bouncer.with(EvaluationPolicy).authorize('utiliserAffectation', affectation)
    const ev = await EvaluationService.creer(affectation, d, auteur(ctx))
    ctx.session.flash('success', 'Évaluation créée : saisissez les notes')
    return ctx.response.redirect().toRoute('enseignant.grille', { id: ev.id })
  }

  /** Grille de saisie. */
  async show(ctx: HttpContext) {
    const ev = await EvaluationService.trouver(ctx.params.id)
    await ctx.bouncer.with(EvaluationPolicy).authorize('saisir', ev)
    const lignes = await NoteService.grille(ev)
    const saisie = await EvaluationService.saisieOuverte(ev.affectationId, ev.periode)
    return ctx.inertia.render('enseignant/grille', {
      evaluation: {
        id: ev.id,
        titre: ev.titre,
        type: ev.type,
        typeLibelle: TYPES_EVALUATION[ev.type],
        date: ev.date.toISODate()!,
        noteMax: ev.noteMax,
        poids: ev.poids,
        etat: ev.etat,
        motifRetour: ev.motifRetour,
        classe: ev.affectation.classe.libelle,
        matiere: ev.affectation.matiere.libelle,
        periode: ev.periode.libelle,
      },
      saisie: saisie.ouverte
        ? {
            ouverte: true,
            jusquAu: saisie.jusquAu.toFormat('dd/MM/yyyy'),
            derogation: Boolean(saisie.derogation),
          }
        : { ouverte: false, jusquAu: null, derogation: false },
      types: TYPES,
      lignes,
      statistiques: MoyenneService.statistiquesEvaluation(lignes, lignes.length),
    })
  }

  async update(ctx: HttpContext) {
    const ev = await EvaluationService.trouver(ctx.params.id)
    await ctx.bouncer.with(EvaluationPolicy).authorize('saisir', ev)
    const d = await ctx.request.validateUsing(modifierEvaluationValidator)
    await EvaluationService.modifier(ev, d, auteur(ctx))
    ctx.session.flash('success', 'Évaluation enregistrée')
    return ctx.response.redirect().back()
  }

  /** Enregistrement automatique de la grille (JSON) : réponse sans rechargement de page. */
  async notes(ctx: HttpContext) {
    const ev = await EvaluationService.trouver(ctx.params.id)
    await ctx.bouncer.with(EvaluationPolicy).authorize('saisir', ev)
    const { saisies } = await ctx.request.validateUsing(saisiesValidator)
    const modifiees = await NoteService.enregistrer(ev.id, saisies, auteur(ctx))
    return ctx.response.send({
      modifiees,
      enregistreLe: new Date().toISOString(),
      statistiques: await NoteService.statistiques(ev),
    })
  }

  async soumettre(ctx: HttpContext) {
    const ev = await EvaluationService.trouver(ctx.params.id)
    await ctx.bouncer.with(EvaluationPolicy).authorize('saisir', ev)
    await EvaluationService.soumettre(ev, auteur(ctx))
    ctx.session.flash('success', 'Notes soumises à la direction')
    return ctx.response.redirect().back()
  }
}

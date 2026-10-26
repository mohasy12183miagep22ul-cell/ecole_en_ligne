import Periode from '#models/periode'
import Affectation from '#models/affectation'
import EvaluationPolicy from '#policies/evaluation_policy'
import MoyenneService from '#services/moyenne_service'
import EvaluationService from '#services/evaluation_service'
import AppreciationService from '#services/appreciation_service'
import { appreciationValidator } from '#validators/notes'
import type { HttpContext } from '@adonisjs/core/http'

/** Choix d'une affectation et d'une période parmi celles de l'enseignant. */
async function selection(ctx: HttpContext) {
  const annee = ctx.anneeActive
  if (!annee) return null
  const affectations = await EvaluationService.affectationsDe(ctx.auth.getUserOrFail().id, annee.id)
  const periodes = await EvaluationService.periodes(annee.id)
  const affectation =
    affectations.find((a) => a.id === Number(ctx.request.input('affectation'))) ??
    affectations[0] ??
    null
  const periode =
    periodes.find((p) => p.id === Number(ctx.request.input('periode'))) ??
    EvaluationService.periodeCourante(periodes)
  return { annee, affectations, periodes, affectation, periode }
}

const choix = (s: NonNullable<Awaited<ReturnType<typeof selection>>>) => ({
  affectations: s.affectations.map((a) => ({
    id: a.id,
    libelle: `${a.classe.libelle} · ${a.matiere.libelle}`,
  })),
  periodes: s.periodes.map((p) => ({ id: p.id, libelle: p.libelle })),
  affectation: s.affectation?.id ?? null,
  periode: s.periode?.id ?? null,
})

/**
 * Appréciations par matière et récapitulatif de la matière (§ 6). Les
 * moyennes viennent du service de calcul unique, en mode provisoire
 * (évaluations non encore validées comprises).
 */
export default class AppreciationsController {
  async index(ctx: HttpContext) {
    const s = await selection(ctx)
    if (!s || !s.affectation || !s.periode) {
      return ctx.inertia.render('enseignant/appreciations', { choix: null, eleves: [] })
    }
    await ctx.bouncer.with(EvaluationPolicy).authorize('utiliserAffectation', s.affectation)
    const resultats = await MoyenneService.resultatsClasse(
      s.affectation.classeId,
      s.periode.id,
      'toutes'
    )
    const moyennes = new Map(
      resultats.lignes.map((l) => [l.eleveId, l.moyennes[s.affectation!.matiereId] ?? null])
    )
    const eleves = await AppreciationService.lister(s.affectation, s.periode)
    return ctx.inertia.render('enseignant/appreciations', {
      choix: choix(s),
      eleves: eleves.map((e) => ({ ...e, moyenne: moyennes.get(e.id) ?? null })),
    })
  }

  /** Enregistrement automatique d'une appréciation (JSON). */
  async store(ctx: HttpContext) {
    const d = await ctx.request.validateUsing(appreciationValidator)
    const affectation = await Affectation.query()
      .where('id', d.affectationId)
      .whereNull('deleted_at')
      .firstOrFail()
    await ctx.bouncer.with(EvaluationPolicy).authorize('utiliserAffectation', affectation)
    const periode = await Periode.query()
      .where('id', d.periodeId)
      .whereNull('deleted_at')
      .firstOrFail()
    await AppreciationService.enregistrer(affectation, periode, d.eleveId, d.texte ?? '', {
      id: ctx.auth.getUserOrFail().id,
      ip: ctx.request.ip(),
    })
    return ctx.response.send({ enregistreLe: new Date().toISOString() })
  }

  /** Récapitulatif de ma matière : une carte par classe, détail de la classe choisie. */
  async recapitulatif(ctx: HttpContext) {
    const s = await selection(ctx)
    if (!s || !s.affectation || !s.periode) {
      return ctx.inertia.render('enseignant/recapitulatif', { choix: null, cartes: [], detail: [] })
    }
    await ctx.bouncer.with(EvaluationPolicy).authorize('utiliserAffectation', s.affectation)
    const cartes = []
    let detail: Array<{
      id: number
      nom: string
      prenoms: string
      moyenne: number | null
      rang: number | null
    }> = []
    for (const a of s.affectations) {
      const r = await MoyenneService.resultatsClasse(a.classeId, s.periode.id, 'toutes')
      const valeurs = r.lignes.map((l) => l.moyennes[a.matiereId] ?? null)
      cartes.push({
        id: a.id,
        classe: a.classe.libelle,
        matiere: a.matiere.libelle,
        effectif: r.lignes.length,
        ...MoyenneService.statistiques(valeurs),
        reussite: MoyenneService.tauxReussite(valeurs),
      })
      if (a.id === s.affectation.id) {
        detail = r.lignes
          .map((l) => ({
            id: l.eleveId,
            nom: l.nom,
            prenoms: l.prenoms,
            moyenne: l.moyennes[a.matiereId] ?? null,
            rang: l.rangs[a.matiereId] ?? null,
          }))
          .sort((x, y) => (y.moyenne ?? -1) - (x.moyenne ?? -1))
      }
    }
    return ctx.inertia.render('enseignant/recapitulatif', { choix: choix(s), cartes, detail })
  }
}

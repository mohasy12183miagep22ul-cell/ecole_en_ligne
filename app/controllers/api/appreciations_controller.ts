import Periode from '#models/periode'
import Affectation from '#models/affectation'
import EvaluationPolicy from '#policies/evaluation_policy'
import MoyenneService from '#services/moyenne_service'
import EvaluationService from '#services/evaluation_service'
import AppreciationService from '#services/appreciation_service'
import { appreciationValidator } from '#validators/notes'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Affectation (de l'enseignant) et période (de l'année de l'affectation)
 * désignées par la requête ; la période courante à défaut.
 */
async function selection(ctx: HttpContext) {
  const affectation = await Affectation.query()
    .where('id', Number(ctx.request.input('affectation')) || 0)
    .whereNull('deleted_at')
    .preload('classe')
    .preload('matiere')
    .firstOrFail()
  await ctx.bouncer.with(EvaluationPolicy).authorize('utiliserAffectation', affectation)
  const periodes = await EvaluationService.periodes(affectation.anneeId)
  const periode =
    periodes.find((p) => p.id === Number(ctx.request.input('periode'))) ??
    EvaluationService.periodeCourante(periodes)
  return { affectation, periode }
}

/**
 * API mobile · appréciations par matière et récapitulatif (§ 6). Les
 * moyennes viennent du service de calcul unique, en mode provisoire, non
 * arrondies (RG15) : l'application arrondit à l'affichage.
 */
export default class AppreciationsController {
  async index(ctx: HttpContext) {
    const { affectation, periode } = await selection(ctx)
    if (!periode) return { periode: null, eleves: [] }
    const resultats = await MoyenneService.resultatsClasse(
      affectation.classeId,
      periode.id,
      'toutes'
    )
    const moyennes = new Map(
      resultats.lignes.map((l) => [l.eleveId, l.moyennes[affectation.matiereId] ?? null])
    )
    const eleves = await AppreciationService.lister(affectation, periode)
    return {
      periode: { id: periode.id, libelle: periode.libelle },
      eleves: eleves.map((e) => ({ ...e, moyenne: moyennes.get(e.id) ?? null })),
    }
  }

  /** Enregistrement d'une appréciation (texte vide : effacement logique). */
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
    return { enregistreLe: new Date().toISOString() }
  }

  /** Récapitulatif de la matière dans la classe de l'affectation. */
  async recapitulatif(ctx: HttpContext) {
    const { affectation, periode } = await selection(ctx)
    if (!periode) return { periode: null, synthese: null, eleves: [] }
    const r = await MoyenneService.resultatsClasse(affectation.classeId, periode.id, 'toutes')
    const valeurs = r.lignes.map((l) => l.moyennes[affectation.matiereId] ?? null)
    return {
      periode: { id: periode.id, libelle: periode.libelle },
      synthese: {
        classe: affectation.classe.libelle,
        matiere: affectation.matiere.libelle,
        effectif: r.lignes.length,
        ...MoyenneService.statistiques(valeurs),
        reussite: MoyenneService.tauxReussite(valeurs),
      },
      eleves: r.lignes
        .map((l) => ({
          id: l.eleveId,
          nom: l.nom,
          prenoms: l.prenoms,
          moyenne: l.moyennes[affectation.matiereId] ?? null,
          rang: l.rangs[affectation.matiereId] ?? null,
        }))
        .sort((x, y) => (y.moyenne ?? -1) - (x.moyenne ?? -1)),
    }
  }
}

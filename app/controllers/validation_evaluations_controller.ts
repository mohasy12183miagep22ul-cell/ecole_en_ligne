import db from '@adonisjs/lucid/services/db'
import Periode from '#models/periode'
import Affectation from '#models/affectation'
import EvaluationPolicy from '#policies/evaluation_policy'
import ChoixService from '#services/choix_service'
import EvaluationService from '#services/evaluation_service'
import { motifValidator } from '#validators/scolarite'
import { derogationValidator } from '#validators/notes'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

/**
 * Direction : validation des évaluations (RG12) et suivi des saisies par
 * classe, avec dérogations à la fenêtre de saisie (RG13).
 */
export default class ValidationEvaluationsController {
  async index(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('valider')
    const annee = ctx.anneeActive
    const onglet = ctx.request.input('onglet') === 'validees' ? 'validees' : 'a_valider'
    const page = Math.max(1, Number(ctx.request.input('page', 1)) || 1)
    if (!annee) {
      return ctx.inertia.render('direction/validation', {
        onglet,
        compteurs: { aValider: 0, validees: 0 },
        evaluations: [],
        pagination: { page: 1, dernierePage: 1, total: 0 },
      })
    }
    const { evaluations, pagination } = await EvaluationService.listerAvecStatistiques({
      anneeId: annee.id,
      etats: onglet === 'validees' ? ['validee'] : ['soumise'],
      page,
    })
    const compte = async (etat: string) => {
      const [ligne] = await db
        .from('evaluations as ev')
        .join('affectations as a', 'a.id', 'ev.affectation_id')
        .where('a.annee_id', annee.id)
        .where('ev.etat', etat)
        .whereNull('ev.deleted_at')
        .count('* as n')
      return Number(ligne.n)
    }
    return ctx.inertia.render('direction/validation', {
      onglet,
      compteurs: { aValider: await compte('soumise'), validees: await compte('validee') },
      evaluations,
      pagination: pagination!,
    })
  }

  async valider(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('valider')
    const ev = await EvaluationService.trouver(ctx.params.id)
    await EvaluationService.valider(ev, auteur(ctx))
    ctx.session.flash('success', `« ${ev.titre} » validée`)
    return ctx.response.redirect().back()
  }

  async renvoyer(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('valider')
    const ev = await EvaluationService.trouver(ctx.params.id)
    const { motif } = await ctx.request.validateUsing(motifValidator)
    await EvaluationService.renvoyer(ev, motif, auteur(ctx))
    ctx.session.flash('success', `« ${ev.titre} » renvoyée à l’enseignant`)
    return ctx.response.redirect().back()
  }

  async deverrouiller(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('deverrouiller')
    const ev = await EvaluationService.trouver(ctx.params.id)
    const { motif } = await ctx.request.validateUsing(motifValidator)
    await EvaluationService.deverrouiller(ev, motif, auteur(ctx))
    ctx.session.flash('success', `« ${ev.titre} » déverrouillée : retour au brouillon`)
    return ctx.response.redirect().back()
  }

  /** Suivi des saisies : une ligne par affectation de l'année, pour la période choisie. */
  async suivi(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('valider')
    const annee = ctx.anneeActive
    if (!annee) return ctx.inertia.render('direction/suivi', { choix: null, lignes: [] })
    const periodes = await EvaluationService.periodes(annee.id)
    const periode =
      periodes.find((p) => p.id === Number(ctx.request.input('periode'))) ??
      EvaluationService.periodeCourante(periodes)
    const classes = await ChoixService.classes(annee.id)
    const classeId = Number(ctx.request.input('classe')) || null

    const lignes = await EvaluationService.suiviSaisies(annee.id, periode, classeId)

    return ctx.inertia.render('direction/suivi', {
      choix: {
        periodes: periodes.map((p) => ({ id: p.id, libelle: p.libelle })),
        periode: periode
          ? {
              id: periode.id,
              libelle: periode.libelle,
              debut: periode.debutSaisie.toFormat('dd/MM/yyyy'),
              fin: periode.finSaisie.toFormat('dd/MM/yyyy'),
            }
          : null,
        classes: classes.map((c) => ({ id: c.id, libelle: c.libelle })),
        classe: classeId,
      },
      lignes: lignes.map((l) => ({
        ...l,
        derogation: l.derogation ? l.derogation.toFormat('dd/MM/yyyy') : null,
      })),
    })
  }

  async derogation(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('valider')
    const d = await ctx.request.validateUsing(derogationValidator)
    const affectation = await Affectation.query()
      .where('id', d.affectationId)
      .whereNull('deleted_at')
      .firstOrFail()
    const periode = await Periode.query()
      .where('id', d.periodeId)
      .whereNull('deleted_at')
      .firstOrFail()
    await EvaluationService.accorderDerogation(
      affectation,
      periode,
      d.jusquAu,
      d.motif,
      auteur(ctx)
    )
    ctx.session.flash('success', `Dérogation accordée jusqu’au ${d.jusquAu.toFormat('dd/MM/yyyy')}`)
    return ctx.response.redirect().back()
  }
}

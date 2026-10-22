import InscriptionPolicy from '#policies/inscription_policy'
import InscriptionService from '#services/inscription_service'
import { versDossier } from '#controllers/inscriptions_controller'
import { motifValidator, validerInscriptionValidator } from '#validators/scolarite'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

/** Validation des inscriptions par la direction (RG5 à RG8). */
export default class ValidationInscriptionsController {
  async index(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('valider')
    const annee = ctx.anneeActive
    const page = Math.max(1, Number(ctx.request.input('page', 1)) || 1)
    if (!annee) {
      return ctx.inertia.render('direction/inscriptions', {
        annee: null,
        classes: [],
        dossiers: [],
        pagination: { page: 1, dernierePage: 1, total: 0 },
      })
    }
    const resultat = await InscriptionService.dossiers(annee.id, ['soumis'], false, page)
    return ctx.inertia.render('direction/inscriptions', {
      annee: { id: annee.id, libelle: annee.libelle },
      classes: await InscriptionService.classesAvecEffectif(annee.id),
      dossiers: resultat.all().map((i) => versDossier(i)),
      pagination: {
        page: resultat.currentPage,
        dernierePage: resultat.lastPage,
        total: resultat.total,
      },
    })
  }

  async valider(ctx: HttpContext) {
    const inscription = await InscriptionService.trouver(ctx.params.id)
    await ctx.bouncer.with(InscriptionPolicy).authorize('valider', inscription)
    const d = await ctx.request.validateUsing(validerInscriptionValidator)
    await InscriptionService.valider(
      inscription,
      { classeId: d.classeId, forcer: Boolean(d.forcer), motifDepassement: d.motifDepassement },
      auteur(ctx)
    )
    ctx.session.flash('success', `Inscription de ${inscription.eleve.nomComplet} validée`)
    return ctx.response.redirect().back()
  }

  async refuser(ctx: HttpContext) {
    const inscription = await InscriptionService.trouver(ctx.params.id)
    await ctx.bouncer.with(InscriptionPolicy).authorize('valider', inscription)
    const { motif } = await ctx.request.validateUsing(motifValidator)
    await InscriptionService.refuser(inscription, motif, auteur(ctx))
    ctx.session.flash('success', `Inscription de ${inscription.eleve.nomComplet} refusée`)
    return ctx.response.redirect().back()
  }
}

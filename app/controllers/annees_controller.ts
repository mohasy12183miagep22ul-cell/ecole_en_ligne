import Periode from '#models/periode'
import { gererStructure } from '#abilities/main'
import AnneeScolaireService from '#services/annee_scolaire_service'
import {
  creerAnneeValidator,
  dupliquerAnneeValidator,
  periodeValidator,
} from '#validators/structure'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

export default class AnneesController {
  async index({ inertia, bouncer }: HttpContext) {
    await bouncer.authorize(gererStructure)
    const annees = await AnneeScolaireService.lister().withCount('classes', (q) =>
      q.whereNull('deleted_at')
    )
    return inertia.render('admin/annees', {
      annees: annees.map((a) => ({
        id: a.id,
        libelle: a.libelle,
        etat: a.etat,
        decoupage: a.decoupage,
        dateDebut: a.dateDebut.toISODate()!,
        dateFin: a.dateFin.toISODate()!,
        classes: Number(a.$extras.classes_count),
        periodes: a.periodes.map((p) => ({
          id: p.id,
          libelle: p.libelle,
          ordre: p.ordre,
          debutSaisie: p.debutSaisie.toISODate()!,
          finSaisie: p.finSaisie.toISODate()!,
          etatSaisie: AnneeScolaireService.etatSaisie(a, p),
        })),
      })),
    })
  }

  async store(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const donnees = await ctx.request.validateUsing(creerAnneeValidator)
    const annee = await AnneeScolaireService.creer(donnees, auteur(ctx))
    ctx.session.flash('success', `Année ${annee.libelle} créée en préparation`)
    return ctx.response.redirect().toRoute('admin.annees')
  }

  async activer(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const annee = await AnneeScolaireService.trouver(ctx.params.id)
    await AnneeScolaireService.activer(annee, auteur(ctx))
    ctx.session.flash('success', `Année ${annee.libelle} active`)
    return ctx.response.redirect().back()
  }

  async cloturer(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const annee = await AnneeScolaireService.trouver(ctx.params.id)
    await AnneeScolaireService.cloturer(annee, auteur(ctx))
    ctx.session.flash('success', `Année ${annee.libelle} clôturée`)
    return ctx.response.redirect().back()
  }

  async dupliquer(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const source = await AnneeScolaireService.trouver(ctx.params.id)
    const cible = await ctx.request.validateUsing(dupliquerAnneeValidator)
    const annee = await AnneeScolaireService.dupliquer(source, cible, auteur(ctx))
    ctx.session.flash('success', `Année ${annee.libelle} créée à partir de ${source.libelle}`)
    return ctx.response.redirect().toRoute('admin.annees')
  }

  async updatePeriode(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const periode = await Periode.query()
      .where('id', ctx.params.id)
      .whereNull('deleted_at')
      .firstOrFail()
    const donnees = await ctx.request.validateUsing(periodeValidator)
    await AnneeScolaireService.modifierPeriode(periode, donnees, auteur(ctx))
    ctx.session.flash('success', 'Période enregistrée')
    return ctx.response.redirect().back()
  }
}

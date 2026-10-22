import ChoixService from '#services/choix_service'
import { gererStructure } from '#abilities/main'
import ClasseService from '#services/classe_service'
import StructureService from '#services/structure_service'
import AnneeScolaireService from '#services/annee_scolaire_service'
import { classeValidator } from '#validators/structure'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

export default class ClassesController {
  async index(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const annee = await AnneeScolaireService.selectionner(
      Number(ctx.request.input('annee')) || undefined,
      ctx.anneeActive
    )
    const classes = annee ? await ClasseService.lister(annee.id) : []

    const niveaux = await StructureService.niveaux()
    return ctx.inertia.render('admin/classes', {
      annee: annee ? { id: annee.id, libelle: annee.libelle, etat: annee.etat } : null,
      annees: await ChoixService.annees(),
      niveaux: niveaux.map((n) => ({ id: n.id, libelle: n.libelle })),
      enseignants: await ChoixService.enseignantsActifs(),
      classes: classes.map((c) => ({
        id: c.id,
        libelle: c.libelle,
        niveauId: c.niveauId,
        niveau: c.niveau.libelle,
        capacite: c.capacite,
        salle: c.salle,
        professeurPrincipalId: c.professeurPrincipalId,
        professeurPrincipal: c.professeurPrincipal?.fullName ?? null,
      })),
    })
  }

  async store(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const annee = await AnneeScolaireService.trouver(ctx.params.anneeId)
    const donnees = await ctx.request.validateUsing(classeValidator)
    await ClasseService.creer(annee, donnees, auteur(ctx))
    ctx.session.flash('success', `Classe ${donnees.libelle} créée`)
    return ctx.response.redirect().back()
  }

  async update(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const classe = await ClasseService.trouver(ctx.params.id)
    const donnees = await ctx.request.validateUsing(classeValidator)
    await ClasseService.modifier(classe, donnees, auteur(ctx))
    ctx.session.flash('success', `Classe ${donnees.libelle} enregistrée`)
    return ctx.response.redirect().back()
  }
}

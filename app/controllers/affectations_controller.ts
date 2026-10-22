import Affectation from '#models/affectation'
import { gererStructure } from '#abilities/main'
import ClasseService from '#services/classe_service'
import StructureService from '#services/structure_service'
import AffectationService from '#services/affectation_service'
import AnneeScolaireService from '#services/annee_scolaire_service'
import { affectationValidator } from '#validators/structure'
import ChoixService from '#services/choix_service'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

export default class AffectationsController {
  async index(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const annee = await AnneeScolaireService.selectionner(
      Number(ctx.request.input('annee')) || undefined,
      ctx.anneeActive
    )
    const [affectations, classes, programme] = annee
      ? await Promise.all([
          AffectationService.lister(annee.id),
          ClasseService.lister(annee.id),
          StructureService.programme(),
        ])
      : [[], [], []]

    const matieres = await StructureService.matieres()
    return ctx.inertia.render('admin/affectations', {
      annee: annee ? { id: annee.id, libelle: annee.libelle, etat: annee.etat } : null,
      annees: await ChoixService.annees(),
      enseignants: await ChoixService.enseignantsActifs(),
      classes: classes.map((c) => ({ id: c.id, libelle: c.libelle, niveauId: c.niveauId })),
      matieres: matieres.map((m) => ({ id: m.id, code: m.code, libelle: m.libelle })),
      programme: programme.map((p) => ({ niveauId: p.niveauId, matiereId: p.matiereId })),
      affectations: affectations.map((a) => ({
        id: a.id,
        enseignantId: a.enseignantId,
        enseignant: a.enseignant.fullName ?? a.enseignant.email,
        classe: a.classe.libelle,
        matiere: a.matiere.libelle,
        matiereCode: a.matiere.code,
      })),
    })
  }

  async store(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const annee = await AnneeScolaireService.trouver(ctx.params.anneeId)
    const donnees = await ctx.request.validateUsing(affectationValidator)
    await AffectationService.creer(annee, donnees, auteur(ctx))
    ctx.session.flash('success', 'Affectation enregistrée')
    return ctx.response.redirect().back()
  }

  async destroy(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const affectation = await Affectation.query()
      .where('id', ctx.params.id)
      .whereNull('deleted_at')
      .firstOrFail()
    await AffectationService.retirer(affectation, auteur(ctx))
    ctx.session.flash('success', 'Affectation retirée')
    return ctx.response.redirect().back()
  }
}

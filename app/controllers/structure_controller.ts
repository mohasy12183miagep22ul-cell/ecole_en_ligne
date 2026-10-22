import { gererStructure } from '#abilities/main'
import StructureService from '#services/structure_service'
import {
  coefficientValidator,
  matiereValidator,
  niveauValidator,
  obligatoireValidator,
} from '#validators/structure'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

export default class StructureController {
  async index({ inertia, bouncer }: HttpContext) {
    await bouncer.authorize(gererStructure)
    const [niveaux, matieres, programme] = await Promise.all([
      StructureService.niveaux(),
      StructureService.matieres(),
      StructureService.programme(),
    ])
    return inertia.render('admin/structure', {
      niveaux: niveaux.map((n) => ({
        id: n.id,
        code: n.code,
        libelle: n.libelle,
        ordre: n.ordre,
        cycle: n.cycle,
      })),
      matieres: matieres.map((m) => ({
        id: m.id,
        code: m.code,
        libelle: m.libelle,
        famille: m.famille,
        noteMaxDefaut: m.noteMaxDefaut,
      })),
      coefficients: programme.map((p) => ({
        niveauId: p.niveauId,
        matiereId: p.matiereId,
        coefficient: p.coefficient,
        obligatoire: p.obligatoire,
      })),
    })
  }

  async storeNiveau(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const donnees = await ctx.request.validateUsing(niveauValidator)
    await StructureService.creerNiveau(donnees, auteur(ctx))
    ctx.session.flash('success', `Niveau ${donnees.libelle} créé`)
    return ctx.response.redirect().back()
  }

  async storeMatiere(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const donnees = await ctx.request.validateUsing(matiereValidator)
    await StructureService.creerMatiere(donnees, auteur(ctx))
    ctx.session.flash('success', `Matière ${donnees.libelle} créée`)
    return ctx.response.redirect().back()
  }

  async updateCoefficient(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const { niveauId, matiereId, coefficient } =
      await ctx.request.validateUsing(coefficientValidator)
    await StructureService.definirCoefficient(niveauId, matiereId, coefficient, auteur(ctx))
    return ctx.response.redirect().back()
  }

  async updateObligatoire(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const { niveauId, matiereId, obligatoire } =
      await ctx.request.validateUsing(obligatoireValidator)
    await StructureService.definirObligatoire(niveauId, matiereId, obligatoire, auteur(ctx))
    return ctx.response.redirect().back()
  }
}

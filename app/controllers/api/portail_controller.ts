import Eleve from '#models/eleve'
import ElevePolicy from '#policies/eleve_policy'
import PortailService from '#services/portail_service'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * API mobile · portail famille (RG20) : lecture seule des élèves rattachés.
 * Un identifiant opaque illisible ou un élève non rattaché reçoivent la même
 * réponse 404, pour ne rien révéler de l'existence d'un dossier.
 */
export default class PortailController {
  async enfants(ctx: HttpContext) {
    return { enfants: await PortailService.enfants(ctx.auth.getUserOrFail(), ctx.anneeActive) }
  }

  async enfant(ctx: HttpContext) {
    const id = PortailService.demasquer(String(ctx.params.id))
    const eleve = id ? await Eleve.query().where('id', id).whereNull('deleted_at').first() : null
    if (!eleve || (await ctx.bouncer.with(ElevePolicy).denies('consulterFamille', eleve))) {
      return ctx.response.notFound({ code: 'E_INTROUVABLE', message: 'Dossier introuvable.' })
    }
    return { enfant: await PortailService.dossier(eleve, ctx.anneeActive) }
  }
}

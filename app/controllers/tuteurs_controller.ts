import ElevePolicy from '#policies/eleve_policy'
import Tuteur from '#models/tuteur'
import EleveService from '#services/eleve_service'
import TuteurService from '#services/tuteur_service'
import { accesPortailValidator, tuteurValidator } from '#validators/scolarite'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

/**
 * Tuteurs d'un élève (§ 3). Chaque action part de l'élève : un tuteur
 * n'est manipulé qu'à travers un élève auquel il est rattaché.
 */
export default class TuteursController {
  async #eleve(ctx: HttpContext) {
    const eleve = await EleveService.trouver(ctx.params.id)
    await ctx.bouncer.with(ElevePolicy).authorize('modifier', eleve)
    return eleve
  }

  /** Nouveau tuteur saisi. */
  async store(ctx: HttpContext) {
    const eleve = await this.#eleve(ctx)
    const donnees = await ctx.request.validateUsing(tuteurValidator)
    await TuteurService.ajouter(eleve, { donnees }, auteur(ctx))
    ctx.session.flash('success', `${donnees.nom} rattaché comme tuteur`)
    return ctx.response.redirect().back()
  }

  /** Tuteur déjà connu (fratrie). */
  async rattacher(ctx: HttpContext) {
    const eleve = await this.#eleve(ctx)
    const tuteur = await Tuteur.query()
      .where('id', ctx.params.tuteurId)
      .whereNull('deleted_at')
      .firstOrFail()
    await TuteurService.ajouter(eleve, { id: tuteur.id }, auteur(ctx))
    ctx.session.flash('success', `${tuteur.nom} rattaché comme tuteur`)
    return ctx.response.redirect().back()
  }

  async principal(ctx: HttpContext) {
    const eleve = await this.#eleve(ctx)
    await TuteurService.definirPrincipal(eleve, Number(ctx.params.tuteurId), auteur(ctx))
    ctx.session.flash('success', 'Tuteur principal désigné')
    return ctx.response.redirect().back()
  }

  async detacher(ctx: HttpContext) {
    const eleve = await this.#eleve(ctx)
    await TuteurService.detacher(eleve, Number(ctx.params.tuteurId), auteur(ctx))
    ctx.session.flash('success', 'Tuteur détaché de l’élève')
    return ctx.response.redirect().back()
  }

  async update(ctx: HttpContext) {
    const eleve = await this.#eleve(ctx)
    const tuteur = this.#trouver(eleve, ctx)
    if (!tuteur) return ctx.response.notFound()
    const donnees = await ctx.request.validateUsing(tuteurValidator)
    await TuteurService.modifier(tuteur, donnees, auteur(ctx))
    ctx.session.flash('success', 'Tuteur enregistré')
    return ctx.response.redirect().back()
  }

  /** Accès au portail famille : mot de passe provisoire affiché une seule fois. */
  async acces(ctx: HttpContext) {
    const eleve = await this.#eleve(ctx)
    const tuteur = this.#trouver(eleve, ctx)
    if (!tuteur) return ctx.response.notFound()
    const { email } = await ctx.request.validateUsing(accesPortailValidator)
    const compte = await TuteurService.creerAccesPortail(tuteur, email, auteur(ctx))
    ctx.session.flash('compteCree', { nom: tuteur.nom, ...compte })
    return ctx.response.redirect().back()
  }

  #trouver(eleve: Awaited<ReturnType<typeof EleveService.trouver>>, ctx: HttpContext) {
    return eleve.tuteurs.find((t) => t.id === Number(ctx.params.tuteurId)) ?? null
  }
}

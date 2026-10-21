import app from '@adonisjs/core/services/app'
import MessagerieService from '#services/messagerie_service'
import ReinitialisationService from '#services/reinitialisation_service'
import { motDePasseOublieValidator, reinitialiserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class MotDePasseOublieController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/mot_de_passe_oublie', {})
  }

  /**
   * Même réponse que le compte existe ou non. Le lien n'est affiché qu'en
   * développement sans envoi réel de courriel.
   */
  async store({ request, inertia }: HttpContext) {
    const { email } = await request.validateUsing(motDePasseOublieValidator)
    const lien = await ReinitialisationService.demander(email, request.ip())
    const lienDeveloppement = !app.inProduction && !MessagerieService.envoiReel ? lien : null
    return inertia.render('auth/lien_envoye', { email, lienDeveloppement })
  }

  async edit({ params, inertia }: HttpContext) {
    const valide = Boolean(await ReinitialisationService.jetonValide(params.jeton))
    return inertia.render('auth/reinitialiser', { jeton: String(params.jeton), valide })
  }

  async update({ params, request, response, session }: HttpContext) {
    const { nouveau } = await request.validateUsing(reinitialiserValidator)
    const ok = await ReinitialisationService.reinitialiser(params.jeton, nouveau, request.ip())
    if (!ok) {
      session.flash('error', 'Ce lien n’est plus valable. Faites une nouvelle demande.')
      return response.redirect().toRoute('mot_de_passe_oublie.create')
    }
    session.flash('success', 'Mot de passe modifié. Vous pouvez vous connecter.')
    return response.redirect().toRoute('session.create')
  }
}

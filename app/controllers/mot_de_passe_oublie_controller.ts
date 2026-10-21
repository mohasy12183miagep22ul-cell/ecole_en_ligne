import { motDePasseOublieValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class MotDePasseOublieController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/mot_de_passe_oublie', {})
  }

  /**
   * Démonstration : aucun courriel n'est envoyé. La réponse est identique
   * que le compte existe ou non, pour ne pas révéler les adresses inscrites.
   */
  async store({ request, inertia }: HttpContext) {
    const { email } = await request.validateUsing(motDePasseOublieValidator)
    return inertia.render('auth/lien_envoye', { email })
  }
}

import AuthentificationService from '#services/authentification_service'
import { changerMotDePasseValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfilController {
  async show({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return inertia.render('profil', { changementImpose: user.doitChangerMotDePasse })
  }

  async changerMotDePasse({ request, auth, response, session }: HttpContext) {
    const { actuel, nouveau } = await request.validateUsing(changerMotDePasseValidator)
    const user = auth.getUserOrFail()
    const resultat = await AuthentificationService.changerMotDePasse(
      user,
      actuel,
      nouveau,
      request.ip()
    )

    if (!resultat.ok) {
      session.flash('inputErrorsBag', { [resultat.champ]: resultat.message })
      return response.redirect().back()
    }

    session.flash('success', 'Mot de passe modifié')
    await user.load('rolesUtilisateur')
    return response.redirect(user.accueil)
  }
}

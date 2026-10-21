import User from '#models/user'
import app from '@adonisjs/core/services/app'
import AuthentificationService from '#services/authentification_service'
import CodeVerificationService from '#services/code_verification_service'
import { codeValidator, loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

const MESSAGE_IDENTIFIANTS = 'Adresse e-mail ou mot de passe incorrect.'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/connexion', {})
  }

  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const resultat = await AuthentificationService.verifierIdentifiants(
      email,
      password,
      request.ip()
    )

    if (!resultat.ok) {
      const message =
        resultat.raison === 'verrouille'
          ? `Compte temporairement verrouillé après plusieurs échecs. Réessayez après ${resultat.jusqua.setZone('Africa/Conakry').toFormat('HH:mm')}.`
          : MESSAGE_IDENTIFIANTS
      session.flashExcept(['password'])
      session.flash('inputErrorsBag', { connexion: message })
      return response.redirect().back()
    }

    const user = resultat.user
    if (user.doubleFacteur) {
      const code = CodeVerificationService.emettre(session, user)
      if (!app.inProduction) session.flash('codeDeveloppement', code)
      return response.redirect('/connexion/verification')
    }

    await auth.use('web').login(user)
    await user.load('rolesUtilisateur')
    response.redirect(user.accueil)
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    response.redirect().toRoute('session.create')
  }

  /**
   * Écran de vérification en deux étapes.
   */
  async createCode({ inertia, session, response }: HttpContext) {
    const attente = CodeVerificationService.enAttente(session)
    const user = attente ? await User.find(attente.userId) : null
    if (!user) return response.redirect().toRoute('session.create')

    // Hors production, aucun courriel n'est envoyé : le code est affiché.
    const codeDeveloppement = app.inProduction
      ? null
      : ((session.flashMessages.get('codeDeveloppement') as string | undefined) ?? null)
    return inertia.render('auth/double_facteur', { email: user.email, codeDeveloppement })
  }

  async storeCode({ request, auth, response, session }: HttpContext) {
    const { code } = await request.validateUsing(codeValidator)
    const userId = CodeVerificationService.verifier(session, code)
    const user = userId
      ? await User.query().where('id', userId).whereNull('deleted_at').first()
      : null

    if (!user || !user.actif) {
      // Code faux, expiré ou trop d'essais : on reste sur l'écran tant que
      // le code est encore utilisable, sinon retour à la connexion.
      if (CodeVerificationService.enAttente(session)) {
        session.flash('inputErrorsBag', { code: 'Code incorrect.' })
        return response.redirect().back()
      }
      session.flash('error', 'Code expiré ou trop d’essais. Reconnectez-vous.')
      return response.redirect().toRoute('session.create')
    }

    await auth.use('web').login(user)
    await user.load('rolesUtilisateur')
    response.redirect(user.accueil)
  }

  /**
   * Émet un nouveau code (l'ancien devient invalide).
   */
  async renvoyerCode({ session, response }: HttpContext) {
    const attente = CodeVerificationService.enAttente(session)
    const user = attente ? await User.find(attente.userId) : null
    if (!user) return response.redirect().toRoute('session.create')

    const code = CodeVerificationService.emettre(session, user)
    if (!app.inProduction) session.flash('codeDeveloppement', code)
    return response.redirect().back()
  }
}

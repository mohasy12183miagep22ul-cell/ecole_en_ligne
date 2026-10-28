import User from '#models/user'
import JetonService from '#services/jeton_service'
import MessagerieService from '#services/messagerie_service'
import ReinitialisationService from '#services/reinitialisation_service'
import AuthentificationService from '#services/authentification_service'
import CodeVerificationService from '#services/code_verification_service'
import { versUtilisateur } from '#controllers/api/moi_controller'
import {
  connexionMobileValidator,
  defiValidator,
  motDePasseOublieValidator,
  renvoyerDefiValidator,
} from '#validators/user'
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'

const MESSAGE_IDENTIFIANTS = 'Adresse e-mail ou mot de passe incorrect.'

const connecte = async (user: User, appareil?: string) => ({
  statut: 'connecte' as const,
  jeton: await JetonService.emettre(user, appareil),
  utilisateur: await versUtilisateur(user),
})

const doubleFacteur = (defi: string, code: string, email: string) => ({
  statut: 'double_facteur' as const,
  defi,
  email,
  // Rendu seulement quand aucun courriel ne part (développement).
  codeDeveloppement: CodeVerificationService.codeAffichable ? code : null,
})

/**
 * API mobile · authentification par jeton. Mêmes règles que le web (§ 12) :
 * verrouillage après 5 échecs, second facteur pour direction et
 * administrateur, connexions échouées journalisées.
 */
export default class AuthController {
  async connexion({ request, response }: HttpContext) {
    const { email, password, appareil } = await request.validateUsing(connexionMobileValidator)
    const resultat = await AuthentificationService.verifierIdentifiants(
      email,
      password,
      request.ip()
    )
    if (!resultat.ok) {
      if (resultat.raison === 'verrouille') {
        return response.status(423).send({
          code: 'E_COMPTE_VERROUILLE',
          message: 'Compte temporairement verrouillé après plusieurs échecs.',
          jusqua: resultat.jusqua.toISO(),
        })
      }
      return response.unauthorized({ code: 'E_IDENTIFIANTS', message: MESSAGE_IDENTIFIANTS })
    }

    const user = resultat.user
    if (user.doubleFacteur) {
      const { defi, code } = await CodeVerificationService.emettreDefi(user)
      return doubleFacteur(defi, code, user.email)
    }
    return connecte(user, appareil)
  }

  async verification({ request, response }: HttpContext) {
    const { defi, code, appareil } = await request.validateUsing(defiValidator)
    const userId = await CodeVerificationService.verifierDefi(defi, code)
    const user = userId
      ? await User.query().where('id', userId).whereNull('deleted_at').first()
      : null

    if (!user || !user.actif) {
      // Tant que le défi reste utilisable, l'application garde l'écran du code.
      const encore = Boolean(await CodeVerificationService.defiEnAttente(defi))
      return response.unauthorized({
        code: encore ? 'E_CODE_INCORRECT' : 'E_DEFI_EXPIRE',
        message: encore ? 'Code incorrect.' : 'Code expiré ou trop d’essais. Reconnectez-vous.',
      })
    }
    return connecte(user, appareil)
  }

  /** Nouveau code pour le même défi (l'ancien code devient invalide). */
  async renvoyer({ request, response }: HttpContext) {
    const { defi: id } = await request.validateUsing(renvoyerDefiValidator)
    const defi = await CodeVerificationService.defiEnAttente(id)
    const user = defi ? await User.find(defi.userId) : null
    if (!defi || !user) {
      return response.unauthorized({
        code: 'E_DEFI_EXPIRE',
        message: 'Code expiré ou trop d’essais. Reconnectez-vous.',
      })
    }
    const { code } = await CodeVerificationService.emettreDefi(user, defi)
    return doubleFacteur(defi.id, code, user.email)
  }

  /** Même réponse que le compte existe ou non. */
  async motDePasseOublie({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(motDePasseOublieValidator)
    const lien = await ReinitialisationService.demander(email, request.ip())
    return response.accepted({
      message: 'Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.',
      lienDeveloppement: !app.inProduction && !MessagerieService.envoiReel ? lien : null,
    })
  }

  async deconnexion({ auth, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    await JetonService.revoquer(user.currentAccessToken)
    return response.noContent()
  }
}

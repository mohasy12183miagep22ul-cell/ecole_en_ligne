import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Compte créé par l'administrateur : tant que le mot de passe initial n'est
 * pas changé, seul l'écran de profil (changement de mot de passe) et la
 * déconnexion sont accessibles.
 */
export default class MotDePasseImposeMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (user?.doitChangerMotDePasse) {
      return ctx.response.redirect().toRoute('profil')
    }
    return next()
  }
}

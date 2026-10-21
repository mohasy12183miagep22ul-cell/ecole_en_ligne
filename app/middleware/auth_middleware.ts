import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

    // Un compte désactivé ou supprimé pendant la session perd l'accès à la
    // requête suivante, sans attendre l'expiration de la session.
    const user = ctx.auth.getUserOrFail()
    if (!user.actif || user.deletedAt) {
      await ctx.auth.use('web').logout()
      ctx.session.flash('error', 'Ce compte est désactivé.')
      return ctx.response.redirect(this.redirectTo)
    }

    return next()
  }
}

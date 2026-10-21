import type { Role } from '#models/role_utilisateur'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Ouvre un espace aux seuls rôles autorisés (il suffit d'en détenir un) ;
 * les autres sont renvoyés vers leur propre accueil. C'est la barrière
 * d'écran : l'autorisation sur chaque ressource reste du ressort des
 * policies Bouncer.
 */
export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, roles: Role[]) {
    const user = ctx.auth.getUserOrFail()
    await user.load('rolesUtilisateur')
    if (!user.aLeRole(...roles)) {
      return ctx.response.redirect(user.accueil)
    }
    return next()
  }
}

import type User from '#models/user'
import type { Role } from '#models/role_utilisateur'
import JetonService from '#services/jeton_service'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

type Options = {
  /** Rôles admis (il suffit d'en détenir un) ; absent : tout compte connecté. */
  roles?: Role[]
  /** Accessible même si le mot de passe initial doit encore être changé. */
  motDePasseLibre?: boolean
}

/**
 * Barrière de l'API mobile, équivalent des middlewares `auth`,
 * `motDePasseImpose` et `role` du web, avec des réponses JSON au lieu de
 * redirections. L'autorisation sur chaque ressource reste aux policies.
 */
export default class ApiMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: Options = {}) {
    // Par l'authentificateur (et non le garde seul) : `ctx.auth.user`, lu par
    // Bouncer, désigne alors le compte du jeton.
    const user = (await ctx.auth.authenticateUsing(['api'])) as User

    // Un compte désactivé ou supprimé perd l'accès à la requête suivante.
    if (!user.actif || user.deletedAt) {
      await JetonService.revoquerTous(user)
      return ctx.response.unauthorized({
        code: 'E_COMPTE_DESACTIVE',
        message: 'Ce compte est désactivé.',
      })
    }

    if (user.doitChangerMotDePasse && !options.motDePasseLibre) {
      return ctx.response.forbidden({
        code: 'E_MOT_DE_PASSE_A_CHANGER',
        message: 'Changez votre mot de passe initial pour continuer.',
      })
    }

    if (options.roles) {
      await user.load('rolesUtilisateur')
      if (!user.aLeRole(...options.roles)) {
        return ctx.response.forbidden({
          code: 'E_ROLE',
          message: 'Cet espace n’est pas ouvert à votre profil.',
        })
      }
    }

    return next()
  }
}

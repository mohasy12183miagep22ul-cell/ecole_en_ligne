import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Toute réponse de l'API mobile est du JSON, erreurs comprises (validation,
 * règle de gestion, refus d'accès), quel que soit l'en-tête Accept envoyé.
 */
export default class ForceJsonMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.request.request.headers.accept = 'application/json'
    return next()
  }
}

import AnneeScolaire from '#models/annee_scolaire'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Injecte l'année scolaire active dans chaque requête (`ctx.anneeActive`) :
 * les services métier filtrent toujours sur une année (architecture, règle 5).
 * Vaut `null` entre la clôture d'une année et l'activation de la suivante.
 */
export default class AnneeActiveMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.anneeActive = await AnneeScolaire.active()
    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    anneeActive: AnneeScolaire | null
  }
}

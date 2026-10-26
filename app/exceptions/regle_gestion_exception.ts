import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Refus d'une opération par une règle de gestion (RG1, RG2…). Levée par les
 * services ; rendue comme un message d'erreur sur l'écran d'origine, sans que
 * le contrôleur ait à s'en occuper. Une requête JSON (enregistrement
 * automatique de la grille de notes) reçoit le message en JSON.
 */
export default class RegleGestionException extends Exception {
  static status = 422
  static code = 'E_REGLE_GESTION'

  constructor(
    message: string,
    /** Règle du cahier des charges concernée, ex. « RG2 ». */
    public regle?: string
  ) {
    super(message)
  }

  async handle(error: this, ctx: HttpContext) {
    if (ctx.request.accepts(['html', 'json']) === 'json') {
      return ctx.response.status(422).send({ message: error.message, regle: error.regle ?? null })
    }
    ctx.session.flash('error', error.message)
    return ctx.response.redirect().back()
  }
}

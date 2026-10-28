import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * État du service, sans authentification : l'API répond et la base est
 * joignable. Aucune donnée métier ni détail technique dans la réponse.
 */
export default class SanteController {
  async show({ response }: HttpContext) {
    const verifieLe = new Date().toISOString()
    try {
      await db.rawQuery('select 1')
      return response.ok({ statut: 'ok', base: 'ok', verifieLe })
    } catch (error) {
      logger.error({ err: error }, 'Contrôle de santé : base injoignable')
      return response.serviceUnavailable({ statut: 'degrade', base: 'injoignable', verifieLe })
    }
  }
}

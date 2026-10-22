import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import DocumentsGeneresService from '#services/documents_generes_service'

interface GenererDocumentPayload {
  fichierId: number
}

/**
 * Génération d'un document en file d'attente (PDF ou Excel). L'échec est
 * consigné sur le fichier, visible dans « Mes documents ».
 */
export default class GenererDocumentJob extends Job<GenererDocumentPayload> {
  static options: JobOptions = {
    queue: 'default',
    maxRetries: 1,
  }

  async execute() {
    await DocumentsGeneresService.traiter(this.payload.fichierId)
  }
}

import { consulterJournal } from '#abilities/main'
import JournalService from '#services/journal_service'
import type { HttpContext } from '@adonisjs/core/http'
import type { JSONDataTypes } from '@adonisjs/core/types/transformers'

/** Valeurs avant/après stockées en jsonb : renvoyées telles quelles à la page. */
type Valeurs = { [cle: string]: JSONDataTypes } | null

/**
 * Journal d'activité (RG22) : lecture seule, réservé à la direction et à
 * l'administrateur, du plus récent au plus ancien.
 */
export default class JournalController {
  async index({ inertia, request, bouncer }: HttpContext) {
    await bouncer.authorize(consulterJournal)
    const page = Math.max(1, Number(request.input('page', 1)) || 1)

    const resultat = await JournalService.lister(page)
    const meta = resultat.getMeta()

    return inertia.render('admin/journal', {
      entrees: resultat.all().map((e) => ({
        id: Number(e.id),
        action: e.action,
        entite: e.entite,
        entiteId: e.entiteId,
        avant: e.avant as Valeurs,
        apres: e.apres as Valeurs,
        ip: e.ip,
        auteur: (e.$extras.auteur as string | null) ?? 'Système',
        date: e.createdAt.setZone('Africa/Conakry').toFormat("dd/MM/yyyy 'à' HH:mm"),
      })),
      pagination: { page: meta.currentPage, dernierePage: meta.lastPage, total: meta.total },
    })
  }
}

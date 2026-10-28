import EntreeJournal from '#models/entree_journal'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export type Trace = {
  /** Auteur de l'action ; `null` pour une action système ou anonyme. */
  userId: number | null
  action: string
  entite: string
  entiteId?: string | number | null
  avant?: Record<string, unknown> | null
  apres?: Record<string, unknown> | null
  ip?: string | null
}

/** Taille d'une page du journal (pagination serveur). */
const ENTREES_PAR_PAGE = 50

/**
 * Journal des opérations sensibles (RG22). Seul point d'écriture du journal ;
 * accepte la transaction de l'opération journalisée pour que l'entrée et
 * l'opération réussissent ou échouent ensemble.
 */
export default class JournalService {
  /** Lecture paginée, du plus récent au plus ancien, avec le nom de l'auteur. */
  static lister(page: number) {
    return EntreeJournal.query()
      .leftJoin('users', 'users.id', 'journal.user_id')
      .select('journal.*', 'users.full_name as auteur')
      .orderBy('journal.id', 'desc')
      .paginate(page, ENTREES_PAR_PAGE)
  }

  static async enregistrer(trace: Trace, trx?: TransactionClientContract) {
    return EntreeJournal.create(
      {
        userId: trace.userId,
        action: trace.action,
        entite: trace.entite,
        entiteId:
          trace.entiteId === undefined || trace.entiteId === null ? null : String(trace.entiteId),
        avant: trace.avant ?? null,
        apres: trace.apres ?? null,
        ip: trace.ip ?? null,
      },
      { client: trx }
    )
  }
}

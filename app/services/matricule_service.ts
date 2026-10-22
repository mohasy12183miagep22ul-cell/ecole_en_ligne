import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import RegleGestionException from '#exceptions/regle_gestion_exception'

/** RG4 : format AAAA-NNNNN. */
export const FORMAT_MATRICULE = /^\d{4}-\d{5}$/

/**
 * Attribution des matricules (RG4) : AAAA-NNNNN, où AAAA est l'année de
 * première inscription. Unique et immuable (contrainte et déclencheur en
 * base). Le compteur de l'année est verrouillé pendant l'attribution : deux
 * inscriptions simultanées n'obtiennent jamais le même numéro. Le compteur
 * repart toujours au-delà du plus grand matricule existant de l'année (cas
 * des matricules repris lors de l'import initial).
 */
export default class MatriculeService {
  static async attribuer(annee: number, trx: TransactionClientContract) {
    const prefixe = `${annee}-%`
    const plusGrand = `(SELECT COALESCE(MAX(CAST(SUBSTRING(matricule FROM 6) AS INTEGER)), 0)
                       FROM eleves WHERE matricule LIKE ?)`
    const resultat = await trx.rawQuery(
      `INSERT INTO compteurs_matricule (annee, dernier) VALUES (?, ${plusGrand} + 1)
       ON CONFLICT (annee) DO UPDATE
         SET dernier = GREATEST(compteurs_matricule.dernier, ${plusGrand}) + 1
       RETURNING dernier`,
      [annee, prefixe, prefixe]
    )
    const numero = Number(resultat.rows[0].dernier)
    if (numero > 99_999) {
      throw new RegleGestionException(
        `Plus aucun matricule disponible pour ${annee} (99 999 atteint).`,
        'RG4'
      )
    }
    return `${annee}-${String(numero).padStart(5, '0')}`
  }

  /** Un matricule existant (import) est-il valide et libre ? */
  static async estDisponible(matricule: string) {
    if (!FORMAT_MATRICULE.test(matricule)) return false
    const existe = await db.from('eleves').where('matricule', matricule).first()
    return !existe
  }
}

import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Note d'un élève à une évaluation. `absent` et `valeur` ne coexistent jamais :
 * un absent n'a pas de note, ce n'est pas un zéro (RG11).
 */
export default class Note extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare evaluationId: number

  @column()
  declare eleveId: number

  /** decimal(5,2) : PostgreSQL le renvoie en texte, converti en nombre ici. */
  @column({ consume: (v) => (v === null ? null : Number(v)) })
  declare valeur: number | null

  @column()
  declare absent: boolean

  @column()
  declare observation: string | null

  @column()
  declare saisiePar: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

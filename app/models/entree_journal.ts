import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Entrée du journal (RG22). Lecture et ajout uniquement : la base refuse
 * toute modification ou suppression.
 */
export default class EntreeJournal extends BaseModel {
  static table = 'journal'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare action: string

  @column()
  declare entite: string

  @column()
  declare entiteId: string | null

  @column()
  declare avant: Record<string, unknown> | null

  @column()
  declare apres: Record<string, unknown> | null

  @column()
  declare ip: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}

import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/** Dérogation à la fenêtre de saisie, accordée par la direction (RG13). */
export default class DerogationSaisie extends BaseModel {
  static table = 'derogations_saisie'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare affectationId: number

  @column()
  declare periodeId: number

  @column.date()
  declare jusquAu: DateTime

  @column()
  declare motif: string

  @column()
  declare accordeePar: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

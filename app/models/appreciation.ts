import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/** Appréciation d'un enseignant : élève, matière, période (250 caractères). */
export default class Appreciation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare eleveId: number

  @column()
  declare matiereId: number

  @column()
  declare periodeId: number

  @column()
  declare texte: string

  @column()
  declare auteurId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

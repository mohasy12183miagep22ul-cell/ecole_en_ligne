import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type Famille = 'litteraire' | 'scientifique' | 'langue' | 'artistique' | 'sportive'

export default class Matiere extends BaseModel {
  static table = 'matieres'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare libelle: string

  @column()
  declare famille: Famille

  @column()
  declare noteMaxDefaut: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

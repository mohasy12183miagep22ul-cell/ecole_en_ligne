import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Periode extends BaseModel {
  static table = 'periodes'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare anneeId: number

  @column()
  declare libelle: string

  @column()
  declare ordre: number

  @column.date()
  declare debutSaisie: DateTime

  @column.date()
  declare finSaisie: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

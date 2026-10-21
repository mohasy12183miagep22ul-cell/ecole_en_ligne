import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class JetonReinitialisation extends BaseModel {
  static table = 'jetons_reinitialisation'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  /** Empreinte SHA-256 du jeton ; le jeton en clair n'est jamais stocké. */
  @column({ serializeAs: null })
  declare empreinte: string

  @column.dateTime()
  declare expireLe: DateTime

  @column.dateTime()
  declare utiliseLe: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/** Code de second facteur en attente pour l'application mobile. */
export default class DefiConnexion extends BaseModel {
  static table = 'defis_connexion'
  static selfAssignPrimaryKey = true

  /** UUID opaque remis à l'application à la place d'une session. */
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: number

  /** Empreinte SHA-256 du code ; le code en clair n'est jamais stocké. */
  @column({ serializeAs: null })
  declare empreinte: string

  @column.dateTime()
  declare expireLe: DateTime

  @column()
  declare essais: number

  @column.dateTime()
  declare utiliseLe: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

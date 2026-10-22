import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Niveau from '#models/niveau'
import User from '#models/user'

export default class Classe extends BaseModel {
  static table = 'classes'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare anneeId: number

  @column()
  declare niveauId: number

  @column()
  declare libelle: string

  @column()
  declare capacite: number

  @column()
  declare salle: string | null

  @column()
  declare professeurPrincipalId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Niveau)
  declare niveau: BelongsTo<typeof Niveau>

  @belongsTo(() => User, { foreignKey: 'professeurPrincipalId' })
  declare professeurPrincipal: BelongsTo<typeof User>
}

import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Classe from '#models/classe'
import Matiere from '#models/matiere'
import User from '#models/user'

/**
 * Enseignant + classe + matière + année : le seul périmètre sur lequel
 * l'enseignant saisit des notes (RG9).
 */
export default class Affectation extends BaseModel {
  static table = 'affectations'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare enseignantId: number

  @column()
  declare classeId: number

  @column()
  declare matiereId: number

  @column()
  declare anneeId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'enseignantId' })
  declare enseignant: BelongsTo<typeof User>

  @belongsTo(() => Classe)
  declare classe: BelongsTo<typeof Classe>

  @belongsTo(() => Matiere)
  declare matiere: BelongsTo<typeof Matiere>
}

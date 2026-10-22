import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Matiere from '#models/matiere'

/**
 * Ligne du programme d'un niveau : la matière et son coefficient (RG3).
 */
export default class NiveauMatiere extends BaseModel {
  static table = 'niveau_matiere'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare niveauId: number

  @column()
  declare matiereId: number

  /** decimal(4,2) : PostgreSQL le renvoie en texte, converti en nombre ici. */
  @column({ consume: (v) => (v === null ? v : Number(v)) })
  declare coefficient: number

  @column()
  declare obligatoire: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Matiere)
  declare matiere: BelongsTo<typeof Matiere>
}

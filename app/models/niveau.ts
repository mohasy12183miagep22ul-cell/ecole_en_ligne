import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import NiveauMatiere from '#models/niveau_matiere'

export type Cycle = 'primaire' | 'college' | 'lycee'

export default class Niveau extends BaseModel {
  static table = 'niveaux'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare libelle: string

  @column()
  declare ordre: number

  @column()
  declare cycle: Cycle

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  /** Programme du niveau : matières et coefficients (RG3). */
  @hasMany(() => NiveauMatiere, {
    foreignKey: 'niveauId',
    onQuery: (q) => q.whereNull('deleted_at'),
  })
  declare programme: HasMany<typeof NiveauMatiere>
}

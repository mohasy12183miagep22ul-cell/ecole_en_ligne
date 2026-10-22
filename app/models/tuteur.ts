import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export type LienParente = 'mere' | 'pere' | 'tante' | 'oncle' | 'grand_parent' | 'autre'

export const LIENS_PARENTE: Record<LienParente, string> = {
  mere: 'Mère',
  pere: 'Père',
  tante: 'Tante',
  oncle: 'Oncle',
  grand_parent: 'Grand-parent',
  autre: 'Autre tuteur légal',
}

export default class Tuteur extends BaseModel {
  static table = 'tuteurs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nom: string

  @column()
  declare lienParente: LienParente

  @column()
  declare telephone: string

  @column()
  declare profession: string | null

  @column()
  declare adresse: string | null

  @column()
  declare email: string | null

  /** Compte du portail famille (RG20 : accès aux seuls élèves rattachés). */
  @column()
  declare userId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Affectation from '#models/affectation'
import Periode from '#models/periode'
import Note from '#models/note'

export type TypeEvaluation = 'interrogation' | 'devoir' | 'composition' | 'tp' | 'oral'
export type EtatEvaluation = 'brouillon' | 'soumise' | 'validee' | 'verrouillee'

export const TYPES_EVALUATION: Record<TypeEvaluation, string> = {
  interrogation: 'Interrogation',
  devoir: 'Devoir surveillé',
  composition: 'Composition',
  tp: 'Travaux pratiques',
  oral: 'Oral',
}

/** decimal(5,2) : PostgreSQL le renvoie en texte, converti en nombre ici. */
const nombre = (v: unknown) => (v === null || v === undefined ? v : Number(v))

/** Évaluation d'une affectation sur une période (§ 6, RG9). */
export default class Evaluation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare affectationId: number

  @column()
  declare periodeId: number

  @column()
  declare type: TypeEvaluation

  @column()
  declare titre: string

  @column.date()
  declare date: DateTime

  @column({ consume: nombre })
  declare noteMax: number

  @column({ consume: nombre })
  declare poids: number

  @column()
  declare etat: EtatEvaluation

  @column.dateTime()
  declare soumiseLe: DateTime | null

  @column()
  declare valideePar: number | null

  @column.dateTime()
  declare valideeLe: DateTime | null

  @column()
  declare motifRetour: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Affectation)
  declare affectation: BelongsTo<typeof Affectation>

  @belongsTo(() => Periode)
  declare periode: BelongsTo<typeof Periode>

  @hasMany(() => Note, { onQuery: (q) => q.whereNull('notes.deleted_at') })
  declare notes: HasMany<typeof Note>
}

import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import AnneeScolaire from '#models/annee_scolaire'
import Classe from '#models/classe'
import DocumentInscription from '#models/document_inscription'
import Eleve from '#models/eleve'
import Niveau from '#models/niveau'

export type EtatInscription = 'brouillon' | 'soumis' | 'valide' | 'refuse' | 'annule'

export default class Inscription extends BaseModel {
  static table = 'inscriptions'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare eleveId: number

  @column()
  declare anneeId: number

  @column()
  declare niveauId: number

  @column()
  declare classeId: number | null

  @column.date()
  declare dateInscription: DateTime

  @column()
  declare etat: EtatInscription

  @column()
  declare redoublant: boolean

  @column()
  declare etablissementOrigine: string | null

  @column()
  declare motif: string | null

  /** RG7 : motif d'un dépassement de capacité forcé par la direction. */
  @column()
  declare motifDepassement: string | null

  @column()
  declare validePar: number | null

  @column.dateTime()
  declare valideLe: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Eleve)
  declare eleve: BelongsTo<typeof Eleve>

  @belongsTo(() => AnneeScolaire, { foreignKey: 'anneeId' })
  declare annee: BelongsTo<typeof AnneeScolaire>

  @belongsTo(() => Niveau)
  declare niveau: BelongsTo<typeof Niveau>

  @belongsTo(() => Classe)
  declare classe: BelongsTo<typeof Classe>

  @hasMany(() => DocumentInscription, {
    foreignKey: 'inscriptionId',
    onQuery: (q) => q.whereNull('documents.deleted_at'),
  })
  declare documents: HasMany<typeof DocumentInscription>
}

import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Inscription from '#models/inscription'
import Tuteur from '#models/tuteur'

export type StatutEleve = 'inscrit' | 'transfere' | 'abandon' | 'diplome' | 'exclu'
export type Sexe = 'F' | 'M'

/** Statuts qui interdisent une nouvelle inscription sans réactivation (RG8). */
export const STATUTS_SORTIS: StatutEleve[] = ['transfere', 'abandon', 'exclu']

export default class Eleve extends BaseModel {
  static table = 'eleves'

  @column({ isPrimary: true })
  declare id: number

  /** RG4 : AAAA-NNNNN, unique et immuable (garanti aussi par la base). */
  @column()
  declare matricule: string

  @column()
  declare nom: string

  @column()
  declare prenoms: string

  @column()
  declare sexe: Sexe

  @column.date()
  declare dateNaissance: DateTime

  @column()
  declare lieuNaissance: string

  @column()
  declare nationalite: string | null

  @column()
  declare numeroActe: string | null

  /** Chemin dans le stockage privé ; jamais exposé tel quel. */
  @column({ serializeAs: null })
  declare photo: string | null

  @column()
  declare statut: StatutEleve | null

  @column()
  declare statutMotif: string | null

  @column.date()
  declare statutDate: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @hasMany(() => Inscription, { onQuery: (q) => q.whereNull('inscriptions.deleted_at') })
  declare inscriptions: HasMany<typeof Inscription>

  @manyToMany(() => Tuteur, {
    pivotTable: 'eleve_tuteur',
    pivotColumns: ['principal', 'deleted_at'],
    pivotTimestamps: true,
    onQuery: (q) => q.whereNull('eleve_tuteur.deleted_at').whereNull('tuteurs.deleted_at'),
  })
  declare tuteurs: ManyToMany<typeof Tuteur>

  get nomComplet() {
    return `${this.prenoms} ${this.nom.toUpperCase()}`
  }

  /** RG8 : sorti de l'établissement (transféré, abandon, exclu). */
  get estSorti() {
    return this.statut !== null && STATUTS_SORTIS.includes(this.statut)
  }
}

import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Periode from '#models/periode'
import Classe from '#models/classe'

export type EtatAnnee = 'preparation' | 'active' | 'cloturee'
export type Decoupage = 'trimestres' | 'semestres'

export default class AnneeScolaire extends BaseModel {
  static table = 'annees_scolaires'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare libelle: string

  @column.date()
  declare dateDebut: DateTime

  @column.date()
  declare dateFin: DateTime

  @column()
  declare decoupage: Decoupage

  @column()
  declare etat: EtatAnnee

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @hasMany(() => Periode, {
    foreignKey: 'anneeId',
    onQuery: (q) => q.whereNull('deleted_at').orderBy('ordre'),
  })
  declare periodes: HasMany<typeof Periode>

  @hasMany(() => Classe, {
    foreignKey: 'anneeId',
    onQuery: (q) => q.whereNull('deleted_at'),
  })
  declare classes: HasMany<typeof Classe>

  /** RG2 : une année clôturée ne se modifie plus. */
  get estCloturee() {
    return this.etat === 'cloturee'
  }

  /** Année active (RG1 : au plus une), ou `null`. */
  static active() {
    return this.query().where('etat', 'active').whereNull('deleted_at').first()
  }
}

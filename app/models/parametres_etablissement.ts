import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ParametresEtablissement extends BaseModel {
  static table = 'parametres_etablissement'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nom: string

  @column()
  declare adresse: string | null

  @column()
  declare ville: string | null

  @column()
  declare pays: string | null

  @column()
  declare telephone: string | null

  @column()
  declare email: string | null

  /** Signataire des documents officiels (certificats, bulletins). */
  @column()
  declare chefEtablissement: string | null

  @column()
  declare titreChef: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

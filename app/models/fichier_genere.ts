import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type TypeFichierGenere = 'certificats' | 'liste_eleves' | 'registre'
export type FormatFichier = 'pdf' | 'xlsx'

/** Document produit en file d'attente, téléchargeable par son seul demandeur. */
export default class FichierGenere extends BaseModel {
  static table = 'fichiers_generes'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare type: TypeFichierGenere

  @column()
  declare libelle: string

  @column()
  declare format: FormatFichier

  @column()
  declare parametres: Record<string, unknown>

  @column()
  declare etat: 'en_attente' | 'pret' | 'echec'

  @column({ serializeAs: null })
  declare fichier: string | null

  @column()
  declare erreur: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

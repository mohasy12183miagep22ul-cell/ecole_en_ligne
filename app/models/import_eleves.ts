import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/** Ligne d'import analysée et valide, prête à enregistrer. */
export type LigneImport = {
  ligne: number
  matricule: string | null
  anneeEntree: number | null
  nom: string
  prenoms: string
  sexe: 'F' | 'M'
  dateNaissance: string
  lieuNaissance: string
  nationalite: string | null
  numeroActe: string | null
  classeId: number
  classe: string
  redoublant: boolean
  etablissementOrigine: string | null
  tuteurNom: string
  tuteurLien: string
  tuteurTelephone: string
  tuteurProfession: string | null
  tuteurAdresse: string | null
}

export type ErreurImport = { ligne: number; colonne: string; message: string }

/** Import initial en attente d'acceptation de son rapport (§ 4). */
export default class ImportEleves extends BaseModel {
  static table = 'imports'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare anneeId: number

  @column()
  declare nomFichier: string

  // Tableaux JSON : sérialisés explicitement, sinon le pilote pg les envoie
  // comme des tableaux PostgreSQL.
  @column({ prepare: (v: LigneImport[]) => JSON.stringify(v) })
  declare lignes: LigneImport[]

  @column({ prepare: (v: ErreurImport[]) => JSON.stringify(v) })
  declare erreurs: ErreurImport[]

  @column()
  declare etat: 'analyse' | 'accepte' | 'abandonne'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

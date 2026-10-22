import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type TypeDocument =
  'acte_naissance' | 'bulletin_precedent' | 'certificat_transfert' | 'photo'

/** Pièces du dossier (§ 3), dans l'ordre d'affichage. */
export const TYPES_DOCUMENT: Record<TypeDocument, string> = {
  acte_naissance: 'Acte de naissance',
  bulletin_precedent: 'Bulletin ou certificat de l’année précédente',
  certificat_transfert: 'Certificat de transfert',
  photo: 'Photo d’identité',
}

/** Pièce du dossier d'inscription (table `documents`, § 10). */
export default class DocumentInscription extends BaseModel {
  static table = 'documents'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare inscriptionId: number

  @column()
  declare type: TypeDocument

  /** Chemin dans le stockage privé, nom généré ; jamais exposé tel quel. */
  @column({ serializeAs: null })
  declare fichier: string | null

  @column()
  declare nomOrigine: string | null

  @column()
  declare mime: string | null

  @column()
  declare taille: number | null

  @column()
  declare fourni: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

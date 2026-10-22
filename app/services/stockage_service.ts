import { randomUUID } from 'node:crypto'
import { fileTypeFromFile } from 'file-type'
import drive from '@adonisjs/drive/services/main'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import RegleGestionException from '#exceptions/regle_gestion_exception'

/** Taille maximale d'une pièce jointe (§ 3, § 12). */
export const TAILLE_MAX = 5 * 1024 * 1024

const PDF_OU_IMAGE = ['application/pdf', 'image/jpeg', 'image/png']
const IMAGE = ['image/jpeg', 'image/png']
const EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export type FichierStocke = { cle: string; mime: string; taille: number; nomOrigine: string }

/**
 * Stockage privé des fichiers déposés (§ 12) :
 * - 5 Mo au plus ;
 * - type vérifié sur le contenu réel du fichier (signature binaire), jamais
 *   sur l'extension ou le type annoncé par le navigateur ;
 * - nom de fichier généré, non devinable ;
 * - jamais servi par une URL publique : la lecture passe par une route
 *   authentifiée qui vérifie les droits.
 */
export default class StockageService {
  static async deposer(
    fichier: MultipartFile,
    dossier: 'pieces' | 'photos',
    nature: 'pdf_ou_image' | 'image'
  ): Promise<FichierStocke> {
    if (!fichier.tmpPath || !fichier.isValid) {
      throw new RegleGestionException('Le fichier n’a pas pu être reçu. Réessayez.')
    }
    if (fichier.size > TAILLE_MAX) {
      throw new RegleGestionException('Fichier trop volumineux : 5 Mo au maximum.')
    }
    const detecte = await fileTypeFromFile(fichier.tmpPath)
    const autorises = nature === 'image' ? IMAGE : PDF_OU_IMAGE
    if (!detecte || !autorises.includes(detecte.mime)) {
      throw new RegleGestionException(
        nature === 'image'
          ? 'Seules les images JPG ou PNG sont acceptées.'
          : 'Seuls les fichiers PDF, JPG ou PNG sont acceptés.'
      )
    }
    const cle = `${dossier}/${randomUUID()}.${EXTENSIONS[detecte.mime]}`
    await fichier.moveToDisk(cle)
    return {
      cle,
      mime: detecte.mime,
      taille: fichier.size,
      nomOrigine: (fichier.clientName ?? 'fichier').slice(0, 200),
    }
  }

  static async ecrire(cle: string, contenu: Buffer) {
    await drive.use().put(cle, contenu)
  }

  static lire(cle: string) {
    return drive.use().getStream(cle)
  }

  static existe(cle: string) {
    return drive.use().exists(cle)
  }
}

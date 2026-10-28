import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Niveau, { type Cycle } from '#models/niveau'
import Matiere, { type Famille } from '#models/matiere'
import NiveauMatiere from '#models/niveau_matiere'
import JournalService from '#services/journal_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'
import type { Auteur } from '#services/annee_scolaire_service'

/**
 * Niveaux, matières et programme (coefficients). Niveaux et matières sont
 * permanents ; le coefficient appartient au couple niveau + matière (RG3).
 */
export default class StructureService {
  static niveaux() {
    return Niveau.query().whereNull('deleted_at').orderBy('ordre')
  }

  static matieres() {
    return Matiere.query().whereNull('deleted_at').orderBy('libelle')
  }

  /** Compteurs du tableau de bord de l'administrateur (web et mobile). */
  static async compteurs() {
    const compter = async (requete: Promise<Array<{ total: string | number }>>) => {
      const [ligne] = await requete
      return Number(ligne?.total ?? 0)
    }
    const [niveaux, matieres, comptesActifs] = await Promise.all([
      compter(db.from('niveaux').whereNull('deleted_at').count('* as total')),
      compter(db.from('matieres').whereNull('deleted_at').count('* as total')),
      compter(db.from('users').whereNull('deleted_at').where('actif', true).count('* as total')),
    ])
    return { niveaux, matieres, comptesActifs }
  }

  /** Programme complet : une ligne par couple niveau + matière actif. */
  static programme() {
    return NiveauMatiere.query().whereNull('deleted_at')
  }

  static async creerNiveau(
    donnees: { code: string; libelle: string; ordre: number; cycle: Cycle },
    auteur: Auteur
  ) {
    return db.transaction(async (trx) => {
      const niveau = await Niveau.create(donnees, { client: trx })
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Création de niveau',
          entite: 'niveaux',
          entiteId: niveau.id,
          apres: { code: niveau.code, libelle: niveau.libelle },
          ip: auteur.ip,
        },
        trx
      )
      return niveau
    })
  }

  static async creerMatiere(
    donnees: { code: string; libelle: string; famille: Famille; noteMaxDefaut: number },
    auteur: Auteur
  ) {
    return db.transaction(async (trx) => {
      const matiere = await Matiere.create(donnees, { client: trx })
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Création de matière',
          entite: 'matieres',
          entiteId: matiere.id,
          apres: { code: matiere.code, libelle: matiere.libelle },
          ip: auteur.ip,
        },
        trx
      )
      return matiere
    })
  }

  /**
   * Matière obligatoire ou facultative au programme d'un niveau (une matière
   * facultative sans note ne bloque pas la génération des bulletins, RG17).
   */
  static async definirObligatoire(
    niveauId: number,
    matiereId: number,
    obligatoire: boolean,
    auteur: Auteur
  ) {
    const ligne = await NiveauMatiere.query()
      .where('niveau_id', niveauId)
      .where('matiere_id', matiereId)
      .whereNull('deleted_at')
      .first()
    if (!ligne) {
      throw new RegleGestionException(
        'Cette matière n’est pas au programme du niveau : fixez d’abord son coefficient.',
        'RG3'
      )
    }
    if (ligne.obligatoire === obligatoire) return
    await db.transaction(async (trx) => {
      ligne.useTransaction(trx)
      ligne.obligatoire = obligatoire
      await ligne.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: obligatoire ? 'Matière rendue obligatoire' : 'Matière rendue facultative',
          entite: 'niveau_matiere',
          entiteId: ligne.id,
          avant: { obligatoire: !obligatoire },
          apres: { obligatoire },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  /**
   * Fixe le coefficient d'une matière pour un niveau (RG3). `null` retire la
   * matière du programme du niveau (suppression logique de la ligne).
   */
  static async definirCoefficient(
    niveauId: number,
    matiereId: number,
    coefficient: number | null,
    auteur: Auteur
  ) {
    if (coefficient !== null && !(coefficient > 0)) {
      throw new RegleGestionException('Le coefficient doit être strictement positif.', 'RG3')
    }
    const niveau = await Niveau.query().where('id', niveauId).whereNull('deleted_at').firstOrFail()
    const matiere = await Matiere.query()
      .where('id', matiereId)
      .whereNull('deleted_at')
      .firstOrFail()

    await db.transaction(async (trx) => {
      const ligne = await NiveauMatiere.query({ client: trx })
        .where('niveau_id', niveau.id)
        .where('matiere_id', matiere.id)
        .whereNull('deleted_at')
        .forUpdate()
        .first()
      const avant = ligne?.coefficient ?? null
      if (avant === coefficient) return

      if (coefficient === null) {
        ligne!.useTransaction(trx)
        ligne!.deletedAt = DateTime.now()
        await ligne!.save()
      } else if (ligne) {
        ligne.useTransaction(trx)
        ligne.coefficient = coefficient
        await ligne.save()
      } else {
        await NiveauMatiere.create(
          { niveauId: niveau.id, matiereId: matiere.id, coefficient, obligatoire: true },
          { client: trx }
        )
      }

      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: coefficient === null ? 'Matière retirée du programme' : 'Coefficient modifié',
          entite: 'niveau_matiere',
          entiteId: `${niveau.code}/${matiere.code}`,
          avant: { coefficient: avant },
          apres: { coefficient },
          ip: auteur.ip,
        },
        trx
      )
    })
  }
}

import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Classe from '#models/classe'
import Affectation from '#models/affectation'
import NiveauMatiere from '#models/niveau_matiere'
import type AnneeScolaire from '#models/annee_scolaire'
import JournalService from '#services/journal_service'
import AnneeScolaireService, { type Auteur } from '#services/annee_scolaire_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'

/**
 * Affectations des enseignants (enseignant + classe + matière + année). Elles
 * délimitent le seul périmètre de saisie de chaque enseignant (RG9).
 */
export default class AffectationService {
  static lister(anneeId: number) {
    return Affectation.query()
      .where('affectations.annee_id', anneeId)
      .whereNull('affectations.deleted_at')
      .preload('enseignant')
      .preload('matiere')
      .preload('classe')
      .join('classes', 'classes.id', 'affectations.classe_id')
      .join('niveaux', 'niveaux.id', 'classes.niveau_id')
      .select('affectations.*')
      .orderBy('niveaux.ordre')
      .orderBy('classes.libelle')
  }

  static async creer(
    annee: AnneeScolaire,
    donnees: { enseignantId: number; classeId: number; matiereId: number },
    auteur: Auteur
  ) {
    AnneeScolaireService.verifierModifiable(annee)

    const classe = await Classe.query()
      .where('id', donnees.classeId)
      .where('annee_id', annee.id)
      .whereNull('deleted_at')
      .first()
    if (!classe) {
      throw new RegleGestionException(`Cette classe n’appartient pas à l’année ${annee.libelle}.`)
    }

    const enseignant = await User.query()
      .where('id', donnees.enseignantId)
      .whereNull('deleted_at')
      .first()
    await enseignant?.load('rolesUtilisateur')
    if (!enseignant || !enseignant.actif || !enseignant.aLeRole('enseignant')) {
      throw new RegleGestionException('Seul un enseignant actif peut recevoir une affectation.')
    }

    const auProgramme = await NiveauMatiere.query()
      .where('niveau_id', classe.niveauId)
      .where('matiere_id', donnees.matiereId)
      .whereNull('deleted_at')
      .first()
    if (!auProgramme) {
      throw new RegleGestionException(
        `Cette matière n’est pas au programme du niveau de la ${classe.libelle}.`,
        'RG3'
      )
    }

    const doublon = await Affectation.query()
      .where('enseignant_id', donnees.enseignantId)
      .where('classe_id', donnees.classeId)
      .where('matiere_id', donnees.matiereId)
      .where('annee_id', annee.id)
      .whereNull('deleted_at')
      .first()
    if (doublon) {
      throw new RegleGestionException('Cet enseignant est déjà affecté à cette classe et matière.')
    }

    return db.transaction(async (trx) => {
      const affectation = await Affectation.create(
        { ...donnees, anneeId: annee.id },
        { client: trx }
      )
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Affectation d’enseignant',
          entite: 'affectations',
          entiteId: affectation.id,
          apres: {
            enseignant: enseignant.fullName,
            classe: classe.libelle,
            matiereId: donnees.matiereId,
          },
          ip: auteur.ip,
        },
        trx
      )
      return affectation
    })
  }

  /** Retrait d'une affectation : suppression logique (RG21). */
  static async retirer(affectation: Affectation, auteur: Auteur) {
    const annee = await AnneeScolaireService.trouver(affectation.anneeId)
    AnneeScolaireService.verifierModifiable(annee)
    await db.transaction(async (trx) => {
      affectation.useTransaction(trx)
      affectation.deletedAt = DateTime.now()
      await affectation.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Retrait d’affectation',
          entite: 'affectations',
          entiteId: affectation.id,
          avant: {
            enseignantId: affectation.enseignantId,
            classeId: affectation.classeId,
            matiereId: affectation.matiereId,
          },
          ip: auteur.ip,
        },
        trx
      )
    })
  }
}

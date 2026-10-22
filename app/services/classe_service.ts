import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Classe from '#models/classe'
import Niveau from '#models/niveau'
import type AnneeScolaire from '#models/annee_scolaire'
import JournalService from '#services/journal_service'
import AnneeScolaireService, { type Auteur } from '#services/annee_scolaire_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'

type DonneesClasse = {
  niveauId: number
  libelle: string
  capacite: number
  salle?: string | null
  professeurPrincipalId?: number | null
}

/**
 * Classes d'une année. Toute écriture porte sur une année non clôturée (RG2).
 */
export default class ClasseService {
  static lister(anneeId: number) {
    return Classe.query()
      .where('classes.annee_id', anneeId)
      .whereNull('classes.deleted_at')
      .preload('niveau')
      .preload('professeurPrincipal')
      .join('niveaux', 'niveaux.id', 'classes.niveau_id')
      .select('classes.*')
      .orderBy('niveaux.ordre')
      .orderBy('classes.libelle')
  }

  static async trouver(id: number) {
    return Classe.query().where('id', id).whereNull('deleted_at').firstOrFail()
  }

  /** Le professeur principal doit être un enseignant actif. */
  static async #verifierProfesseurPrincipal(id: number | null | undefined) {
    if (!id) return
    const user = await User.query().where('id', id).whereNull('deleted_at').first()
    await user?.load('rolesUtilisateur')
    if (!user || !user.actif || !user.aLeRole('enseignant')) {
      throw new RegleGestionException('Le professeur principal doit être un enseignant actif.')
    }
  }

  static async #verifierNiveau(id: number) {
    await Niveau.query().where('id', id).whereNull('deleted_at').firstOrFail()
  }

  /** Un libellé de classe n'existe qu'une fois par année. */
  static async #verifierLibelle(anneeId: number, libelle: string, saufId?: number) {
    const q = Classe.query()
      .where('annee_id', anneeId)
      .whereILike('libelle', libelle)
      .whereNull('deleted_at')
    if (saufId) q.whereNot('id', saufId)
    if (await q.first()) {
      throw new RegleGestionException(`La classe ${libelle} existe déjà pour cette année.`)
    }
  }

  static async creer(annee: AnneeScolaire, donnees: DonneesClasse, auteur: Auteur) {
    AnneeScolaireService.verifierModifiable(annee)
    await this.#verifierNiveau(donnees.niveauId)
    await this.#verifierLibelle(annee.id, donnees.libelle)
    await this.#verifierProfesseurPrincipal(donnees.professeurPrincipalId)

    return db.transaction(async (trx) => {
      const classe = await Classe.create({ ...donnees, anneeId: annee.id }, { client: trx })
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Création de classe',
          entite: 'classes',
          entiteId: classe.id,
          apres: { libelle: classe.libelle, annee: annee.libelle, capacite: classe.capacite },
          ip: auteur.ip,
        },
        trx
      )
      return classe
    })
  }

  static async modifier(classe: Classe, donnees: DonneesClasse, auteur: Auteur) {
    const annee = await AnneeScolaireService.trouver(classe.anneeId)
    AnneeScolaireService.verifierModifiable(annee)
    await this.#verifierNiveau(donnees.niveauId)
    await this.#verifierLibelle(annee.id, donnees.libelle, classe.id)
    await this.#verifierProfesseurPrincipal(donnees.professeurPrincipalId)

    const avant = {
      libelle: classe.libelle,
      capacite: classe.capacite,
      salle: classe.salle,
      professeurPrincipalId: classe.professeurPrincipalId,
    }
    await db.transaction(async (trx) => {
      classe.useTransaction(trx)
      classe.merge(donnees)
      await classe.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Modification de classe',
          entite: 'classes',
          entiteId: classe.id,
          avant,
          apres: {
            libelle: classe.libelle,
            capacite: classe.capacite,
            salle: classe.salle,
            professeurPrincipalId: classe.professeurPrincipalId,
          },
          ip: auteur.ip,
        },
        trx
      )
    })
  }
}

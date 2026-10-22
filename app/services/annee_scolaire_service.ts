import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import AnneeScolaire, { type Decoupage } from '#models/annee_scolaire'
import Periode from '#models/periode'
import Classe from '#models/classe'
import Affectation from '#models/affectation'
import JournalService from '#services/journal_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'

export type Auteur = { id: number; ip: string | null }

type NouvelleAnnee = {
  libelle: string
  dateDebut: DateTime
  dateFin: DateTime
  decoupage: Decoupage
}

const LIBELLES: Record<Decoupage, string[]> = {
  trimestres: ['1er trimestre', '2e trimestre', '3e trimestre'],
  semestres: ['1er semestre', '2e semestre'],
}

/**
 * Cycle de vie des années scolaires et de leurs périodes.
 *
 * RG1 : une seule année active ; on active une année en préparation, et
 * seulement quand aucune autre n'est active (la précédente doit être
 * clôturée explicitement : la clôture est définitive, elle ne se fait jamais
 * en effet de bord).
 * RG2 : une année clôturée est en lecture seule définitive.
 */
export default class AnneeScolaireService {
  /** RG2 : refuse toute modification d'une année clôturée. */
  static verifierModifiable(annee: AnneeScolaire) {
    if (annee.estCloturee) {
      throw new RegleGestionException(
        `L’année ${annee.libelle} est clôturée : elle est en lecture seule définitive.`,
        'RG2'
      )
    }
  }

  /**
   * État de la fenêtre de saisie d'une période à une date donnée (RG13) :
   * la saisie n'est permise que pendant la fenêtre, sur une année active.
   */
  static etatSaisie(
    annee: AnneeScolaire,
    periode: Periode,
    aujourdhui = DateTime.now()
  ): 'ouverte' | 'a_venir' | 'close' {
    const jour = aujourdhui.startOf('day')
    if (annee.etat === 'cloturee' || jour > periode.finSaisie) return 'close'
    if (annee.etat === 'preparation' || jour < periode.debutSaisie) return 'a_venir'
    return 'ouverte'
  }

  static lister() {
    return AnneeScolaire.query()
      .whereNull('deleted_at')
      .preload('periodes')
      .orderBy('date_debut', 'desc')
  }

  static async trouver(id: number) {
    return AnneeScolaire.query().where('id', id).whereNull('deleted_at').firstOrFail()
  }

  /**
   * Année consultée par un écran : celle demandée, sinon l'année active,
   * sinon la plus récente. `null` s'il n'existe encore aucune année.
   */
  static async selectionner(id: number | undefined, active: AnneeScolaire | null) {
    if (id) return this.trouver(id)
    if (active) return active
    return AnneeScolaire.query().whereNull('deleted_at').orderBy('date_debut', 'desc').first()
  }

  /**
   * Crée une année en préparation et ses périodes. Les fenêtres de saisie
   * proposées découpent l'année à parts égales, à ajuster ensuite.
   */
  static async creer(donnees: NouvelleAnnee, auteur: Auteur) {
    return db.transaction(async (trx) => {
      const annee = await this.#creerAnnee(donnees, trx)
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Création d’année scolaire',
          entite: 'annees_scolaires',
          entiteId: annee.id,
          apres: { libelle: annee.libelle, decoupage: annee.decoupage },
          ip: auteur.ip,
        },
        trx
      )
      return annee
    })
  }

  static async #creerAnnee(donnees: NouvelleAnnee, trx: TransactionClientContract) {
    if (donnees.dateFin <= donnees.dateDebut) {
      throw new RegleGestionException('La date de fin doit suivre la date de début.')
    }
    const annee = await AnneeScolaire.create({ ...donnees, etat: 'preparation' }, { client: trx })

    const libelles = LIBELLES[donnees.decoupage]
    const jours = donnees.dateFin.diff(donnees.dateDebut, 'days').days
    const pas = Math.floor(jours / libelles.length)
    await Periode.createMany(
      libelles.map((libelle, i) => ({
        anneeId: annee.id,
        libelle,
        ordre: i + 1,
        debutSaisie: donnees.dateDebut.plus({ days: pas * i }),
        finSaisie:
          i === libelles.length - 1
            ? donnees.dateFin
            : donnees.dateDebut.plus({ days: pas * (i + 1) - 1 }),
      })),
      { client: trx }
    )
    return annee
  }

  /** Passe une année en préparation à l'état actif (RG1). */
  static async activer(annee: AnneeScolaire, auteur: Auteur) {
    if (annee.etat !== 'preparation') {
      throw new RegleGestionException('Seule une année en préparation peut être activée.', 'RG1')
    }
    const active = await AnneeScolaire.active()
    if (active) {
      throw new RegleGestionException(
        `L’année ${active.libelle} est encore active : clôturez-la avant d’en activer une autre.`,
        'RG1'
      )
    }
    await this.#changerEtat(annee, 'active', 'Activation d’année scolaire', auteur)
  }

  /** Clôture définitive d'une année active (RG2). */
  static async cloturer(annee: AnneeScolaire, auteur: Auteur) {
    if (annee.etat !== 'active') {
      throw new RegleGestionException('Seule l’année active peut être clôturée.', 'RG2')
    }
    await this.#changerEtat(annee, 'cloturee', 'Clôture d’année scolaire', auteur)
  }

  static async #changerEtat(
    annee: AnneeScolaire,
    etat: AnneeScolaire['etat'],
    action: string,
    auteur: Auteur
  ) {
    const avant = annee.etat
    await db.transaction(async (trx) => {
      annee.useTransaction(trx)
      annee.etat = etat
      await annee.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action,
          entite: 'annees_scolaires',
          entiteId: annee.id,
          avant: { etat: avant },
          apres: { etat },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  /**
   * Fenêtre de saisie d'une période. Les dates restent dans l'année ; la fin
   * ne précède pas le début (RG2 : refusé sur une année clôturée).
   */
  static async modifierPeriode(
    periode: Periode,
    donnees: { libelle: string; debutSaisie: DateTime; finSaisie: DateTime },
    auteur: Auteur
  ) {
    const annee = await this.trouver(periode.anneeId)
    this.verifierModifiable(annee)
    if (donnees.finSaisie < donnees.debutSaisie) {
      throw new RegleGestionException('La fin de saisie ne peut pas précéder son début.')
    }
    if (donnees.debutSaisie < annee.dateDebut || donnees.finSaisie > annee.dateFin) {
      throw new RegleGestionException(
        `Les dates de saisie doivent rester dans l’année (${annee.dateDebut.toFormat('dd/MM/yyyy')} – ${annee.dateFin.toFormat('dd/MM/yyyy')}).`
      )
    }
    const avant = {
      libelle: periode.libelle,
      debutSaisie: periode.debutSaisie.toISODate(),
      finSaisie: periode.finSaisie.toISODate(),
    }
    await db.transaction(async (trx) => {
      periode.useTransaction(trx)
      periode.merge(donnees)
      await periode.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Modification de période',
          entite: 'periodes',
          entiteId: periode.id,
          avant,
          apres: {
            libelle: donnees.libelle,
            debutSaisie: donnees.debutSaisie.toISODate(),
            finSaisie: donnees.finSaisie.toISODate(),
          },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  /**
   * Duplication d'année : crée la nouvelle année en préparation, ses
   * périodes, et reprend les classes (niveau, capacité, salle, professeur
   * principal) et les affectations de la source, à corriger au cas par cas.
   * Niveaux, matières et coefficients sont permanents : rien à copier.
   */
  static async dupliquer(source: AnneeScolaire, cible: NouvelleAnnee, auteur: Auteur) {
    return db.transaction(async (trx) => {
      const annee = await this.#creerAnnee(cible, trx)

      const classes = await Classe.query({ client: trx })
        .where('annee_id', source.id)
        .whereNull('deleted_at')
      const correspondance = new Map<number, number>()
      for (const c of classes) {
        const copie = await Classe.create(
          {
            anneeId: annee.id,
            niveauId: c.niveauId,
            libelle: c.libelle,
            capacite: c.capacite,
            salle: c.salle,
            professeurPrincipalId: c.professeurPrincipalId,
          },
          { client: trx }
        )
        correspondance.set(c.id, copie.id)
      }

      const affectations = await Affectation.query({ client: trx })
        .where('annee_id', source.id)
        .whereNull('deleted_at')
      await Affectation.createMany(
        affectations
          .filter((a) => correspondance.has(a.classeId))
          .map((a) => ({
            enseignantId: a.enseignantId,
            classeId: correspondance.get(a.classeId)!,
            matiereId: a.matiereId,
            anneeId: annee.id,
          })),
        { client: trx }
      )

      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Duplication d’année scolaire',
          entite: 'annees_scolaires',
          entiteId: annee.id,
          avant: { source: source.libelle },
          apres: {
            libelle: annee.libelle,
            classes: classes.length,
            affectations: affectations.length,
          },
          ip: auteur.ip,
        },
        trx
      )
      return annee
    })
  }
}

import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Eleve, { type StatutEleve } from '#models/eleve'
import Inscription from '#models/inscription'
import JournalService from '#services/journal_service'
import PiecesService from '#services/pieces_service'
import type { Auteur } from '#services/annee_scolaire_service'
import type { IdentiteEleve } from '#services/inscription_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'

/** Taille d'une page de la liste des élèves (pagination serveur). */
export const ELEVES_PAR_PAGE = 25

export type FiltresEleves = {
  anneeId: number
  q?: string
  niveauId?: number
  classeId?: number
  sexe?: 'F' | 'M'
  statut?: StatutEleve | 'non_inscrit'
  redoublant?: boolean
  incomplet?: boolean
}

/**
 * Élèves (§ 4) : recherche plein texte et filtres cumulables, fiche,
 * statuts. L'élève est permanent ; sa classe vient de l'inscription de
 * l'année consultée.
 */
export default class EleveService {
  /**
   * Requête de base de la liste : une ligne par inscription de l'année
   * (hors dossiers annulés), avec l'élève, la classe et l'état du dossier.
   */
  static requete(f: FiltresEleves) {
    const q = db
      .from('inscriptions as i')
      .join('eleves as e', 'e.id', 'i.eleve_id')
      .join('niveaux as n', 'n.id', 'i.niveau_id')
      .leftJoin('classes as c', 'c.id', 'i.classe_id')
      .where('i.annee_id', f.anneeId)
      .whereNot('i.etat', 'annule')
      .whereNull('i.deleted_at')
      .whereNull('e.deleted_at')
      .select(
        'i.id as inscription_id',
        'i.etat',
        'i.redoublant',
        'i.date_inscription',
        'e.id',
        'e.matricule',
        'e.nom',
        'e.prenoms',
        'e.sexe',
        'e.date_naissance',
        'e.statut',
        'n.libelle as niveau',
        'c.libelle as classe',
        db.raw(`${PiecesService.SQL_INCOMPLET} as incomplet`)
      )

    if (f.q) {
      const motif = `%${f.q.trim()}%`
      q.where((w) =>
        w
          .whereRaw(`sans_accent(lower(e.nom || ' ' || e.prenoms)) LIKE sans_accent(lower(?))`, [
            motif,
          ])
          .orWhereRaw(`sans_accent(lower(e.prenoms || ' ' || e.nom)) LIKE sans_accent(lower(?))`, [
            motif,
          ])
          .orWhere('e.matricule', 'ilike', motif)
      )
    }
    if (f.niveauId) q.where('i.niveau_id', f.niveauId)
    if (f.classeId) q.where('i.classe_id', f.classeId)
    if (f.sexe) q.where('e.sexe', f.sexe)
    if (f.statut === 'non_inscrit') q.whereNull('e.statut')
    else if (f.statut) q.where('e.statut', f.statut)
    if (f.redoublant !== undefined) q.where('i.redoublant', f.redoublant)
    if (f.incomplet) q.whereRaw(PiecesService.SQL_INCOMPLET)
    return q.orderBy('e.nom').orderBy('e.prenoms')
  }

  static lister(f: FiltresEleves, page: number) {
    return this.requete(f).paginate(page, ELEVES_PAR_PAGE)
  }

  /** Recherche d'un élève déjà connu (retour d'un ancien élève, § 4). */
  static rechercherConnus(texte: string) {
    const motif = `%${texte.trim()}%`
    return Eleve.query()
      .whereNull('deleted_at')
      .where((w) =>
        w
          .whereRaw(`sans_accent(lower(nom || ' ' || prenoms)) LIKE sans_accent(lower(?))`, [motif])
          .orWhereRaw(`sans_accent(lower(prenoms || ' ' || nom)) LIKE sans_accent(lower(?))`, [
            motif,
          ])
          .orWhere('matricule', 'ilike', motif)
      )
      .orderBy('nom')
      .limit(8)
  }

  static async trouver(id: number) {
    return Eleve.query()
      .where('id', id)
      .whereNull('deleted_at')
      .preload('tuteurs', (q) => q.preload('user'))
      .preload('inscriptions', (q) =>
        q
          .preload('annee')
          .preload('niveau')
          .preload('classe')
          .preload('documents')
          .orderBy('date_inscription', 'desc')
      )
      .firstOrFail()
  }

  /** Journal de l'élève (fiche, onglet journal) : du plus récent au plus ancien. */
  static journal(eleveId: number) {
    return db
      .from('journal as j')
      .leftJoin('users as u', 'u.id', 'j.user_id')
      .where('j.entite', 'eleves')
      .where('j.entite_id', String(eleveId))
      .select('j.*', 'u.full_name as auteur')
      .orderBy('j.id', 'desc')
      .limit(100)
  }

  /** Modification de l'identité ; le matricule ne change jamais (RG4). */
  static async modifierIdentite(eleve: Eleve, donnees: IdentiteEleve, auteur: Auteur) {
    const champs = ['nom', 'prenoms', 'sexe', 'lieuNaissance', 'nationalite', 'numeroActe'] as const
    const avant: Record<string, unknown> = {}
    const apres: Record<string, unknown> = {}
    for (const c of champs) {
      const nouveau = donnees[c] ?? null
      if ((eleve[c] ?? null) !== nouveau) {
        avant[c] = eleve[c]
        apres[c] = nouveau
      }
    }
    if (eleve.dateNaissance.toISODate() !== donnees.dateNaissance.toISODate()) {
      avant.dateNaissance = eleve.dateNaissance.toISODate()
      apres.dateNaissance = donnees.dateNaissance.toISODate()
    }
    if (Object.keys(apres).length === 0) return

    await db.transaction(async (trx) => {
      eleve.useTransaction(trx)
      eleve.merge({
        ...donnees,
        nationalite: donnees.nationalite ?? null,
        numeroActe: donnees.numeroActe ?? null,
      })
      await eleve.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Modification de la fiche élève',
          entite: 'eleves',
          entiteId: eleve.id,
          avant,
          apres,
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  /**
   * Changement de statut (§ 4). Transfert et abandon exigent un motif et une
   * date d'effet : à compter de cette date, l'élève quitte les listes de
   * classe et les grilles de saisie, sans que ses notes soient effacées.
   * Exclusion et diplôme relèvent de la direction (contrôlé par la policy).
   */
  static async changerStatut(
    eleve: Eleve,
    statut: Exclude<StatutEleve, 'inscrit'>,
    motif: string | null,
    date: DateTime | null,
    auteur: Auteur
  ) {
    if (
      ['transfere', 'abandon', 'exclu'].includes(statut) &&
      (!motif || motif.trim().length < 5 || !date)
    ) {
      throw new RegleGestionException(
        'Indiquez le motif (5 caractères minimum) et la date d’effet.'
      )
    }
    if (eleve.statut === statut) return
    const avant = {
      statut: eleve.statut,
      motif: eleve.statutMotif,
      date: eleve.statutDate?.toISODate() ?? null,
    }
    await db.transaction(async (trx) => {
      eleve.useTransaction(trx)
      eleve.statut = statut
      eleve.statutMotif = motif?.trim() ?? null
      eleve.statutDate = date ?? DateTime.now()
      await eleve.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Changement de statut',
          entite: 'eleves',
          entiteId: eleve.id,
          avant,
          apres: { statut, motif: eleve.statutMotif, date: eleve.statutDate?.toISODate() ?? null },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  /**
   * Réactivation par la direction (RG8) : l'élève sorti redevient
   * inscriptible ; il est « inscrit » s'il a une inscription validée sur
   * l'année active, sinon sans statut jusqu'à sa prochaine inscription.
   */
  static async reactiver(eleve: Eleve, motif: string, auteur: Auteur) {
    if (!eleve.estSorti) {
      throw new RegleGestionException(
        'Seul un élève transféré, en abandon ou exclu se réactive.',
        'RG8'
      )
    }
    const inscritCetteAnnee = await Inscription.query()
      .where('eleve_id', eleve.id)
      .where('etat', 'valide')
      .whereNull('deleted_at')
      .whereHas('annee', (q) => q.where('etat', 'active'))
      .first()
    const avant = { statut: eleve.statut, motif: eleve.statutMotif }
    await db.transaction(async (trx) => {
      eleve.useTransaction(trx)
      eleve.statut = inscritCetteAnnee ? 'inscrit' : null
      eleve.statutMotif = null
      eleve.statutDate = null
      await eleve.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Réactivation de l’élève',
          entite: 'eleves',
          entiteId: eleve.id,
          avant,
          apres: { statut: eleve.statut, motif },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  /** Âge en années révolues (affichage). */
  static age(dateNaissance: DateTime) {
    return Math.floor(DateTime.now().diff(dateNaissance, 'years').years)
  }
}

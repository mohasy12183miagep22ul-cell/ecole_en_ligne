import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Periode from '#models/periode'
import Affectation from '#models/affectation'
import AnneeScolaire from '#models/annee_scolaire'
import DerogationSaisie from '#models/derogation_saisie'
import Evaluation, { TYPES_EVALUATION, type TypeEvaluation } from '#models/evaluation'
import JournalService from '#services/journal_service'
import MoyenneService from '#services/moyenne_service'
import AnneeScolaireService, { type Auteur } from '#services/annee_scolaire_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'

export type DonneesEvaluation = {
  periodeId: number
  type: TypeEvaluation
  titre: string
  date: DateTime
  noteMax: number
  poids: number
}

const LIBELLES_ETAT = {
  brouillon: 'Brouillon',
  soumise: 'Soumise',
  validee: 'Validée',
  verrouillee: 'Verrouillée',
}

/**
 * Évaluations (§ 6). Tout part de l'affectation (RG9) : une évaluation n'existe
 * que pour un couple classe + matière confié à un enseignant sur l'année active.
 * Circuit : brouillon → soumise → validée (direction) ; retour au brouillon par
 * la direction seulement, motif journalisé (RG12).
 */
export default class EvaluationService {
  /** Affectations d'un enseignant sur l'année active, avec classe et matière. */
  static affectationsDe(enseignantId: number, anneeId: number) {
    return Affectation.query()
      .where('enseignant_id', enseignantId)
      .where('annee_id', anneeId)
      .whereNull('deleted_at')
      .preload('classe', (c) => c.preload('niveau'))
      .preload('matiere')
      .orderBy('classe_id')
  }

  static periodes(anneeId: number) {
    return Periode.query().where('annee_id', anneeId).whereNull('deleted_at').orderBy('ordre')
  }

  /** Période dont la fenêtre de saisie contient aujourd'hui, sinon la dernière commencée. */
  static periodeCourante(periodes: Periode[], aujourdhui = DateTime.now()) {
    const jour = aujourdhui.startOf('day')
    return (
      periodes.find((p) => jour >= p.debutSaisie && jour <= p.finSaisie) ??
      [...periodes].reverse().find((p) => jour >= p.debutSaisie) ??
      periodes[0] ??
      null
    )
  }

  /**
   * Évaluations avec classe, matière, enseignant, période et statistiques de
   * saisie. Le filtre part toujours d'affectations (RG9) ou d'un état.
   */
  static async listerAvecStatistiques(filtre: {
    affectationIds?: number[]
    anneeId: number
    etats?: Evaluation['etat'][]
    page?: number
    parPage?: number
  }) {
    const q = db
      .from('evaluations as ev')
      .join('affectations as a', 'a.id', 'ev.affectation_id')
      .join('classes as c', 'c.id', 'a.classe_id')
      .join('matieres as m', 'm.id', 'a.matiere_id')
      .join('users as u', 'u.id', 'a.enseignant_id')
      .join('periodes as p', 'p.id', 'ev.periode_id')
      .where('a.annee_id', filtre.anneeId)
      .whereNull('ev.deleted_at')
      .whereNull('a.deleted_at')
      .select(
        'ev.id',
        'ev.titre',
        'ev.type',
        'ev.date',
        'ev.note_max',
        'ev.poids',
        'ev.etat',
        'ev.motif_retour',
        'ev.affectation_id',
        'a.classe_id',
        'c.libelle as classe',
        'm.libelle as matiere',
        'u.full_name as enseignant',
        'p.libelle as periode'
      )
      .orderBy('ev.date', 'desc')
      .orderBy('ev.id', 'desc')
    if (filtre.affectationIds) q.whereIn('ev.affectation_id', filtre.affectationIds)
    if (filtre.etats) q.whereIn('ev.etat', filtre.etats)

    const pagine = filtre.page !== undefined
    const resultat = pagine ? await q.paginate(filtre.page!, filtre.parPage ?? 25) : await q
    const lignes = (
      pagine ? (resultat as Awaited<ReturnType<typeof q.paginate>>).all() : resultat
    ) as any[]

    const notes = lignes.length
      ? await db
          .from('notes')
          .whereIn(
            'evaluation_id',
            lignes.map((l) => l.id)
          )
          .whereNull('deleted_at')
          .select('evaluation_id', 'valeur', 'absent')
      : []
    const effectifs = new Map<string, number>()
    for (const l of lignes) {
      const date = DateTime.fromJSDate(l.date)
      const cle = `${l.classe_id}:${date.toISODate()}`
      if (!effectifs.has(cle)) {
        const eleves = await MoyenneService.elevesDeLaClasse(l.classe_id, date)
        effectifs.set(cle, eleves.length)
      }
    }
    const evaluations = lignes.map((l) => {
      const date = DateTime.fromJSDate(l.date)
      const noteMax = Number(l.note_max)
      const s = MoyenneService.statistiquesEvaluation(
        notes
          .filter((n) => n.evaluation_id === l.id)
          .map((n) => ({ valeur: n.valeur === null ? null : Number(n.valeur), absent: n.absent })),
        effectifs.get(`${l.classe_id}:${date.toISODate()}`) ?? 0
      )
      return {
        id: l.id as number,
        titre: l.titre as string,
        type: l.type as TypeEvaluation,
        date: date.toFormat('dd/MM/yyyy'),
        noteMax,
        poids: Number(l.poids),
        etat: l.etat as Evaluation['etat'],
        motifRetour: (l.motif_retour as string | null) ?? null,
        affectationId: l.affectation_id as number,
        classe: l.classe as string,
        matiere: l.matiere as string,
        enseignant: l.enseignant as string,
        periode: l.periode as string,
        statistiques: s,
      }
    })
    return {
      evaluations,
      pagination: pagine
        ? (() => {
            const meta = (resultat as Awaited<ReturnType<typeof q.paginate>>).getMeta()
            return { page: meta.currentPage, dernierePage: meta.lastPage, total: meta.total }
          })()
        : null,
    }
  }

  static async trouver(id: number, trx?: TransactionClientContract) {
    return Evaluation.query({ client: trx })
      .where('id', id)
      .whereNull('deleted_at')
      .preload('affectation', (a) => a.preload('classe').preload('matiere').preload('enseignant'))
      .preload('periode')
      .firstOrFail()
  }

  /**
   * RG13 : la saisie n'est permise que dans la fenêtre de la période, ou
   * jusqu'à la date d'une dérogation accordée par la direction.
   */
  static async saisieOuverte(affectationId: number, periode: Periode, aujourdhui = DateTime.now()) {
    const annee = await AnneeScolaire.findOrFail(periode.anneeId)
    const etat = AnneeScolaireService.etatSaisie(annee, periode, aujourdhui)
    if (etat === 'ouverte') return { ouverte: true as const, jusquAu: periode.finSaisie }
    if (annee.etat !== 'active') return { ouverte: false as const, raison: etat }
    const derogation = await DerogationSaisie.query()
      .where('affectation_id', affectationId)
      .where('periode_id', periode.id)
      .whereNull('deleted_at')
      .where('jusqu_au', '>=', aujourdhui.toISODate()!)
      .orderBy('jusqu_au', 'desc')
      .first()
    if (derogation) return { ouverte: true as const, jusquAu: derogation.jusquAu, derogation: true }
    return { ouverte: false as const, raison: etat }
  }

  static async verifierSaisieOuverte(affectationId: number, periode: Periode) {
    const s = await this.saisieOuverte(affectationId, periode)
    if (!s.ouverte) {
      throw new RegleGestionException(
        s.raison === 'a_venir'
          ? `La saisie du ${periode.libelle} n’est pas encore ouverte (à partir du ${periode.debutSaisie.toFormat('dd/MM/yyyy')}).`
          : `La saisie du ${periode.libelle} est close depuis le ${periode.finSaisie.toFormat('dd/MM/yyyy')} : une dérogation de la direction est nécessaire.`,
        'RG13'
      )
    }
  }

  /** RG1, RG2 : l'affectation doit porter sur l'année active. */
  static async #verifierAnneeActive(affectation: Affectation, trx?: TransactionClientContract) {
    const annee = await AnneeScolaire.findOrFail(affectation.anneeId, { client: trx })
    AnneeScolaireService.verifierModifiable(annee)
    if (annee.etat !== 'active') {
      throw new RegleGestionException('Les évaluations se créent sur l’année active.', 'RG1')
    }
  }

  static async creer(affectation: Affectation, d: DonneesEvaluation, auteur: Auteur) {
    await this.#verifierAnneeActive(affectation)
    const periode = await Periode.query()
      .where('id', d.periodeId)
      .where('annee_id', affectation.anneeId)
      .whereNull('deleted_at')
      .firstOrFail()
    await this.verifierSaisieOuverte(affectation.id, periode)

    return db.transaction(async (trx) => {
      const ev = await Evaluation.create(
        {
          affectationId: affectation.id,
          periodeId: periode.id,
          type: d.type,
          titre: d.titre,
          date: d.date,
          noteMax: d.noteMax,
          poids: d.poids,
          etat: 'brouillon',
        },
        { client: trx }
      )
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Création d’évaluation',
          entite: 'evaluations',
          entiteId: ev.id,
          apres: {
            titre: d.titre,
            type: TYPES_EVALUATION[d.type],
            periode: periode.libelle,
            noteMax: d.noteMax,
            poids: d.poids,
          },
          ip: auteur.ip,
        },
        trx
      )
      return ev
    })
  }

  /** Modification d'une évaluation en brouillon ; la note max ne descend pas sous une note saisie. */
  static async modifier(ev: Evaluation, d: Omit<DonneesEvaluation, 'periodeId'>, auteur: Auteur) {
    if (ev.etat !== 'brouillon') {
      throw new RegleGestionException('Seule une évaluation en brouillon se modifie.', 'RG12')
    }
    await this.verifierSaisieOuverte(ev.affectationId, ev.periode)
    const plusHaute = await db
      .from('notes')
      .where('evaluation_id', ev.id)
      .whereNull('deleted_at')
      .max('valeur as m')
      .first()
    if (plusHaute?.m !== null && plusHaute?.m !== undefined && Number(plusHaute.m) > d.noteMax) {
      throw new RegleGestionException(
        `Une note de ${String(plusHaute.m).replace('.', ',')} est déjà saisie : la note maximale ne peut pas être inférieure.`,
        'RG10'
      )
    }
    await db.transaction(async (trx) => {
      const avant = {
        titre: ev.titre,
        noteMax: ev.noteMax,
        poids: ev.poids,
        date: ev.date.toISODate(),
      }
      ev.useTransaction(trx)
      ev.merge({ type: d.type, titre: d.titre, date: d.date, noteMax: d.noteMax, poids: d.poids })
      await ev.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Modification d’évaluation',
          entite: 'evaluations',
          entiteId: ev.id,
          avant,
          apres: { titre: d.titre, noteMax: d.noteMax, poids: d.poids, date: d.date.toISODate() },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  static async #changerEtat(
    id: number,
    attendu: Evaluation['etat'][],
    etat: Evaluation['etat'],
    action: string,
    auteur: Auteur,
    extra: Partial<Pick<Evaluation, 'motifRetour'>> & { motif?: string } = {}
  ) {
    return db.transaction(async (trx) => {
      const ev = await Evaluation.query({ client: trx })
        .where('id', id)
        .whereNull('deleted_at')
        .forUpdate()
        .firstOrFail()
      if (!attendu.includes(ev.etat)) {
        throw new RegleGestionException(
          `Action impossible : l’évaluation est « ${LIBELLES_ETAT[ev.etat]} ».`,
          'RG12'
        )
      }
      const affectation = await Affectation.findOrFail(ev.affectationId, { client: trx })
      await this.#verifierAnneeActive(affectation, trx)
      const avant = ev.etat
      ev.etat = etat
      if (etat === 'soumise') ev.soumiseLe = DateTime.now()
      if (etat === 'validee') {
        ev.valideePar = auteur.id
        ev.valideeLe = DateTime.now()
      }
      if (etat === 'brouillon') {
        ev.motifRetour = extra.motif ?? null
        ev.valideePar = null
        ev.valideeLe = null
      }
      await ev.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action,
          entite: 'evaluations',
          entiteId: ev.id,
          avant: { etat: LIBELLES_ETAT[avant] },
          apres: { etat: LIBELLES_ETAT[etat], ...(extra.motif ? { motif: extra.motif } : {}) },
          ip: auteur.ip,
        },
        trx
      )
      return ev
    })
  }

  /** L'enseignant soumet ses notes : la saisie se ferme. */
  static soumettre(ev: Evaluation, auteur: Auteur) {
    return this.#changerEtat(ev.id, ['brouillon'], 'soumise', 'Soumission d’évaluation', auteur)
  }

  /** La direction valide : l'évaluation n'est plus modifiable par l'enseignant (RG12). */
  static valider(ev: Evaluation, auteur: Auteur) {
    return this.#changerEtat(ev.id, ['soumise'], 'validee', 'Validation d’évaluation', auteur)
  }

  /** La direction renvoie une évaluation soumise à l'enseignant, avec un motif. */
  static renvoyer(ev: Evaluation, motif: string, auteur: Auteur) {
    return this.#changerEtat(
      ev.id,
      ['soumise'],
      'brouillon',
      'Renvoi d’évaluation à l’enseignant',
      auteur,
      { motif }
    )
  }

  /** RG12 : seul le chef d'établissement déverrouille une évaluation validée, motif journalisé. */
  static deverrouiller(ev: Evaluation, motif: string, auteur: Auteur) {
    return this.#changerEtat(
      ev.id,
      ['validee'],
      'brouillon',
      'Déverrouillage d’évaluation',
      auteur,
      { motif }
    )
  }

  /** RG13 : dérogation à la fenêtre de saisie pour une affectation et une période. */
  static async accorderDerogation(
    affectation: Affectation,
    periode: Periode,
    jusquAu: DateTime,
    motif: string,
    auteur: Auteur
  ) {
    await this.#verifierAnneeActive(affectation)
    if (periode.anneeId !== affectation.anneeId) {
      throw new RegleGestionException('La période n’appartient pas à l’année de l’affectation.')
    }
    if (jusquAu < DateTime.now().startOf('day')) {
      throw new RegleGestionException('La dérogation doit courir au moins jusqu’à aujourd’hui.')
    }
    return db.transaction(async (trx) => {
      const d = await DerogationSaisie.create(
        {
          affectationId: affectation.id,
          periodeId: periode.id,
          jusquAu,
          motif,
          accordeePar: auteur.id,
        },
        { client: trx }
      )
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Dérogation de saisie',
          entite: 'affectations',
          entiteId: affectation.id,
          apres: { periode: periode.libelle, jusquAu: jusquAu.toISODate(), motif },
          ip: auteur.ip,
        },
        trx
      )
      return d
    })
  }

  /**
   * Suivi des saisies (direction) : une ligne par affectation de l'année,
   * avec le décompte des évaluations de la période par état et la dérogation
   * en cours la plus lointaine (RG13).
   */
  static async suiviSaisies(anneeId: number, periode: Periode | null, classeId: number | null) {
    const affectations = await db
      .from('affectations as a')
      .join('classes as c', 'c.id', 'a.classe_id')
      .join('matieres as m', 'm.id', 'a.matiere_id')
      .join('users as u', 'u.id', 'a.enseignant_id')
      .leftJoin('evaluations as ev', (j) =>
        j
          .on('ev.affectation_id', 'a.id')
          .andOnVal('ev.periode_id', periode?.id ?? 0)
          .andOnNull('ev.deleted_at')
      )
      .where('a.annee_id', anneeId)
      .whereNull('a.deleted_at')
      .if(classeId, (q) => q.where('a.classe_id', classeId!))
      .groupBy('a.id', 'c.libelle', 'm.libelle', 'u.full_name')
      .select('a.id', 'c.libelle as classe', 'm.libelle as matiere', 'u.full_name as enseignant')
      .select(
        db.raw(`COUNT(ev.id) FILTER (WHERE ev.etat = 'brouillon') AS brouillons`),
        db.raw(`COUNT(ev.id) FILTER (WHERE ev.etat = 'soumise') AS soumises`),
        db.raw(`COUNT(ev.id) FILTER (WHERE ev.etat IN ('validee', 'verrouillee')) AS validees`)
      )
      .orderBy('c.libelle')
      .orderBy('m.libelle')

    const derogations = periode
      ? await db
          .from('derogations_saisie')
          .where('periode_id', periode.id)
          .whereNull('deleted_at')
          .where('jusqu_au', '>=', DateTime.now().toISODate()!)
          .select('affectation_id', 'jusqu_au')
      : []

    return affectations.map((a) => ({
      id: a.id as number,
      classe: a.classe as string,
      matiere: a.matiere as string,
      enseignant: a.enseignant as string,
      brouillons: Number(a.brouillons),
      soumises: Number(a.soumises),
      validees: Number(a.validees),
      derogation:
        derogations
          .filter((x) => x.affectation_id === a.id)
          .map((x) => DateTime.fromJSDate(x.jusqu_au))
          .sort((x, y) => y.toMillis() - x.toMillis())[0] ?? null,
    }))
  }
}

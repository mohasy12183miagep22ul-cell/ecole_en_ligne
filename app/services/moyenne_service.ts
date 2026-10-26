import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

/** Note telle que le calcul la voit. */
export type NoteCalcul = {
  valeur: number | null
  absent: boolean
  noteMax: number
  poids: number
}

export type LigneResultat = {
  eleveId: number
  matricule: string
  nom: string
  prenoms: string
  /** Moyenne /20 par matière (clé : identifiant de matière), non arrondie (RG15). */
  moyennes: Record<number, number | null>
  /** Rang dans la classe par matière (RG16). */
  rangs: Record<number, number | null>
  generale: number | null
  rang: number | null
}

export type ResultatsClasse = {
  classeId: number
  periodeId: number
  /** `validees` : seules les évaluations validées ou verrouillées comptent. */
  mode: 'validees' | 'toutes'
  calculeLe: string
  matieres: Array<{ id: number; code: string; libelle: string; coefficient: number }>
  lignes: LigneResultat[]
  /** Moyenne, minimum et maximum de la classe par matière. */
  statistiques: Record<number, Statistiques>
  generale: Statistiques
}

export type Statistiques = { moyenne: number | null; min: number | null; max: number | null }

/**
 * Calcul des moyennes et des rangs (§ 6) : le seul code qui calcule. L'écran
 * enseignant, la délibération et le bulletin passent tous par ici, si bien
 * qu'un bulletin ne peut jamais contredire un écran.
 *
 * - Les notes sont ramenées sur 20 avant pondération (note / note max × 20).
 * - Un absent sort du numérateur et du dénominateur ; un 0 compte (RG11).
 * - Aucun arrondi ici : il n'intervient qu'à l'affichage (RG15).
 * - Rien n'est stocké comme donnée de référence ; seul un cache daté, invalidé
 *   par empreinte, évite de recalculer une classe inchangée (RG14).
 */
export default class MoyenneService {
  /** M_matière = Σ(n × p) / Σ p, sur 20, absents et notes manquantes exclus. */
  static moyenneMatiere(notes: NoteCalcul[]): number | null {
    let somme = 0
    let poids = 0
    for (const n of notes) {
      if (n.absent || n.valeur === null) continue
      somme += (n.valeur / n.noteMax) * 20 * n.poids
      poids += n.poids
    }
    return poids > 0 ? somme / poids : null
  }

  /** M_générale = Σ(M × c) / Σ c ; une matière sans moyenne n'entre pas dans le calcul. */
  static moyenneGenerale(lignes: Array<{ moyenne: number | null; coefficient: number }>) {
    let somme = 0
    let coefs = 0
    for (const l of lignes) {
      if (l.moyenne === null || l.coefficient <= 0) continue
      somme += l.moyenne * l.coefficient
      coefs += l.coefficient
    }
    return coefs > 0 ? somme / coefs : null
  }

  /** Moyenne annuelle : moyenne des périodes à poids égal (périodes sans moyenne écartées). */
  static moyenneAnnuelle(periodes: Array<number | null>) {
    const v = periodes.filter((x): x is number => x !== null)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
  }

  /**
   * Rang sur la valeur non arrondie (RG16) : égalité → même rang, rang
   * suivant sauté (1, 2, 2, 4). Sans moyenne → pas de rang.
   */
  static rangs<K>(valeurs: Array<{ cle: K; valeur: number | null }>): Map<K, number | null> {
    const classees = valeurs
      .filter((v): v is { cle: K; valeur: number } => v.valeur !== null)
      .sort((a, b) => b.valeur - a.valeur)
    const resultat = new Map<K, number | null>(valeurs.map((v) => [v.cle, null]))
    classees.forEach((v, i) => {
      const precedent = classees[i - 1]
      resultat.set(
        v.cle,
        precedent && precedent.valeur === v.valeur ? resultat.get(precedent.cle)! : i + 1
      )
    })
    return resultat
  }

  static statistiques(valeurs: Array<number | null>): Statistiques {
    const v = valeurs.filter((x): x is number => x !== null)
    if (!v.length) return { moyenne: null, min: null, max: null }
    return {
      moyenne: v.reduce((a, b) => a + b, 0) / v.length,
      min: Math.min(...v),
      max: Math.max(...v),
    }
  }

  /** Part des moyennes au moins égales à 10 sur 20, parmi les élèves qui ont une moyenne. */
  static tauxReussite(valeurs: Array<number | null>) {
    const v = valeurs.filter((x): x is number => x !== null)
    return v.length ? v.filter((x) => x >= 10).length / v.length : null
  }

  /** Statistiques d'une évaluation, dans son barème (grille, validation). */
  static statistiquesEvaluation(
    notes: Array<{ valeur: number | null; absent: boolean }>,
    effectif: number
  ) {
    const valeurs = notes.filter((n) => !n.absent && n.valeur !== null).map((n) => n.valeur!)
    const absents = notes.filter((n) => n.absent).length
    return {
      ...this.statistiques(valeurs),
      notes: valeurs.length,
      absents,
      reste: Math.max(0, effectif - valeurs.length - absents),
      effectif,
    }
  }

  /**
   * Élèves d'une classe présents sur une période : inscription validée, et
   * pas sortis (transfert, abandon, exclusion) avant le début de la période.
   */
  static elevesDeLaClasse(classeId: number, depuis: DateTime) {
    return db
      .from('inscriptions as i')
      .join('eleves as e', 'e.id', 'i.eleve_id')
      .where('i.classe_id', classeId)
      .where('i.etat', 'valide')
      .whereNull('i.deleted_at')
      .whereNull('e.deleted_at')
      .where((w) =>
        w
          .whereNull('e.statut')
          .orWhereNotIn('e.statut', ['transfere', 'abandon', 'exclu'])
          .orWhere('e.statut_date', '>', depuis.toISODate()!)
      )
      .select('e.id', 'e.matricule', 'e.nom', 'e.prenoms', 'e.statut', 'e.statut_date')
      .orderBy('e.nom')
      .orderBy('e.prenoms')
  }

  /**
   * Résultats d'un élève dans sa classe, période par période (fiche élève).
   * Provisoires : les évaluations non encore validées comptent.
   */
  static async resultatsEleve(eleveId: number, classeId: number, anneeId: number) {
    const periodes = await db
      .from('periodes')
      .where('annee_id', anneeId)
      .whereNull('deleted_at')
      .orderBy('ordre')
    const resultat = []
    for (const p of periodes) {
      const r = await this.resultatsClasse(classeId, p.id, 'toutes')
      const ligne = r.lignes.find((l) => l.eleveId === eleveId)
      resultat.push({
        periode: p.libelle as string,
        matieres: r.matieres.map((m) => ({
          libelle: m.libelle,
          coefficient: m.coefficient,
          moyenne: ligne?.moyennes[m.id] ?? null,
          moyenneClasse: r.statistiques[m.id]?.moyenne ?? null,
        })),
        generale: ligne?.generale ?? null,
        rang: ligne?.rang ?? null,
        effectif: r.lignes.length,
      })
    }
    return resultat
  }

  /** Empreinte de tout ce dont dépend le résultat d'une classe sur une période. */
  static async #empreinte(classeId: number, periodeId: number, mode: string) {
    const [r] = await db
      .rawQuery(
        `SELECT
         (SELECT COUNT(*) || ':' || COALESCE(MAX(n.updated_at), MAX(n.created_at))::text
            FROM notes n JOIN evaluations ev ON ev.id = n.evaluation_id
            JOIN affectations a ON a.id = ev.affectation_id
           WHERE a.classe_id = :classe AND ev.periode_id = :periode) AS n,
         (SELECT COUNT(*) || ':' || COALESCE(MAX(ev.updated_at), MAX(ev.created_at))::text
            FROM evaluations ev JOIN affectations a ON a.id = ev.affectation_id
           WHERE a.classe_id = :classe AND ev.periode_id = :periode) AS e,
         (SELECT COUNT(*) || ':' || COALESCE(MAX(nm.updated_at), MAX(nm.created_at))::text
            FROM niveau_matiere nm JOIN classes c ON c.niveau_id = nm.niveau_id
           WHERE c.id = :classe) AS c,
         (SELECT COUNT(*) || ':' || COALESCE(MAX(GREATEST(i.updated_at, e.updated_at)), MAX(i.created_at))::text
            FROM inscriptions i JOIN eleves e ON e.id = i.eleve_id
           WHERE i.classe_id = :classe) AS i`,
        { classe: classeId, periode: periodeId }
      )
      .then((x) => x.rows)
    return `${mode}|${r.n}|${r.e}|${r.c}|${r.i}`.slice(0, 200)
  }

  /**
   * Résultats d'une classe sur une période. `validees` pour la délibération et
   * les bulletins ; `toutes` pour le suivi en cours de période (provisoire).
   */
  static async resultatsClasse(
    classeId: number,
    periodeId: number,
    mode: 'validees' | 'toutes' = 'validees'
  ): Promise<ResultatsClasse> {
    const empreinte = await this.#empreinte(classeId, periodeId, mode)
    if (mode === 'validees') {
      const cache = await db
        .from('cache_moyennes')
        .where({ classe_id: classeId, periode_id: periodeId })
        .whereNull('deleted_at')
        .first()
      if (cache && cache.empreinte === empreinte) return cache.resultat as ResultatsClasse
    }

    const resultat = await this.#calculer(classeId, periodeId, mode)
    if (mode === 'validees') {
      const maintenant = new Date()
      const valeurs = { empreinte, resultat: JSON.stringify(resultat), calcule_le: maintenant }
      const misAJour = await db
        .from('cache_moyennes')
        .where({ classe_id: classeId, periode_id: periodeId })
        .whereNull('deleted_at')
        .update({ ...valeurs, updated_at: maintenant })
      if (Number(misAJour) === 0) {
        // Deux calculs simultanés : l'index unique garde une seule ligne, l'autre est ignoré.
        await db
          .table('cache_moyennes')
          .insert({
            ...valeurs,
            classe_id: classeId,
            periode_id: periodeId,
            created_at: maintenant,
          })
          .catch(() => {})
      }
    }
    return resultat
  }

  static async #calculer(classeId: number, periodeId: number, mode: 'validees' | 'toutes') {
    const periode = await db.from('periodes').where('id', periodeId).firstOrFail()
    const classe = await db.from('classes').where('id', classeId).firstOrFail()
    const programme = await db
      .from('niveau_matiere as nm')
      .join('matieres as m', 'm.id', 'nm.matiere_id')
      .where('nm.niveau_id', classe.niveau_id)
      .whereNull('nm.deleted_at')
      .select('m.id', 'm.code', 'm.libelle', 'nm.coefficient')
      .orderBy('m.libelle')
    const matieres = programme.map((m) => ({
      id: m.id as number,
      code: m.code as string,
      libelle: m.libelle as string,
      coefficient: Number(m.coefficient),
    }))

    const eleves = await this.elevesDeLaClasse(classeId, DateTime.fromJSDate(periode.debut_saisie))
    const notes = await db
      .from('notes as n')
      .join('evaluations as ev', 'ev.id', 'n.evaluation_id')
      .join('affectations as a', 'a.id', 'ev.affectation_id')
      .where('a.classe_id', classeId)
      .where('ev.periode_id', periodeId)
      .whereNull('n.deleted_at')
      .whereNull('ev.deleted_at')
      .whereNull('a.deleted_at')
      .if(mode === 'validees', (q) => q.whereIn('ev.etat', ['validee', 'verrouillee']))
      .select('n.eleve_id', 'n.valeur', 'n.absent', 'ev.note_max', 'ev.poids', 'a.matiere_id')

    const parEleveMatiere = new Map<string, NoteCalcul[]>()
    for (const n of notes) {
      const cle = `${n.eleve_id}:${n.matiere_id}`
      const liste = parEleveMatiere.get(cle) ?? []
      liste.push({
        valeur: n.valeur === null ? null : Number(n.valeur),
        absent: n.absent,
        noteMax: Number(n.note_max),
        poids: Number(n.poids),
      })
      parEleveMatiere.set(cle, liste)
    }

    const lignes: LigneResultat[] = eleves.map((e) => {
      const moyennes: Record<number, number | null> = {}
      for (const m of matieres) {
        moyennes[m.id] = this.moyenneMatiere(parEleveMatiere.get(`${e.id}:${m.id}`) ?? [])
      }
      return {
        eleveId: e.id,
        matricule: e.matricule,
        nom: e.nom,
        prenoms: e.prenoms,
        moyennes,
        rangs: {},
        generale: this.moyenneGenerale(
          matieres.map((m) => ({ moyenne: moyennes[m.id], coefficient: m.coefficient }))
        ),
        rang: null,
      }
    })

    const statistiques: Record<number, Statistiques> = {}
    for (const m of matieres) {
      const rangs = this.rangs(lignes.map((l) => ({ cle: l.eleveId, valeur: l.moyennes[m.id] })))
      for (const l of lignes) l.rangs[m.id] = rangs.get(l.eleveId) ?? null
      statistiques[m.id] = this.statistiques(lignes.map((l) => l.moyennes[m.id]))
    }
    const rangs = this.rangs(lignes.map((l) => ({ cle: l.eleveId, valeur: l.generale })))
    for (const l of lignes) l.rang = rangs.get(l.eleveId) ?? null

    return {
      classeId,
      periodeId,
      mode,
      calculeLe: new Date().toISOString(),
      matieres,
      lignes,
      statistiques,
      generale: this.statistiques(lignes.map((l) => l.generale)),
    }
  }
}

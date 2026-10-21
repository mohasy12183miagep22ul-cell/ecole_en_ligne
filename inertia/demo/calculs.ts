/**
 * Calculs d'aperçu de la démonstration, repris du prototype.
 *
 * En production, moyennes et rangs viennent du service serveur unique
 * (MoyenneService) : un écran ne doit jamais calculer sa propre version.
 */
import { num } from '~/lib/format'
import { MATIERES, inscrits, type CodeMatiere, type Eleve, type Evaluation } from './donnees'
import { type EtatDemo } from './store'

/** Moyenne de mathématiques d'un élève sur 20, pondérée par le poids des évaluations. */
export const moyenneMaths = (st: EtatDemo, classe: string, eleveId: string) => {
  let n = 0
  let d = 0
  st.evals.forEach((e) => {
    if (e.classe !== classe || e.matiere !== 'MA') return
    const c = st.grids[e.id]?.[eleveId]
    if (!c || c.abs || c.v === '') return
    const x = num(c.v)
    if (x === null) return
    n += (x / e.max) * 20 * e.poids
    d += e.poids
  })
  return d ? n / d : null
}

export type LigneClasse = {
  s: Eleve
  av: Record<CodeMatiere, number | null>
  mg: number | null
  rang: number | null
  sr: Record<string, number | null>
}

/** Rang : égalité → même rang, rang suivant sauté (RG16). */
const rangs = <T>(arr: T[], get: (x: T) => number | null) => {
  const v = arr.map(get)
  return v.map((x) => (x === null ? null : 1 + v.filter((y) => y !== null && y > x).length))
}

/** Tableau de la 3e A : moyennes par matière, générale, rangs et statistiques. */
export const donneesClasse = (st: EtatDemo) => {
  const lignes: LigneClasse[] = inscrits('3e A').map((s) => {
    const av = { ...s.moy, MA: moyenneMaths(st, '3e A', s.id) }
    let n = 0
    let d = 0
    MATIERES.forEach((m) => {
      const v = av[m.code]
      if (v !== null) {
        n += v * m.coef
        d += m.coef
      }
    })
    return { s, av, mg: d ? n / d : null, rang: null, sr: {} }
  })
  rangs(lignes, (x) => x.mg).forEach((r, i) => (lignes[i].rang = r))
  const stats: Partial<Record<CodeMatiere, { min: number; max: number; moyenne: number }>> = {}
  MATIERES.forEach((m) => {
    rangs(lignes, (x) => x.av[m.code]).forEach((r, i) => (lignes[i].sr[m.code] = r))
    const f = lignes.map((x) => x.av[m.code]).filter((v): v is number => v !== null)
    if (f.length)
      stats[m.code] = {
        min: Math.min(...f),
        max: Math.max(...f),
        moyenne: f.reduce((a, b) => a + b, 0) / f.length,
      }
  })
  const m = lignes.map((x) => x.mg).filter((v): v is number => v !== null)
  return {
    lignes,
    stats,
    moyenne: m.reduce((a, b) => a + b, 0) / m.length,
    reussite: m.filter((v) => v >= 10).length / m.length,
    effectif: lignes.length,
  }
}

/** Statistiques d'une évaluation (valeurs sur la note maximale). */
export const statsEval = (st: EtatDemo, e: Evaluation) => {
  const ro = inscrits(e.classe)
  const g = st.grids[e.id]
  let vals: number[] = []
  let abs = 0
  if (g) {
    ro.forEach((s) => {
      const c = g[s.id]
      if (!c) return
      if (c.abs) {
        abs++
        return
      }
      const x = num(c.v)
      if (c.v !== '' && x !== null) vals.push(x)
    })
  } else {
    vals = ro
      .map((s) => s.moy[e.matiere])
      .filter((v): v is number => v !== null)
      .map((v) => (v * e.max) / 20)
  }
  const moyenne = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  return {
    notes: vals.length,
    abs,
    total: ro.length,
    reste: ro.length - vals.length - abs,
    moyenne,
    min: vals.length ? Math.min(...vals) : null,
    max: vals.length ? Math.max(...vals) : null,
  }
}

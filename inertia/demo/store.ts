/**
 * État partagé de la démonstration : reprend l'état mutable du prototype pour
 * que les enchaînements fonctionnent d'un écran à l'autre (soumission →
 * validation → publication → portail famille). Persisté en localStorage et
 * synchronisé entre onglets, pour pouvoir changer de profil dans un autre onglet.
 *
 * À remplacer écran par écran par les actions serveur.
 */
import { useSyncExternalStore } from 'react'
import {
  COEFS_INITIAUX,
  COMPTES_INITIAUX,
  EVALUATIONS,
  JOURNAL_INITIAL,
  grillesInitiales,
  heure,
  maintenant,
  type Cellule,
  type CodeMatiere,
  type Compte,
  type EntreeJournal,
  type EtatEval,
  type Evaluation,
  type Grilles,
} from './donnees'

export type EtatBulletins = 'none' | 'generating' | 'generated' | 'published'

export type EtatDemo = {
  evals: Evaluation[]
  grids: Grilles
  appr: Record<string, string>
  apprG: Record<string, string>
  dec: Record<string, string>
  bul: EtatBulletins
  pubAt: string | null
  ignoreEPS: boolean
  epsMotif: string
  rectif: number
  journal: EntreeJournal[]
  docsDone: Record<string, boolean>
  coefs: Record<CodeMatiere, Array<number | ''>>
  comptes: Compte[]
  /** Enfant sélectionné sur le portail famille. */
  enfant: 'aminata' | 'moussa'
  /** Filtre de classe de l'écran « Mes évaluations ». */
  filtreClasse: string
  /** Dernière heure d'enregistrement de la grille. */
  savedAt: string
  /** Modifications de grille en attente de renvoi (hors ligne). */
  pending: number
}

const CLE = 'ecole-en-ligne:demo:v1'

const initial = (): EtatDemo => ({
  evals: EVALUATIONS.map((e) => ({ ...e })),
  grids: grillesInitiales(),
  appr: {},
  apprG: {},
  dec: {},
  bul: 'none',
  pubAt: null,
  ignoreEPS: false,
  epsMotif: '',
  rectif: 0,
  journal: JOURNAL_INITIAL.slice(),
  docsDone: {},
  coefs: JSON.parse(JSON.stringify(COEFS_INITIAUX)),
  comptes: COMPTES_INITIAUX.map((c) => ({ ...c })),
  enfant: 'aminata',
  filtreClasse: 'Toutes',
  savedAt: '17:58',
  pending: 0,
})

const lire = (): EtatDemo => {
  try {
    const brut = typeof window === 'undefined' ? null : window.localStorage.getItem(CLE)
    if (brut) {
      const lu: EtatDemo = { ...initial(), ...JSON.parse(brut) }
      // Une génération interrompue par un rechargement est considérée terminée.
      if (lu.bul === 'generating') lu.bul = 'generated'
      return lu
    }
  } catch {
    // stockage indisponible (navigation privée, aperçu) : on repart du jeu initial
  }
  return initial()
}

let etat: EtatDemo = lire()
const abonnes = new Set<() => void>()

const ecrire = () => {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(etat))
  } catch {
    // sans persistance, la démo reste utilisable dans l'onglet courant
  }
}

export const modifier = (f: (s: EtatDemo) => Partial<EtatDemo>) => {
  etat = { ...etat, ...f(etat) }
  ecrire()
  abonnes.forEach((a) => a())
}

const abonner = (a: () => void) => {
  abonnes.add(a)
  // Modification faite dans un autre onglet : on relit l'état partagé.
  const autreOnglet = (e: StorageEvent) => {
    if (e.key !== CLE) return
    etat = lire()
    a()
  }
  window.addEventListener('storage', autreOnglet)
  return () => {
    abonnes.delete(a)
    window.removeEventListener('storage', autreOnglet)
  }
}

const serveur = initial()
export const useDemo = () =>
  useSyncExternalStore(
    abonner,
    () => etat,
    () => serveur
  )

export const reinitialiser = () => modifier(() => initial())

/* ---------------------------------------------------------------- actions */

/** Ajoute une entrée en tête du journal (RG22). */
export const journaliser = (
  auteur: string,
  action: string,
  objet: string,
  avant = '',
  apres = ''
) =>
  modifier((s) => ({
    journal: [{ auteur, action, objet, avant, apres, date: maintenant() }, ...s.journal],
  }))

export const changerEtatEval = (id: string, e: EtatEval) =>
  modifier((s) => ({ evals: s.evals.map((x) => (x.id === id ? { ...x, etat: e } : x)) }))

export const ajouterEval = (ev: Evaluation) =>
  modifier((s) => ({ evals: [...s.evals, ev], grids: { ...s.grids, [ev.id]: {} } }))

export const modifierCellule = (evId: string, eleveId: string, patch: Partial<Cellule>) =>
  modifier((s) => {
    const g = { ...s.grids[evId] }
    g[eleveId] = { ...(g[eleveId] ?? { v: '', abs: false, obs: '' }), ...patch }
    return { grids: { ...s.grids, [evId]: g } }
  })

export const remplacerGrille = (evId: string, g: Record<string, Cellule>) =>
  modifier((s) => ({ grids: { ...s.grids, [evId]: g } }))

export const marquerEnregistre = () => modifier(() => ({ savedAt: heure(), pending: 0 }))
export const ajouterEnAttente = () => modifier((s) => ({ pending: s.pending + 1 }))

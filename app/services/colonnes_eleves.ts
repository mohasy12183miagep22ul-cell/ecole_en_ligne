import { DateTime } from 'luxon'

/**
 * Colonnes de la liste des élèves. L'export Excel ou PDF ne reprend que les
 * colonnes visibles à l'écran (§ 4).
 */
export const COLONNES_ELEVES = {
  eleve: 'Élève',
  matricule: 'Matricule',
  classe: 'Classe',
  niveau: 'Niveau',
  sexe: 'Sexe',
  naissance: 'Date de naissance',
  statut: 'Statut',
  dossier: 'Dossier',
  etat: 'Inscription',
  redoublant: 'Redoublant',
} as const

export type ColonneEleve = keyof typeof COLONNES_ELEVES

export const LIBELLES_STATUT: Record<string, string> = {
  inscrit: 'Inscrit',
  transfere: 'Transféré',
  abandon: 'Abandon',
  diplome: 'Diplômé',
  exclu: 'Exclu',
}

export const LIBELLES_ETAT: Record<string, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  valide: 'Validée',
  refuse: 'Refusée',
  annule: 'Annulée',
}

type LigneSql = Record<string, unknown>

const date = (v: unknown) =>
  v instanceof Date ? DateTime.fromJSDate(v).toFormat('dd/MM/yyyy') : v ? String(v) : ''

/** Valeur affichable d'une colonne pour une ligne de la requête de liste. */
export const valeurColonne = (l: LigneSql, c: ColonneEleve): string => {
  switch (c) {
    case 'eleve':
      return `${String(l.nom).toUpperCase()} ${l.prenoms}`
    case 'matricule':
      return String(l.matricule)
    case 'classe':
      return (l.classe as string | null) ?? '—'
    case 'niveau':
      return String(l.niveau)
    case 'sexe':
      return String(l.sexe)
    case 'naissance':
      return date(l.date_naissance)
    case 'statut':
      return l.statut ? LIBELLES_STATUT[String(l.statut)] : 'Non inscrit'
    case 'dossier':
      return l.incomplet ? 'Incomplet' : 'Complet'
    case 'etat':
      return LIBELLES_ETAT[String(l.etat)] ?? String(l.etat)
    case 'redoublant':
      return l.redoublant ? 'Oui' : 'Non'
  }
}

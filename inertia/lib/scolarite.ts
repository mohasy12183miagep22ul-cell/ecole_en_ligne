import { type Etat } from '~/components/ui/pastille'

/** Statut de l'élève dans l'établissement (§ 4) ; null avant la première validation. */
export type StatutEleve = 'inscrit' | 'transfere' | 'abandon' | 'diplome' | 'exclu' | null
export type EtatDossier = 'brouillon' | 'soumis' | 'valide' | 'refuse' | 'annule'

export const LIBELLES_STATUT: Record<string, string> = {
  inscrit: 'Inscrit',
  transfere: 'Transféré',
  abandon: 'Abandon',
  diplome: 'Diplômé',
  exclu: 'Exclu',
  non_inscrit: 'Non encore inscrit',
}

export const LIBELLES_ETAT: Record<EtatDossier, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  valide: 'Validé',
  refuse: 'Refusé',
  annule: 'Annulé',
}

export const libelleStatut = (s: StatutEleve) => LIBELLES_STATUT[s ?? 'non_inscrit']

export const etatStatut = (s: StatutEleve): Etat =>
  s === 'inscrit' || s === 'diplome'
    ? 'succes'
    : s === 'transfere'
      ? 'info'
      : s === 'abandon' || s === 'exclu'
        ? 'erreur'
        : 'brouillon'

export const etatDossier = (e: EtatDossier): Etat =>
  e === 'valide'
    ? 'succes'
    : e === 'soumis'
      ? 'info'
      : e === 'refuse'
        ? 'erreur'
        : e === 'annule'
          ? 'verrou'
          : 'brouillon'

/** Date ISO (AAAA-MM-JJ) affichée en JJ/MM/AAAA. */
export const dateFr = (iso: string | null | undefined) =>
  iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—'

/** Taille de fichier lisible. */
export const taille = (octets: number | null) =>
  octets === null
    ? ''
    : octets < 1024 * 1024
      ? `${Math.ceil(octets / 1024)} Ko`
      : `${(octets / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`

export type ClasseEffectif = {
  id: number
  libelle: string
  niveauId: number
  capacite: number
  effectif: number
}

/** « 31 / 40 » et l'alerte de capacité (RG7). */
export const occupation = (c: ClasseEffectif) => `${c.effectif} / ${c.capacite}`
export const estPleine = (c: ClasseEffectif, ajout = 1) => c.effectif + ajout > c.capacite

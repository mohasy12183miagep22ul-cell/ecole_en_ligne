import { type Etat } from '~/components/ui/pastille'

export type EtatAnnee = 'preparation' | 'active' | 'cloturee'
export type EtatSaisie = 'ouverte' | 'a_venir' | 'close'

/** Pastille d'état d'une année (texte toujours présent, pas seulement la couleur). */
export const ETATS_ANNEE: Record<EtatAnnee, { libelle: string; etat: Etat }> = {
  active: { libelle: 'Active', etat: 'succes' },
  preparation: { libelle: 'En préparation', etat: 'info' },
  cloturee: { libelle: 'Clôturée', etat: 'verrou' },
}

/** Pastille de la fenêtre de saisie d'une période (calculée par le serveur, RG13). */
export const ETATS_SAISIE: Record<EtatSaisie, { libelle: string; etat: Etat }> = {
  ouverte: { libelle: 'Saisie ouverte', etat: 'succes' },
  a_venir: { libelle: 'À venir', etat: 'brouillon' },
  close: { libelle: 'Saisie close', etat: 'verrou' },
}

/** « 2026-09-01 » → « 01/09/2026 ». */
export const dateFr = (iso: string) => iso.split('-').reverse().join('/')

/** « 2026-09-01 » → « 01/09 ». */
export const jourMois = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/')

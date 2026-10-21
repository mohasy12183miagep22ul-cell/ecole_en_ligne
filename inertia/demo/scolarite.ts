import { type Etat } from '~/components/ui/pastille'
import { type Eleve } from './donnees'
import { type EtatDemo } from './store'

/** Pastille de statut d'inscription. */
export const etatStatut = (s: Eleve): Etat => (s.statut === 'Inscrit' ? 'succes' : 'attention')

/** Dossier incomplet : pièce manquante non encore jointe. */
export const estIncomplet = (st: EtatDemo, s: Eleve) =>
  s.manquantes.length > 0 && !st.docsDone[s.id]

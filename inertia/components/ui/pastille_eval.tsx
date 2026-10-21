import Pastille from './pastille'
import { PASTILLE_EVAL, type EtatEval } from '~/demo/donnees'

/** État d'une évaluation : brouillon, soumise, validée, verrouillée. */
export default function PastilleEval({ etat }: { etat: EtatEval }) {
  const p = PASTILLE_EVAL[etat]
  return (
    <Pastille etat={p.etat === 'neutre' ? 'brouillon' : p.etat} icone={p.icone}>
      {p.libelle}
    </Pastille>
  )
}

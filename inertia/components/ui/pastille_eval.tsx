import Pastille from './pastille'
import { type NomIcone } from '~/lib/icones'

type Etat = 'brouillon' | 'soumise' | 'validee' | 'verrouillee' | 'validée' | 'verrouillée'

const PASTILLES: Record<
  'brouillon' | 'soumise' | 'validee' | 'verrouillee',
  { etat: 'brouillon' | 'attention' | 'succes' | 'verrou'; libelle: string; icone: NomIcone }
> = {
  brouillon: { etat: 'brouillon', libelle: 'Brouillon', icone: 'pen-to-square' },
  soumise: { etat: 'attention', libelle: 'Soumise', icone: 'paper-plane' },
  validee: { etat: 'succes', libelle: 'Validée', icone: 'circle-check' },
  verrouillee: { etat: 'verrou', libelle: 'Verrouillée', icone: 'lock' },
}

/** État d'une évaluation : brouillon, soumise, validée, verrouillée. */
export default function PastilleEval({ etat }: { etat: Etat }) {
  const cle = etat === 'validée' ? 'validee' : etat === 'verrouillée' ? 'verrouillee' : etat
  const p = PASTILLES[cle]
  return (
    <Pastille etat={p.etat} icone={p.icone}>
      {p.libelle}
    </Pastille>
  )
}

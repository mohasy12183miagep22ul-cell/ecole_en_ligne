import Icone from './icone'
import { cx } from '~/lib/format'
import { type NomIcone } from '~/lib/icones'
import { type ReactNode } from 'react'

export type Etat = 'succes' | 'attention' | 'erreur' | 'info' | 'neutre' | 'brouillon' | 'verrou'

const couleurs: Record<Etat, string> = {
  succes: 'bg-succes-fond text-succes',
  attention: 'bg-attention-fond text-attention',
  erreur: 'bg-erreur-fond text-erreur',
  info: 'bg-info-fond text-info',
  neutre: 'bg-neutre text-encre-2',
  brouillon: 'bg-neutre text-encre-nav',
  verrou: 'bg-verrou-fond text-verrou',
}

/**
 * Badge d'état. La couleur ne porte jamais seule l'information : un libellé
 * est toujours présent, et une icône quand elle est fournie.
 */
export default function Pastille({
  etat = 'neutre',
  icone,
  taille = 'normale',
  className,
  children,
}: {
  etat?: Etat
  icone?: NomIcone
  /** `petite` : 3px 8px, 11 px (listes mobiles, pièces). */
  taille?: 'normale' | 'moyenne' | 'petite'
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap',
        taille === 'normale' && 'px-2.5 py-[5px] text-leg',
        taille === 'moyenne' && 'px-[9px] py-1 text-leg',
        taille === 'petite' && 'px-2 py-[3px] text-micro',
        couleurs[etat],
        className
      )}
    >
      {icone && <Icone nom={icone} />}
      {children}
    </span>
  )
}

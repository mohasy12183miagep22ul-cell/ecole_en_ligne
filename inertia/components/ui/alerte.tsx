import Icone from './icone'
import { cx } from '~/lib/format'
import { type Etat } from './pastille'
import { type NomIcone } from '~/lib/icones'
import { type ReactNode } from 'react'

type EtatAlerte = Extract<Etat, 'succes' | 'attention' | 'erreur' | 'info'>

const style: Record<EtatAlerte, { c: string; i: NomIcone }> = {
  succes: { c: 'bg-succes-fond text-succes', i: 'circle-check' },
  attention: { c: 'bg-attention-fond text-attention', i: 'triangle-exclamation' },
  erreur: { c: 'bg-erreur-fond text-erreur', i: 'circle-exclamation' },
  info: { c: 'bg-info-fond text-info', i: 'circle-info' },
}

/** Message d'alerte : paire de couleurs d'état + icône à gauche. */
export default function Alerte({
  etat = 'info',
  icone,
  alerte,
  className,
  children,
}: {
  etat?: EtatAlerte
  icone?: NomIcone
  /** `true` pour une erreur à annoncer immédiatement (role="alert"). */
  alerte?: boolean
  className?: string
  children: ReactNode
}) {
  const s = style[etat]
  return (
    <div
      role={alerte ? 'alert' : undefined}
      className={cx(
        'flex items-start gap-2.5 rounded-champ px-3 py-2.5 text-meta leading-snug font-medium',
        s.c,
        className
      )}
    >
      <Icone nom={icone ?? s.i} className="mt-0.5" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

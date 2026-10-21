import { cx } from '~/lib/format'
import { type ReactNode } from 'react'

type Onglet<T extends string> = { id: T; libelle: string; compteur?: number }

type Props<T extends string> = {
  'onglets': Onglet<T>[]
  'actif': T
  'onChange': (id: T) => void
  /** `segmente` : conteneur gris, onglet actif blanc. `souligne` : défilant, soulignement accent. */
  'variante'?: 'segmente' | 'souligne'
  'aria-label': string
  'className'?: string
}

export default function Onglets<T extends string>({
  onglets,
  actif,
  onChange,
  variante = 'segmente',
  className,
  ...rest
}: Props<T>) {
  const segmente = variante === 'segmente'
  return (
    <div
      role="tablist"
      aria-label={rest['aria-label']}
      className={cx(
        segmente
          ? 'flex gap-1 rounded-bouton bg-neutre-2 p-1'
          : 'scroll-masque flex gap-1 overflow-x-auto border-b border-bordure',
        className
      )}
    >
      {onglets.map((o) => {
        const on = o.id === actif
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={cx(
              'flex items-center justify-center gap-2 text-meta font-bold whitespace-nowrap transition',
              segmente
                ? cx(
                    'h-10 flex-1 rounded-[9px]',
                    on ? 'bg-white text-encre shadow-onglet' : 'text-encre-3'
                  )
                : cx(
                    'h-11 border-b-2 px-3 text-corps',
                    on
                      ? 'border-accent font-bold text-accent'
                      : 'border-transparent font-medium text-encre-3'
                  )
            )}
          >
            {o.libelle}
            {o.compteur !== undefined && (
              <span
                className={cx(
                  'flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-micro',
                  on ? 'bg-accent text-white' : 'bg-bordure-champ text-encre-2'
                )}
              >
                {o.compteur}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Rangée défilante de pastilles de filtre (enfant, période, classe…). */
export function PastillesFiltre<T extends string>({
  options,
  actif,
  onChange,
  'aria-label': ariaLabel,
}: {
  'options': Array<{ id: T; libelle: ReactNode }>
  'actif': T
  'onChange': (id: T) => void
  'aria-label': string
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="scroll-masque flex gap-2 overflow-x-auto">
      {options.map((o) => {
        const on = o.id === actif
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            className={cx(
              'h-9 shrink-0 rounded-champ border px-3.5 text-meta font-semibold transition',
              on
                ? 'border-accent bg-accent text-white'
                : 'border-bordure-champ bg-carte text-encre-2'
            )}
          >
            {o.libelle}
          </button>
        )
      })}
    </div>
  )
}

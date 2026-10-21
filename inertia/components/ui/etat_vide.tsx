import Icone from './icone'
import Illustration, { type NomIllustration } from './illustration'
import { cx } from '~/lib/format'
import { type NomIcone } from '~/lib/icones'
import { type ReactNode } from 'react'

/**
 * État vide : une illustration (ou une icône), une phrase, une action.
 * Jamais un tableau vide muet.
 */
export default function EtatVide({
  icone,
  illustration,
  dimensions = [180, 140],
  titre,
  texte,
  action,
  cadre = true,
  className,
}: {
  icone?: NomIcone
  illustration?: NomIllustration
  dimensions?: [number, number]
  titre: string
  texte?: string
  action?: ReactNode
  /** `false` quand l'état vide est déjà dans une carte. */
  cadre?: boolean
  className?: string
}) {
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-3 text-center',
        cadre && 'rounded-carte border border-bordure bg-carte px-5 py-7',
        className
      )}
    >
      {illustration ? (
        <Illustration nom={illustration} largeur={dimensions[0]} hauteur={dimensions[1]} />
      ) : (
        icone && (
          <span className="flex size-14 items-center justify-center rounded-full bg-accent-doux text-[22px] text-accent">
            <Icone nom={icone} />
          </span>
        )
      )}
      <span className="text-titre-carte font-bold">{titre}</span>
      {texte && (
        <span className="max-w-[340px] text-meta leading-normal text-encre-3">{texte}</span>
      )}
      {action}
    </div>
  )
}

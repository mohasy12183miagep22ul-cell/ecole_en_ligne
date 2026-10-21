import { cx } from '~/lib/format'

/** Jauge fine. `valeur` est un pourcentage de 0 à 100. */
export default function BarreProgression({
  valeur,
  libelle,
  className,
}: {
  valeur: number
  libelle: string
  className?: string
}) {
  const v = Math.max(0, Math.min(100, valeur))
  return (
    <div
      role="progressbar"
      aria-label={libelle}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={cx('h-1.5 w-full rounded-[3px] bg-neutre', className)}
    >
      <div className="h-full rounded-[3px] bg-accent" style={{ width: `${v}%` }} />
    </div>
  )
}

import { cx } from '~/lib/format'
import { type HTMLAttributes } from 'react'

/** Surface de base : fond blanc, bordure fine, rayon 16 px. */
export default function Carte({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-carte border border-bordure bg-carte p-4', className)} {...rest} />
  )
}

/** Sur-titre en majuscules, 11 px. */
export function SurTitre({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx('text-micro font-bold tracking-[0.06em] text-encre-3 uppercase', className)}
      {...rest}
    />
  )
}

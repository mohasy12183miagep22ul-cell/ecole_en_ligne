import Icone from '~/components/ui/icone'
import { cx } from '~/lib/format'

/** Marque « École en ligne » : pastille accent + nom. */
export default function Logo({
  taille = 36,
  nom = true,
  className,
}: {
  taille?: number
  nom?: boolean
  className?: string
}) {
  return (
    <span className={cx('flex items-center gap-2.5', className)}>
      <span
        style={{ width: taille, height: taille, borderRadius: taille * 0.3 }}
        className="flex shrink-0 items-center justify-center bg-accent text-white"
      >
        <Icone nom="graduation-cap" />
      </span>
      {nom && <span className="text-titre-carte font-extrabold">École en ligne</span>}
    </span>
  )
}

import { cx } from '~/lib/format'

/** Bascule on/off accessible (role="switch"). */
export default function Interrupteur({
  actif,
  onChange,
  libelle,
}: {
  actif: boolean
  onChange: (valeur: boolean) => void
  libelle: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      onClick={() => onChange(!actif)}
      className={cx(
        'relative h-[26px] w-11 shrink-0 rounded-full transition',
        actif ? 'bg-accent' : 'bg-bordure-moyenne'
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 size-[22px] rounded-full bg-white shadow transition-[left]',
          actif ? 'left-5' : 'left-0.5'
        )}
      />
    </button>
  )
}

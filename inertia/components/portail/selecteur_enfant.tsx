import { cx } from '~/lib/format'
import { modifier, useDemo } from '~/demo/store'
import { ENFANTS } from '~/demo/portail'

/**
 * Sélecteur d'enfant du portail. `riche` : pastille avec avatar et classe
 * (accueil) ; sinon pastille texte (notes, bulletins, dossier).
 */
export default function SelecteurEnfant({ riche = false }: { riche?: boolean }) {
  const st = useDemo()
  return (
    <div role="group" aria-label="Enfant" className="scroll-masque flex gap-2 overflow-x-auto">
      {ENFANTS.map((k) => {
        const on = st.enfant === k.id
        const choisir = () => modifier(() => ({ enfant: k.id }))
        return riche ? (
          <button
            key={k.id}
            type="button"
            aria-pressed={on}
            onClick={choisir}
            className={cx(
              'flex shrink-0 items-center gap-2.5 rounded-full border py-1.5 pr-3.5 pl-1.5',
              on ? 'border-accent bg-accent-doux' : 'border-bordure bg-white'
            )}
          >
            <span
              className={cx(
                'flex size-8 items-center justify-center rounded-full text-leg font-bold',
                k.s.avatar
              )}
            >
              {k.s.initiales}
            </span>
            <span className="flex flex-col text-left">
              <span className={cx('text-corps text-encre', on ? 'font-bold' : 'font-medium')}>
                {k.s.prenom}
              </span>
              <span className="text-micro text-encre-3">{k.classe}</span>
            </span>
          </button>
        ) : (
          <button
            key={k.id}
            type="button"
            aria-pressed={on}
            onClick={choisir}
            className={cx(
              'h-9 shrink-0 rounded-full border px-3.5 text-meta text-encre',
              on ? 'border-accent bg-accent-doux font-bold' : 'border-bordure bg-white font-medium'
            )}
          >
            {k.s.prenom}
          </button>
        )
      })}
    </div>
  )
}

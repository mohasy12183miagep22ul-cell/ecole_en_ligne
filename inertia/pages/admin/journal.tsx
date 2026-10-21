import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import { notifier } from '~/components/ui/toast'
import { type NomIcone } from '~/lib/icones'
import { espaceDesRoles } from '~/lib/navigation'
import { useDemo } from '~/demo/store'
import { usePage } from '@inertiajs/react'

const icone = (action: string): NomIcone =>
  /Connexion/.test(action)
    ? 'right-to-bracket'
    : /Publication|rectificatif/.test(action)
      ? 'file-export'
      : /Validation/.test(action)
        ? 'circle-check'
        : /Déverrouillage|Dérogation/.test(action)
          ? 'unlock'
          : /rôle/.test(action)
            ? 'user-shield'
            : 'pen'

/** Journal d'activité (RG22) : lecture seule, jamais effaçable depuis l'application. */
export default function Journal() {
  const st = useDemo()
  const { props } = usePage()

  return (
    <Coque espace={espaceDesRoles(props.user?.roles)} titre="Journal d’activité">
      <div className="flex max-w-[880px] flex-col gap-3">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-leg text-encre-3">
            <Icone nom="lock" className="mr-1.5" />
            Journal non modifiable
          </span>
          <button
            type="button"
            onClick={() => notifier('Journal exporté (Excel)')}
            className="h-[38px] rounded-champ border border-bordure-champ bg-white px-3 text-meta font-semibold text-encre-2"
          >
            <Icone nom="reg-file-excel" className="mr-1.5" />
            Exporter
          </button>
        </div>
        <ol className="overflow-hidden rounded-carte border border-bordure bg-white">
          {st.journal.map((l, i) => (
            <li
              key={`${l.date}-${i}`}
              className="flex gap-3 border-b border-separateur px-4 py-3.5"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-champ bg-accent-doux text-accent">
                <Icone nom={icone(l.action)} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="text-corps font-bold">{l.action}</span>
                <span className="text-meta text-encre-2">{l.objet}</span>
                {(l.avant || l.apres) && (
                  <span className="text-leg text-encre-3">
                    {l.avant} → <strong className="text-encre">{l.apres}</strong>
                  </span>
                )}
                <span className="text-leg text-encre-4">
                  {l.auteur} · {l.date}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Coque>
  )
}

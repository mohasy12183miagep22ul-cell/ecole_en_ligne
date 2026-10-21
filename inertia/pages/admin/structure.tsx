import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import { COEFS_INITIAUX, MATIERES, NIVEAUX } from '~/demo/donnees'
import { journaliser, modifier, useDemo } from '~/demo/store'
import { usePage } from '@inertiajs/react'

const COLONNES = 'grid-cols-[minmax(0,1fr)_repeat(4,52px)]'

export default function Structure() {
  const st = useDemo()
  const { props } = usePage()

  return (
    <Coque espace="admin" titre="Niveaux, matières et coefficients">
      <div className="flex max-w-[880px] flex-col gap-3">
        <div className="flex gap-2.5 rounded-bouton bg-info-fond px-3.5 py-3 text-meta leading-[1.45] text-info-fort">
          <Icone nom="circle-info" className="mt-0.5" />
          Le coefficient appartient au couple niveau + matière, jamais à la matière seule.
        </div>
        <div className="overflow-hidden rounded-carte border border-bordure bg-white">
          <div
            className={`grid items-center gap-1.5 bg-entete px-3.5 py-3 text-leg font-bold text-encre-3 ${COLONNES}`}
          >
            <span>Matière</span>
            {NIVEAUX.map((n) => (
              <span key={n} className="text-center">
                {n}
              </span>
            ))}
          </div>
          {MATIERES.map((m) => (
            <div
              key={m.code}
              className={`grid items-center gap-1.5 border-t border-separateur px-3.5 py-2 ${COLONNES}`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Icone nom={m.icone} className="w-[18px] text-accent" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-corps font-semibold">{m.nom}</span>
                  <span className="text-micro text-encre-3">
                    {m.code} · {m.famille}
                  </span>
                </span>
              </div>
              {st.coefs[m.code].map((c, j) => (
                <input
                  key={NIVEAUX[j]}
                  inputMode="numeric"
                  aria-label={`Coefficient ${m.nom} en ${NIVEAUX[j]}`}
                  value={String(c)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 1)
                    modifier((s) => {
                      const a = s.coefs[m.code].slice()
                      a[j] = v === '' ? '' : Number(v)
                      return { coefs: { ...s.coefs, [m.code]: a } }
                    })
                  }}
                  onBlur={() =>
                    journaliser(
                      props.user?.fullName ?? '',
                      'Coefficient modifié',
                      `${m.nom} · ${NIVEAUX[j]}`,
                      String(COEFS_INITIAUX[m.code][j]),
                      String(st.coefs[m.code][j])
                    )
                  }
                  className="h-[38px] w-full rounded-[9px] border border-bordure-champ bg-champ text-center text-moyen font-bold outline-none focus:border-accent focus:bg-white"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Coque>
  )
}

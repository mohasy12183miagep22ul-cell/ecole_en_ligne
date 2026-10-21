import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import { router } from '@inertiajs/react'
import { modifier, useDemo } from '~/demo/store'
import { statsEval } from '~/demo/calculs'
import { inscrits } from '~/demo/donnees'

const CLASSES: Array<[string, boolean]> = [
  ['3e A', true],
  ['3e B', false],
  ['4e A', false],
]

export default function MesClasses() {
  const st = useDemo()
  const miennes = st.evals.filter((e) => e.mine)

  return (
    <Coque espace="enseignant" titre="Mes classes">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-[14px] bg-succes-fond px-4 py-3.5 text-meta font-medium text-succes">
          <Icone nom="door-open" />
          Saisie du 1er trimestre ouverte jusqu’au 15/12/2026
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">
          {CLASSES.map(([c, pp]) => {
            const effectif = inscrits(c).length
            const evs = miennes.filter((e) => e.classe === c)
            const brouillon = evs.find((e) => e.etat === 'brouillon')
            const sd = brouillon ? statsEval(st, brouillon) : null
            const fait = sd ? sd.notes + sd.abs : 0
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  modifier(() => ({ filtreClasse: c }))
                  router.visit('/enseignant/evaluations')
                }}
                className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-[18px] text-left transition hover:border-accent"
              >
                <div className="flex w-full items-center gap-3">
                  <div className="flex size-[46px] items-center justify-center rounded-bouton bg-accent-doux text-moyen font-extrabold text-accent">
                    {c}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-titre-carte font-bold text-encre">Classe de {c}</span>
                    <span className="text-leg text-encre-3">
                      Mathématiques · {effectif} élèves · {evs.length} évaluations
                    </span>
                  </div>
                  <Icone nom="chevron-right" className="text-encre-4" />
                </div>
                {pp && (
                  <span className="self-start rounded-full bg-neutre px-2.5 py-[5px] text-leg font-semibold text-encre-2">
                    <Icone nom="star" className="mr-1.5 text-accent" />
                    Professeur principal
                  </span>
                )}
                {brouillon && sd && (
                  <div className="flex w-full flex-col gap-1.5">
                    <div className="flex justify-between text-leg text-encre-2">
                      <span>{brouillon.titre}</span>
                      <span className="font-bold">
                        {fait}/{sd.total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-[3px] bg-neutre">
                      <div
                        className="h-full rounded-[3px] bg-accent"
                        style={{ width: `${((fait / sd.total) * 100).toFixed(0)}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </Coque>
  )
}

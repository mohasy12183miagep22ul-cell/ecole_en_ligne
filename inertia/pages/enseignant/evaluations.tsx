import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import PastilleEval from '~/components/ui/pastille_eval'
import { cx, fmt } from '~/lib/format'
import { modifier, useDemo } from '~/demo/store'
import { statsEval } from '~/demo/calculs'
import { ICONE_TYPE } from '~/demo/donnees'
import { Link } from '@adonisjs/inertia/react'

const FILTRES = ['Toutes', '3e A', '3e B', '4e A']

export default function MesEvaluations() {
  const st = useDemo()
  const liste = st.evals.filter(
    (e) => e.mine && (st.filtreClasse === 'Toutes' || e.classe === st.filtreClasse)
  )

  return (
    <Coque
      espace="enseignant"
      titre="Mes évaluations"
      action={{ href: '/enseignant/evaluations/nouvelle', libelle: 'Nouvelle évaluation' }}
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="group"
            aria-label="Classe"
            className="scroll-masque flex min-w-0 flex-1 gap-2 overflow-x-auto"
          >
            {FILTRES.map((c) => {
              const on = st.filtreClasse === c
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => modifier(() => ({ filtreClasse: c }))}
                  className={cx(
                    'h-9 shrink-0 rounded-champ border px-3.5 text-meta font-semibold',
                    on
                      ? 'border-accent bg-accent text-white'
                      : 'border-bordure-champ bg-white text-encre-2'
                  )}
                >
                  {c}
                </button>
              )
            })}
          </div>
          <Link
            route="enseignant.nouvelle_evaluation"
            className="hidden h-[42px] items-center gap-2 rounded-champ border border-accent bg-white px-4 text-corps font-bold text-accent hover:no-underline lg:flex"
          >
            <Icone nom="plus" />
            Nouvelle évaluation
          </Link>
        </div>

        {liste.map((e) => {
          const s = statsEval(st, e)
          const fait = s.notes + s.abs
          return (
            <Link
              key={e.id}
              route="enseignant.grille"
              routeParams={{ id: e.id }}
              className="flex w-full flex-col gap-3 rounded-carte border border-bordure bg-white p-4 text-left transition hover:border-accent hover:no-underline"
            >
              <div className="flex w-full items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-champ bg-accent-doux text-accent">
                  <Icone nom={ICONE_TYPE[e.type]} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="text-moyen font-bold text-encre">{e.titre}</span>
                  <span className="text-leg text-encre-3">
                    {e.classe} · {e.date} · sur {e.max} · poids {e.poids}
                  </span>
                </div>
                <PastilleEval etat={e.etat} />
              </div>
              <div className="flex w-full items-center gap-3">
                <div className="h-1.5 flex-1 rounded-[3px] bg-neutre">
                  <div
                    className="h-full rounded-[3px] bg-accent"
                    style={{ width: `${((fait / s.total) * 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="text-leg font-semibold text-encre-2">
                  {fait}/{s.total} notés
                </span>
                <span className="text-leg text-encre-3">
                  Moy. {fmt(s.moyenne === null ? null : (s.moyenne * 20) / e.max)}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </Coque>
  )
}

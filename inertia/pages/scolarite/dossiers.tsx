import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import EtatVide from '~/components/ui/etat_vide'
import { cx } from '~/lib/format'
import { TOUS } from '~/demo/donnees'
import { estIncomplet } from '~/demo/scolarite'
import { useDemo } from '~/demo/store'
import { Link } from '@adonisjs/inertia/react'

export default function DossiersIncomplets() {
  const st = useDemo()
  const liste = TOUS.filter((s) => estIncomplet(st, s))

  return (
    <Coque espace="scolarite" titre="Dossiers à compléter">
      <div className="flex max-w-[880px] flex-col gap-3">
        <div className="flex gap-2.5 rounded-bouton bg-attention-fond px-3.5 py-3 text-meta leading-[1.45] text-attention">
          <Icone nom="triangle-exclamation" className="mt-0.5" />
          <span>
            {liste.length} dossiers soumis avec des pièces manquantes : ils ne peuvent pas être
            validés tant qu’elles ne sont pas fournies.
          </span>
        </div>
        {liste.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-3 rounded-carte border border-bordure bg-white px-4 py-3.5"
          >
            <span
              className={cx(
                'flex size-[38px] items-center justify-center rounded-full text-leg font-bold',
                s.avatar
              )}
            >
              {s.initiales}
            </span>
            <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
              <span className="text-corps font-bold">
                {s.nomU} {s.prenom}{' '}
                <span className="text-leg font-medium text-encre-3">
                  · {s.classe} · {s.matricule}
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {s.manquantes.map((m) => (
                  <span
                    key={m}
                    className="rounded-[8px] bg-erreur-fond px-2 py-1 text-leg font-semibold text-erreur"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <Link
              route="scolarite.fiche"
              routeParams={{ id: s.id }}
              qs={{ onglet: 'docs' }}
              className="flex h-10 items-center rounded-champ border border-accent bg-white px-3.5 text-meta font-bold text-accent hover:no-underline"
            >
              Compléter
            </Link>
          </div>
        ))}
        {liste.length === 0 && (
          <EtatVide
            illustration="coches"
            dimensions={[160, 120]}
            titre="Tous les dossiers sont complets"
          />
        )}
      </div>
    </Coque>
  )
}

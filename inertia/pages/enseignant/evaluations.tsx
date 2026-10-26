import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import EtatVide from '~/components/ui/etat_vide'
import PastilleEval from '~/components/ui/pastille_eval'
import { cx, fmt } from '~/lib/format'
import { ICONE_TYPE, sur20, type EvaluationListe } from '~/lib/notes'
import { Link } from '@adonisjs/inertia/react'

export default function MesEvaluations({
  annee,
  affectations,
  filtre,
  evaluations,
}: {
  annee: { id: number; libelle: string } | null
  affectations: Array<{ id: number; libelle: string }>
  filtre: number | null
  evaluations: EvaluationListe[]
}) {
  const filtres = [{ id: null as number | null, libelle: 'Toutes' }, ...affectations]

  return (
    <Coque
      espace="enseignant"
      titre="Mes évaluations"
      action={
        affectations.length
          ? { href: '/enseignant/evaluations/nouvelle', libelle: 'Nouvelle évaluation' }
          : undefined
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="group"
            aria-label="Classe"
            className="scroll-masque flex min-w-0 flex-1 gap-2 overflow-x-auto"
          >
            {filtres.map((f) => {
              const on = filtre === f.id
              return (
                <Link
                  key={f.id ?? 'toutes'}
                  route="enseignant.evaluations"
                  qs={f.id ? { affectation: f.id } : {}}
                  aria-current={on ? 'true' : undefined}
                  className={cx(
                    'flex h-9 shrink-0 items-center rounded-champ border px-3.5 text-meta font-semibold hover:no-underline',
                    on
                      ? 'border-accent bg-accent text-white'
                      : 'border-bordure-champ bg-white text-encre-2'
                  )}
                >
                  {f.libelle}
                </Link>
              )
            })}
          </div>
          {affectations.length > 0 && (
            <Link
              route="enseignant.nouvelle_evaluation"
              qs={filtre ? { affectation: filtre } : {}}
              className="hidden h-[42px] items-center gap-2 rounded-champ border border-accent bg-white px-4 text-corps font-bold text-accent hover:no-underline lg:flex"
            >
              <Icone nom="plus" />
              Nouvelle évaluation
            </Link>
          )}
        </div>

        {evaluations.length === 0 && (
          <EtatVide
            icone="clipboard-list"
            titre="Aucune évaluation"
            texte={
              annee
                ? affectations.length
                  ? 'Créez une évaluation pour commencer la saisie des notes.'
                  : 'Vous n’avez pas encore de classe confiée cette année.'
                : 'Aucune année scolaire active.'
            }
          />
        )}

        {evaluations.map((e) => {
          const s = e.statistiques
          const fait = s.notes + s.absents
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
                    {e.classe} · {e.matiere} · {e.date} · sur {e.noteMax} · poids {e.poids} ·{' '}
                    {e.periode}
                  </span>
                </div>
                <PastilleEval etat={e.etat} />
              </div>
              {e.etat === 'brouillon' && e.motifRetour && (
                <span className="text-leg text-attention">
                  <Icone nom="triangle-exclamation" className="mr-1.5" />
                  Renvoyée par la direction : {e.motifRetour}
                </span>
              )}
              <div className="flex w-full items-center gap-3">
                <div className="h-1.5 flex-1 rounded-[3px] bg-neutre">
                  <div
                    className="h-full rounded-[3px] bg-accent"
                    style={{ width: `${s.effectif ? ((fait / s.effectif) * 100).toFixed(0) : 0}%` }}
                  />
                </div>
                <span className="text-leg font-semibold text-encre-2">
                  {fait}/{s.effectif} notés
                </span>
                <span className="text-leg text-encre-3">
                  Moy. {fmt(sur20(s.moyenne, e.noteMax))}/20
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </Coque>
  )
}

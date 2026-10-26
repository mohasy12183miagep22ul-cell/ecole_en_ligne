import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import EtatVide from '~/components/ui/etat_vide'
import PastilleEval from '~/components/ui/pastille_eval'
import Pagination, { type InfosPagination } from '~/components/ui/pagination'
import { useFeuille } from '~/components/ui/feuille'
import { cx, fmt, fmtv } from '~/lib/format'
import { ICONE_TYPE, sur20, type EvaluationListe } from '~/lib/notes'
import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'

export default function Validation({
  onglet,
  compteurs,
  evaluations,
  pagination,
}: {
  onglet: 'a_valider' | 'validees'
  compteurs: { aValider: number; validees: number }
  evaluations: EvaluationListe[]
  pagination: InfosPagination
}) {
  const [feuille, ouvrir] = useFeuille()

  const infos = (e: EvaluationListe) => {
    const s = e.statistiques
    return {
      meta: `${e.matiere} · ${e.classe} · ${e.enseignant}`,
      stats: `Moy. ${fmt(sur20(s.moyenne, e.noteMax))}/20 · ${s.notes}/${s.effectif} notés${s.absents ? ` · ${s.absents} abs.` : ''}`,
    }
  }

  const examiner = (e: EvaluationListe) => {
    const s = e.statistiques
    ouvrir({
      titre: `Valider « ${e.titre} » ?`,
      texte:
        'Après validation, l’enseignant ne pourra plus modifier les notes. Le déverrouillage reste possible et sera journalisé.',
      lignes: [
        ['Classe · matière', `${e.classe} · ${e.matiere}`],
        ['Enseignant', e.enseignant],
        ['Période', e.periode],
        ['Notés', `${s.notes} / ${s.effectif}`],
        ['Absents', String(s.absents)],
        ['Sans note', String(s.reste)],
        [
          'Moyenne · min · max',
          `${fmt(s.moyenne)} · ${fmt(s.min)} · ${fmt(s.max)} (/${fmtv(e.noteMax)})`,
        ],
      ],
      libelleConfirmer: 'Valider',
      onConfirmer: () =>
        router.post(`/direction/evaluations/${e.id}/valider`, {}, { preserveScroll: true }),
    })
  }

  const renvoyer = (e: EvaluationListe) =>
    ouvrir({
      titre: 'Renvoyer à l’enseignant ?',
      texte:
        'L’évaluation repasse en brouillon : l’enseignant corrige puis soumet de nouveau. Le motif lui est affiché.',
      motif: true,
      libelleConfirmer: 'Renvoyer',
      onConfirmer: (motif) =>
        router.post(`/direction/evaluations/${e.id}/renvoyer`, { motif }, { preserveScroll: true }),
    })

  const deverrouiller = (e: EvaluationListe) =>
    ouvrir({
      titre: 'Déverrouiller l’évaluation ?',
      texte:
        'L’évaluation repasse en brouillon : l’enseignant pourra de nouveau modifier les notes. Cette action est journalisée avec son motif (RG12).',
      motif: true,
      danger: true,
      libelleConfirmer: 'Déverrouiller',
      onConfirmer: (motif) =>
        router.post(
          `/direction/evaluations/${e.id}/deverrouiller`,
          { motif },
          { preserveScroll: true }
        ),
    })

  const onglets = [
    { id: 'a_valider', libelle: 'À valider', compteur: compteurs.aValider },
    { id: 'validees', libelle: 'Validées', compteur: compteurs.validees },
  ] as const

  return (
    <Coque espace="direction" titre="Validation des évaluations">
      <div className="flex max-w-[880px] flex-col gap-3">
        <div role="tablist" aria-label="Évaluations" className="flex gap-1 border-b border-bordure">
          {onglets.map((o) => (
            <Link
              key={o.id}
              role="tab"
              aria-selected={onglet === o.id}
              route="direction.validation"
              qs={o.id === 'validees' ? { onglet: 'validees' } : {}}
              className={cx(
                '-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-corps font-semibold hover:no-underline',
                onglet === o.id ? 'border-accent text-accent' : 'border-transparent text-encre-3'
              )}
            >
              {o.libelle}
              <span className="rounded-full bg-neutre px-2 py-0.5 text-micro font-bold text-encre-2">
                {o.compteur}
              </span>
            </Link>
          ))}
        </div>

        {evaluations.length === 0 && (
          <EtatVide
            illustration="coches"
            dimensions={[170, 130]}
            titre={
              onglet === 'a_valider' ? 'Aucune évaluation à valider' : 'Aucune évaluation validée'
            }
          />
        )}

        {onglet === 'a_valider' &&
          evaluations.map((e) => {
            const i = infos(e)
            return (
              <div
                key={e.id}
                className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-champ bg-accent-doux text-accent">
                    <Icone nom={ICONE_TYPE[e.type]} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="text-moyen font-bold">{e.titre}</span>
                    <span className="text-leg text-encre-3">
                      {i.meta} · {e.date} · {e.periode}
                    </span>
                    <span className="text-leg font-semibold text-encre-2">{i.stats}</span>
                    {e.statistiques.reste > 0 && (
                      <span className="text-leg font-semibold text-attention">
                        {e.statistiques.reste} élève{e.statistiques.reste > 1 ? 's' : ''} sans note
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => renvoyer(e)}
                    className="h-[42px] rounded-champ border border-bordure-champ bg-white px-4 text-corps font-semibold text-encre-2"
                  >
                    Renvoyer
                  </button>
                  <button
                    type="button"
                    onClick={() => examiner(e)}
                    className="h-[42px] rounded-champ bg-accent px-[18px] text-corps font-bold text-white"
                  >
                    Examiner et valider
                  </button>
                </div>
              </div>
            )
          })}

        {onglet === 'validees' &&
          evaluations.map((e) => {
            const i = infos(e)
            return (
              <div
                key={e.id}
                className="flex flex-wrap items-center gap-3 rounded-carte border border-bordure bg-white px-4 py-3.5"
              >
                <div className="flex min-w-[200px] flex-1 flex-col gap-[3px]">
                  <span className="text-corps font-bold">{e.titre}</span>
                  <span className="text-leg text-encre-3">
                    {i.meta} · {e.periode} · {i.stats}
                  </span>
                </div>
                <PastilleEval etat={e.etat} />
                <button
                  type="button"
                  onClick={() => deverrouiller(e)}
                  className="h-[38px] rounded-champ border border-bordure-champ bg-white px-3 text-meta font-semibold text-encre-2"
                >
                  <Icone nom="unlock" className="mr-1.5" />
                  Déverrouiller
                </button>
              </div>
            )
          })}

        <Pagination
          pagination={pagination}
          aller={(page) =>
            router.get(
              '/direction/validation',
              { page, ...(onglet === 'validees' ? { onglet } : {}) },
              { preserveScroll: true }
            )
          }
        />
      </div>
      {feuille}
    </Coque>
  )
}

import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Onglets from '~/components/ui/onglets'
import EtatVide from '~/components/ui/etat_vide'
import PastilleEval from '~/components/ui/pastille_eval'
import { notifier } from '~/components/ui/toast'
import { useFeuille } from '~/components/ui/feuille'
import { fmt } from '~/lib/format'
import { statsEval } from '~/demo/calculs'
import { changerEtatEval, journaliser, useDemo } from '~/demo/store'
import { ICONE_TYPE, NOM_MATIERE_COURT, type Evaluation } from '~/demo/donnees'
import { usePage } from '@inertiajs/react'
import { useState } from 'react'

export default function Validation() {
  const st = useDemo()
  const { props } = usePage()
  const auteur = props.user?.fullName ?? ''
  const [onglet, setOnglet] = useState<'todo' | 'done'>('todo')
  const [feuille, ouvrir] = useFeuille()
  const aValider = st.evals.filter((e) => e.etat === 'soumise')
  const validees = st.evals.filter((e) => e.etat === 'validée')

  const infos = (e: Evaluation) => {
    const s = statsEval(st, e)
    return {
      s,
      meta: `${NOM_MATIERE_COURT[e.matiere]} · ${e.classe} · ${e.enseignant}`,
      stats: `Moy. ${fmt(s.moyenne === null ? null : (s.moyenne * 20) / e.max)}/20 · ${s.notes}/${s.total} notés${s.abs ? ` · ${s.abs} abs.` : ''}`,
    }
  }

  const examiner = (e: Evaluation) => {
    const { s } = infos(e)
    ouvrir({
      titre: `Valider « ${e.titre} » ?`,
      texte:
        'Après validation, l’enseignant ne pourra plus modifier les notes. Le déverrouillage reste possible et sera journalisé.',
      lignes: [
        ['Classe · matière', `${e.classe} · ${NOM_MATIERE_COURT[e.matiere]}`],
        ['Enseignant', e.enseignant],
        ['Notés', `${s.notes} / ${s.total}`],
        ['Absents', String(s.abs)],
        ['Sans note', String(s.reste)],
        ['Moyenne · min · max', `${fmt(s.moyenne)} · ${fmt(s.min)} · ${fmt(s.max)} (/${e.max})`],
      ],
      libelleConfirmer: 'Valider',
      onConfirmer: () => {
        changerEtatEval(e.id, 'validée')
        journaliser(
          auteur,
          'Validation',
          `${e.titre} · ${NOM_MATIERE_COURT[e.matiere]} · ${e.classe}`,
          'Soumise',
          'Validée'
        )
        notifier('Évaluation validée')
      },
    })
  }

  const deverrouiller = (e: Evaluation) =>
    ouvrir({
      titre: 'Déverrouiller l’évaluation ?',
      texte:
        'L’évaluation repasse en brouillon : l’enseignant pourra de nouveau modifier les notes. Cette action est journalisée avec son motif.',
      motif: true,
      danger: true,
      libelleConfirmer: 'Déverrouiller',
      onConfirmer: (m) => {
        changerEtatEval(e.id, 'brouillon')
        journaliser(
          auteur,
          'Déverrouillage',
          `${e.titre} · ${e.classe} — motif : ${m}`,
          'Validée',
          'Brouillon'
        )
        notifier('Évaluation déverrouillée')
      },
    })

  return (
    <Coque espace="direction" titre="Validation des évaluations">
      <div className="flex max-w-[880px] flex-col gap-3">
        <Onglets
          aria-label="Évaluations"
          actif={onglet}
          onChange={setOnglet}
          onglets={[
            { id: 'todo', libelle: 'À valider', compteur: aValider.length },
            { id: 'done', libelle: 'Validées', compteur: validees.length },
          ]}
        />
        {onglet === 'todo' && aValider.length === 0 && (
          <EtatVide
            illustration="coches"
            dimensions={[170, 130]}
            titre="Aucune évaluation à valider"
          />
        )}
        {onglet === 'todo' &&
          aValider.map((e) => {
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
                      {i.meta} · {e.date}
                    </span>
                    <span className="text-leg font-semibold text-encre-2">{i.stats}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2.5">
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
        {onglet === 'done' &&
          validees.map((e) => {
            const i = infos(e)
            return (
              <div
                key={e.id}
                className="flex flex-wrap items-center gap-3 rounded-carte border border-bordure bg-white px-4 py-3.5"
              >
                <div className="flex min-w-[200px] flex-1 flex-col gap-[3px]">
                  <span className="text-corps font-bold">{e.titre}</span>
                  <span className="text-leg text-encre-3">
                    {i.meta} · {i.stats}
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
      </div>
      {feuille}
    </Coque>
  )
}

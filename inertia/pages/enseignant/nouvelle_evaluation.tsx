import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import { notifier } from '~/components/ui/toast'
import { cx, num } from '~/lib/format'
import { ajouterEval, journaliser } from '~/demo/store'
import { TYPES } from '~/demo/donnees'
import { router, usePage } from '@inertiajs/react'
import { useState, type ReactNode } from 'react'

const champ =
  'h-12 rounded-bouton border border-bordure-champ bg-champ px-3.5 text-moyen text-encre outline-none focus:border-accent focus:bg-white'

type Erreurs = Partial<Record<'titre' | 'date' | 'max' | 'poids', string>>

function Erreur({ children }: { children?: ReactNode }) {
  return children ? (
    <span role="alert" className="text-leg text-erreur">
      {children}
    </span>
  ) : null
}

export default function NouvelleEvaluation() {
  const { props } = usePage()
  const [f, setF] = useState({
    classe: '3e A',
    type: 'Devoir surveillé',
    titre: '',
    date: '2026-10-23',
    max: '20',
    poids: '1',
  })
  const [err, setErr] = useState<Erreurs>({})
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    setF({ ...f, [k]: e.target.value })
    setErr({ ...err, [k]: undefined })
  }

  const creer = () => {
    const e: Erreurs = {}
    if (f.titre.trim().length < 3) e.titre = 'Le titre est obligatoire (3 caractères minimum).'
    if (!f.date) e.date = 'Choisissez la date de l’évaluation.'
    const max = num(f.max)
    if (max === null || max < 1 || max > 100 || !Number.isInteger(max))
      e.max = 'Entier entre 1 et 100.'
    const poids = num(f.poids)
    if (poids === null || poids <= 0) e.poids = 'Le poids doit être strictement positif.'
    if (Object.keys(e).length) return setErr(e)

    const id = `n${Date.now()}`
    ajouterEval({
      id,
      classe: f.classe,
      matiere: 'MA',
      titre: f.titre.trim(),
      type: f.type,
      date: f.date.split('-').reverse().join('/'),
      max: max!,
      poids: poids!,
      etat: 'brouillon',
      mine: true,
      enseignant: 'I. Sow',
    })
    journaliser(
      props.user?.fullName ?? '',
      'Création d’évaluation',
      `${f.titre.trim()} · ${f.classe}`,
      '',
      'Brouillon'
    )
    notifier('Évaluation créée — saisissez les notes')
    router.visit(`/enseignant/evaluations/${id}`)
  }

  return (
    <Coque
      espace="enseignant"
      titre="Nouvelle évaluation"
      retour={{ href: '/enseignant/evaluations', libelle: 'Mes évaluations' }}
    >
      <div className="flex max-w-[640px] flex-col gap-[18px] rounded-carte border border-bordure bg-white p-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-meta font-semibold">Classe et matière</span>
          <select value={f.classe} onChange={maj('classe')} className={cx(champ, 'px-3')}>
            <option value="3e A">3e A — Mathématiques</option>
            <option value="3e B">3e B — Mathématiques</option>
            <option value="4e A">4e A — Mathématiques</option>
          </select>
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-meta font-semibold">Période</span>
          <div className="flex h-12 items-center justify-between rounded-bouton bg-neutre px-3.5 text-corps">
            <span>1er trimestre 2026-2027</span>
            <span className="text-leg font-semibold text-succes">Saisie ouverte</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-meta font-semibold">Type d’évaluation</span>
          <div role="group" aria-label="Type d’évaluation" className="flex flex-wrap gap-2">
            {TYPES.map(([t, ic]) => {
              const on = f.type === t
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setF({ ...f, type: t })}
                  className={cx(
                    'flex h-10 items-center gap-2 rounded-champ border px-3 text-meta font-semibold',
                    on
                      ? 'border-accent bg-accent-doux text-accent'
                      : 'border-bordure-champ bg-white text-encre-2'
                  )}
                >
                  <Icone nom={ic} />
                  {t}
                </button>
              )
            })}
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-meta font-semibold">Titre</span>
          <input
            value={f.titre}
            onChange={maj('titre')}
            placeholder="Ex. Devoir surveillé n°3"
            aria-invalid={err.titre ? true : undefined}
            className={champ}
          />
          <Erreur>{err.titre}</Erreur>
        </label>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-meta font-semibold">Date</span>
            <input
              type="date"
              value={f.date}
              onChange={maj('date')}
              className={cx(champ, 'px-3')}
            />
            <Erreur>{err.date}</Erreur>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-meta font-semibold">Note maximale</span>
            <input inputMode="numeric" value={f.max} onChange={maj('max')} className={champ} />
            <Erreur>{err.max}</Erreur>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-meta font-semibold">Poids dans la période</span>
            <input inputMode="decimal" value={f.poids} onChange={maj('poids')} className={champ} />
            <Erreur>{err.poids}</Erreur>
          </label>
        </div>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => router.visit('/enseignant/evaluations')}
            className="h-12 rounded-bouton border border-bordure-champ bg-white px-[18px] text-corps font-semibold text-encre-2"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={creer}
            className="h-12 rounded-bouton bg-accent px-[22px] text-corps font-bold text-white"
          >
            Créer et saisir les notes
          </button>
        </div>
      </div>
    </Coque>
  )
}

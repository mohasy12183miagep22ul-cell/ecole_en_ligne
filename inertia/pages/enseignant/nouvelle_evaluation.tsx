import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import EtatVide from '~/components/ui/etat_vide'
import { cx } from '~/lib/format'
import { ICONE_TYPE, type TypeEvaluation } from '~/lib/notes'
import { router, usePage } from '@inertiajs/react'
import { useState, type ReactNode } from 'react'

const champ =
  'h-12 rounded-bouton border border-bordure-champ bg-champ px-3.5 text-moyen text-encre outline-none focus:border-accent focus:bg-white'

type Periode = { id: number; libelle: string; debut: string; fin: string; ouverte: boolean }

function Erreur({ children }: { children?: ReactNode }) {
  return children ? (
    <span role="alert" className="text-leg text-erreur">
      {children}
    </span>
  ) : null
}

export default function NouvelleEvaluation({
  annee,
  affectations,
  periodes,
  periodeCourante,
  types,
  affectationChoisie,
}: {
  annee: { id: number; libelle: string } | null
  affectations: Array<{ id: number; libelle: string; noteMax: number }>
  periodes: Periode[]
  periodeCourante: number | null
  types: Array<{ cle: TypeEvaluation; libelle: string }>
  affectationChoisie: number | null
}) {
  const { props } = usePage()
  const serveur = (props.errors ?? {}) as Record<string, string | undefined>
  const premiere = affectations.find((a) => a.id === affectationChoisie) ?? affectations[0]
  const [f, setF] = useState({
    affectationId: String(premiere?.id ?? ''),
    periodeId: String(periodeCourante ?? periodes[0]?.id ?? ''),
    type: 'devoir' as TypeEvaluation,
    titre: '',
    date: new Date().toISOString().slice(0, 10),
    noteMax: String(premiere?.noteMax ?? 20),
    poids: '1',
  })
  const [envoi, setEnvoi] = useState(false)
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF({ ...f, [k]: e.target.value })
  const periode = periodes.find((p) => String(p.id) === f.periodeId)

  if (!annee || affectations.length === 0) {
    return (
      <Coque
        espace="enseignant"
        titre="Nouvelle évaluation"
        retour={{ href: '/enseignant/evaluations', libelle: 'Mes évaluations' }}
      >
        <EtatVide
          icone="clipboard-list"
          titre="Aucune classe confiée"
          texte="Une évaluation se crée sur une de vos affectations (classe et matière) de l’année active."
        />
      </Coque>
    )
  }

  const creer = () =>
    router.post(
      '/enseignant/evaluations',
      {
        affectationId: Number(f.affectationId),
        periodeId: Number(f.periodeId),
        type: f.type,
        titre: f.titre.trim(),
        date: f.date,
        noteMax: Number(f.noteMax.replace(',', '.')),
        poids: Number(f.poids.replace(',', '.')),
      },
      { onStart: () => setEnvoi(true), onFinish: () => setEnvoi(false) }
    )

  return (
    <Coque
      espace="enseignant"
      titre="Nouvelle évaluation"
      retour={{ href: '/enseignant/evaluations', libelle: 'Mes évaluations' }}
    >
      <div className="flex max-w-[640px] flex-col gap-[18px] rounded-carte border border-bordure bg-white p-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-meta font-semibold">Classe et matière</span>
          <select
            value={f.affectationId}
            onChange={(e) => {
              const a = affectations.find((x) => String(x.id) === e.target.value)
              setF({
                ...f,
                affectationId: e.target.value,
                noteMax: String(a?.noteMax ?? f.noteMax),
              })
            }}
            className={cx(champ, 'px-3')}
          >
            {affectations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-meta font-semibold">Période</span>
          <select value={f.periodeId} onChange={maj('periodeId')} className={cx(champ, 'px-3')}>
            {periodes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.libelle} {annee.libelle} · {p.ouverte ? 'saisie ouverte' : 'saisie fermée'}
              </option>
            ))}
          </select>
          {periode && (
            <span
              className={cx(
                'text-leg font-semibold',
                periode.ouverte ? 'text-succes' : 'text-attention'
              )}
            >
              {periode.ouverte
                ? `Saisie ouverte du ${periode.debut} au ${periode.fin}`
                : `Saisie fermée (fenêtre du ${periode.debut} au ${periode.fin}) : une dérogation de la direction est nécessaire (RG13).`}
            </span>
          )}
          <Erreur>{serveur.periodeId}</Erreur>
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-meta font-semibold">Type d’évaluation</span>
          <div role="group" aria-label="Type d’évaluation" className="flex flex-wrap gap-2">
            {types.map((t) => {
              const on = f.type === t.cle
              return (
                <button
                  key={t.cle}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setF({ ...f, type: t.cle })}
                  className={cx(
                    'flex h-10 items-center gap-2 rounded-champ border px-3 text-meta font-semibold',
                    on
                      ? 'border-accent bg-accent-doux text-accent'
                      : 'border-bordure-champ bg-white text-encre-2'
                  )}
                >
                  <Icone nom={ICONE_TYPE[t.cle]} />
                  {t.libelle}
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
            aria-invalid={serveur.titre ? true : undefined}
            className={champ}
          />
          <Erreur>{serveur.titre && 'Le titre est obligatoire (3 caractères minimum).'}</Erreur>
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
            <Erreur>{serveur.date && 'Choisissez la date de l’évaluation.'}</Erreur>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-meta font-semibold">Note maximale</span>
            <input
              inputMode="decimal"
              value={f.noteMax}
              onChange={maj('noteMax')}
              className={champ}
            />
            <Erreur>{serveur.noteMax && 'Nombre entre 1 et 100.'}</Erreur>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-meta font-semibold">Poids dans la période</span>
            <input inputMode="decimal" value={f.poids} onChange={maj('poids')} className={champ} />
            <Erreur>{serveur.poids && 'Le poids doit être strictement positif.'}</Erreur>
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
            disabled={envoi}
            onClick={creer}
            className="h-12 rounded-bouton bg-accent px-[22px] text-corps font-bold text-white disabled:opacity-60"
          >
            Créer et saisir les notes
          </button>
        </div>
      </div>
    </Coque>
  )
}

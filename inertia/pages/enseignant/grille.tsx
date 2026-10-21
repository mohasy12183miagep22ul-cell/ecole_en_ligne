import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import PastilleEval from '~/components/ui/pastille_eval'
import EtatVide from '~/components/ui/etat_vide'
import { notifier } from '~/components/ui/toast'
import { useFeuille } from '~/components/ui/feuille'
import { cx, fmt, fmtv, num } from '~/lib/format'
import { statsEval } from '~/demo/calculs'
import { clamp, half, inscrits, rnd, type Cellule } from '~/demo/donnees'
import {
  ajouterEnAttente,
  changerEtatEval,
  journaliser,
  marquerEnregistre,
  modifierCellule,
  remplacerGrille,
  useDemo,
} from '~/demo/store'
import { usePage } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'

const VIDE: Cellule = { v: '', abs: false, obs: '' }
const COLONNES = 'grid-cols-[28px_minmax(0,1fr)_72px_44px_40px]'

/** Hors ligne réel (navigateur) ou simulé (bouton du prototype). */
function useEnLigne() {
  const [reseau, setReseau] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  )
  useEffect(() => {
    const on = () => setReseau(true)
    const off = () => setReseau(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return reseau
}

export default function GrilleDeSaisie({ id }: { id: string }) {
  const st = useDemo()
  const { props } = usePage()
  const auteur = props.user?.fullName ?? ''
  const ev = st.evals.find((e) => e.id === id && e.mine)
  const [enregistrement, setEnregistrement] = useState<'saved' | 'saving'>('saved')
  const [simuleHorsLigne, setSimuleHorsLigne] = useState(false)
  const reseau = useEnLigne()
  const horsLigne = simuleHorsLigne || !reseau
  const [erreurs, setErreurs] = useState<Record<string, string | null>>({})
  const [obsOuverte, setObsOuverte] = useState<string | null>(null)
  const minuteries = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const [feuille, ouvrir] = useFeuille()

  // Retour du réseau : les modifications conservées repartent vers le serveur.
  const precedent = useRef(horsLigne)
  useEffect(() => {
    if (precedent.current && !horsLigne) {
      const n = st.pending
      setEnregistrement('saving')
      const t = setTimeout(() => {
        setEnregistrement('saved')
        marquerEnregistre()
      }, 700)
      if (n) notifier(`${n} modification${n > 1 ? 's' : ''} renvoyée${n > 1 ? 's' : ''} au serveur`)
      precedent.current = horsLigne
      return () => clearTimeout(t)
    }
    precedent.current = horsLigne
  }, [horsLigne, st.pending])

  if (!ev) {
    return (
      <Coque
        espace="enseignant"
        titre="Saisie des notes"
        retour={{ href: '/enseignant/evaluations', libelle: 'Mes évaluations' }}
      >
        <EtatVide
          illustration="vide"
          titre="Évaluation introuvable"
          texte="Elle n’existe pas ou ne fait pas partie de vos affectations."
        />
      </Coque>
    )
  }

  const g = st.grids[ev.id] ?? {}
  const eleves = inscrits(ev.classe)
  const modifiable = ev.etat === 'brouillon'
  const s = statsEval(st, ev)

  const enregistrer = () => {
    if (horsLigne) {
      ajouterEnAttente()
      return
    }
    setEnregistrement('saving')
    clearTimeout(minuteries.current.save)
    minuteries.current.save = setTimeout(() => {
      setEnregistrement('saved')
      marquerEnregistre()
    }, 650)
  }

  const signaler = (eleveId: string, msg: string) => {
    setErreurs((e) => ({ ...e, [eleveId]: msg }))
    clearTimeout(minuteries.current[eleveId])
    minuteries.current[eleveId] = setTimeout(
      () => setErreurs((e) => ({ ...e, [eleveId]: null })),
      2600
    )
  }

  const saisir = (eleveId: string, brut: string) => {
    if (!modifiable) return
    const t = brut.trim().replace('.', ',')
    if (t !== '') {
      if (!/^\d{0,3}(,\d{0,2})?$/.test(t)) return signaler(eleveId, 'Saisissez un nombre, ex. 12,5')
      const n = num(t)
      if (n !== null && (n < 0 || n > ev.max))
        return signaler(eleveId, `Note refusée : elle doit être comprise entre 0 et ${ev.max}`)
    }
    modifierCellule(ev.id, eleveId, { v: t })
    setErreurs((e) => ({ ...e, [eleveId]: null }))
    enregistrer()
  }

  const focaliser = (depart: number, sens: 1 | -1) => {
    for (let i = depart; i >= 0 && i < eleves.length; i += sens) {
      const el = document.querySelector<HTMLInputElement>(`[data-ligne="${i}"]`)
      if (el && !el.disabled) {
        el.focus()
        el.select()
        return
      }
    }
  }

  const remplirDemo = () => {
    const gg = { ...g }
    eleves.forEach((x, i) => {
      const c = gg[x.id] ?? VIDE
      if (c.v === '' && !c.abs)
        gg[x.id] = {
          ...c,
          v: fmtv(
            half(clamp((x.base * ev.max) / 20 + (rnd(i * 13 + 7) - 0.5) * ev.max * 0.3, 0, ev.max))
          ),
        }
    })
    remplacerGrille(ev.id, gg)
    enregistrer()
  }

  const soumettre = () =>
    ouvrir({
      titre: 'Soumettre les notes à la direction ?',
      texte:
        'Après soumission, la saisie est fermée. Une fois validée par la direction, l’évaluation ne sera plus modifiable.',
      lignes: [
        ['Évaluation', `${ev.titre} · ${ev.classe}`],
        ['Notés', `${s.notes} / ${s.total}`],
        ['Absents', String(s.abs)],
        ['Sans note', String(s.reste)],
        ['Moyenne', `${fmt(s.moyenne)} / ${ev.max}`],
      ],
      libelleConfirmer: 'Soumettre',
      onConfirmer: () => {
        changerEtatEval(ev.id, 'soumise')
        journaliser(auteur, 'Soumission', `${ev.titre} · ${ev.classe}`, 'Brouillon', 'Soumise')
        notifier('Notes soumises à la direction')
      },
    })

  const etatSauvegarde = horsLigne
    ? {
        c: 'bg-attention-fond text-attention',
        i: 'cloud' as const,
        t: `${st.pending} modification${st.pending > 1 ? 's' : ''} conservée${st.pending > 1 ? 's' : ''} sur l’appareil`,
        tourne: false,
      }
    : enregistrement === 'saving'
      ? { c: 'bg-info-fond text-info', i: 'spinner' as const, t: 'Enregistrement…', tourne: true }
      : {
          c: 'bg-succes-fond text-succes',
          i: 'circle-check' as const,
          t: `Enregistré à ${st.savedAt}`,
          tourne: false,
        }

  return (
    <Coque
      espace="enseignant"
      titre="Saisie des notes"
      retour={{ href: '/enseignant/evaluations', libelle: 'Mes évaluations' }}
    >
      <div className="flex max-w-[820px] flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-1 flex-col gap-[3px]">
              <span className="text-section font-extrabold">{ev.titre}</span>
              <span className="text-leg text-encre-3">
                {ev.classe} · Mathématiques · {ev.date} · sur {ev.max} · poids {ev.poids}
              </span>
            </div>
            <PastilleEval etat={ev.etat} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cx(
                'rounded-[8px] px-2.5 py-1.5 text-leg font-bold',
                s.reste === 0 ? 'bg-succes-fond text-succes' : 'bg-attention-fond text-attention'
              )}
            >
              {s.reste === 0
                ? 'Tous les élèves sont notés'
                : `${s.reste} ${s.reste > 1 ? 'élèves restent à noter' : 'élève reste à noter'}`}
            </span>
            {modifiable && (
              <>
                <span
                  role="status"
                  className={cx(
                    'flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-leg font-semibold',
                    etatSauvegarde.c
                  )}
                >
                  <Icone nom={etatSauvegarde.i} tourne={etatSauvegarde.tourne} />
                  {etatSauvegarde.t}
                </span>
                <button
                  type="button"
                  title="Simuler une coupure réseau"
                  aria-pressed={simuleHorsLigne}
                  onClick={() => {
                    if (!simuleHorsLigne)
                      notifier('Connexion perdue — les notes restent enregistrées localement')
                    setSimuleHorsLigne((v) => !v)
                  }}
                  className={cx(
                    'ml-auto flex h-8 items-center gap-1.5 rounded-[8px] border border-bordure-champ bg-white px-2.5 text-leg font-semibold',
                    horsLigne ? 'text-attention' : 'text-encre-nav'
                  )}
                >
                  <Icone nom={horsLigne ? 'plug-circle-xmark' : 'wifi'} />
                  {horsLigne ? 'Hors ligne' : 'En ligne'}
                </button>
              </>
            )}
          </div>
          {!modifiable && (
            <div className="flex gap-2.5 rounded-champ bg-neutre p-3 text-meta leading-[1.45] text-encre-2">
              <Icone nom="lock" className="mt-0.5" />
              {ev.etat === 'soumise'
                ? 'Notes soumises à la direction — en attente de validation. La saisie est fermée.'
                : 'Évaluation validée par la direction : elle n’est plus modifiable (RG12). Seule la cheffe d’établissement peut la déverrouiller.'}
            </div>
          )}
          {modifiable && (
            <span className="text-leg text-encre-3">
              <Icone nom="reg-keyboard" className="mr-1.5" />
              Entrée ou ↓ pour l’élève suivant · enregistrement automatique
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-carte border border-bordure bg-white">
          <div
            className={cx(
              'grid items-center gap-2 bg-entete px-3 py-2.5 text-micro font-bold tracking-[0.04em] text-encre-3 uppercase',
              COLONNES
            )}
          >
            <span>N°</span>
            <span>Élève</span>
            <span className="text-center">/ {ev.max}</span>
            <span className="text-center">Abs.</span>
            <span />
          </div>
          {eleves.map((x, i) => {
            const c = g[x.id] ?? VIDE
            const err = erreurs[x.id]
            const ouverte = obsOuverte === x.id
            const idErr = `err-${x.id}`
            return (
              <div key={x.id} className="border-t border-separateur">
                <div className={cx('grid min-h-[52px] items-center gap-2 px-3 py-1.5', COLONNES)}>
                  <span className="text-leg font-semibold text-encre-4">{i + 1}</span>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cx(
                        'flex size-[30px] shrink-0 items-center justify-center rounded-full text-micro font-bold',
                        x.avatar
                      )}
                    >
                      {x.initiales}
                    </span>
                    <span className="truncate text-corps">
                      <strong>{x.nomU}</strong> {x.prenom}
                    </span>
                  </div>
                  <input
                    data-ligne={i}
                    inputMode="decimal"
                    aria-label={`Note de ${x.prenom} ${x.nomU}`}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={err ? idErr : undefined}
                    value={c.v}
                    placeholder={c.abs ? 'ABS' : '—'}
                    disabled={!modifiable || c.abs}
                    onChange={(e) => saisir(x.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'ArrowDown') {
                        e.preventDefault()
                        focaliser(i + 1, 1)
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        focaliser(i - 1, -1)
                      }
                    }}
                    className={cx(
                      'h-10 w-full rounded-champ border text-center text-[16px] font-bold text-encre outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--acc-soft)]',
                      err ? 'border-danger' : 'border-bordure-moyenne',
                      c.abs
                        ? 'bg-neutre'
                        : err
                          ? 'bg-erreur-champ'
                          : c.v === ''
                            ? 'bg-bandeau'
                            : 'bg-white'
                    )}
                  />
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={c.abs}
                    aria-label={`Absent : ${x.prenom} ${x.nomU}`}
                    disabled={!modifiable}
                    onClick={() => {
                      modifierCellule(ev.id, x.id, { abs: !c.abs, v: '' })
                      enregistrer()
                    }}
                    className={cx(
                      'flex size-7 items-center justify-center justify-self-center rounded-[8px] border-[1.5px] text-leg text-white',
                      c.abs ? 'border-accent bg-accent' : 'border-bordure-forte bg-white'
                    )}
                  >
                    {c.abs && <Icone nom="check" />}
                  </button>
                  <button
                    type="button"
                    aria-label={`Observation : ${x.prenom} ${x.nomU}`}
                    aria-expanded={ouverte}
                    onClick={() => setObsOuverte(ouverte ? null : x.id)}
                    className={cx(
                      'size-9 rounded-[8px]',
                      ouverte ? 'bg-accent-doux' : 'bg-transparent',
                      c.obs ? 'text-accent' : 'text-gris-icone'
                    )}
                  >
                    <Icone nom="reg-comment" />
                  </button>
                </div>
                {err && (
                  <div
                    id={idErr}
                    role="alert"
                    className="pr-3 pb-2 pl-12 text-leg font-semibold text-erreur"
                  >
                    <Icone nom="circle-exclamation" className="mr-1.5" />
                    {err}
                  </div>
                )}
                {c.obs && !ouverte && (
                  <div className="pr-3 pb-2 pl-12 text-leg text-encre-3 italic">{c.obs}</div>
                )}
                {ouverte && (
                  <div className="pr-3 pb-2.5 pl-12">
                    <input
                      aria-label="Observation"
                      value={c.obs}
                      disabled={!modifiable}
                      onChange={(e) => {
                        modifierCellule(ev.id, x.id, { obs: e.target.value.slice(0, 120) })
                        enregistrer()
                      }}
                      placeholder="Observation (facultatif)"
                      className="h-10 w-full rounded-champ border border-bordure-champ bg-champ px-3 text-meta outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {modifiable && (
          <button
            type="button"
            onClick={remplirDemo}
            className="self-start py-1 text-meta font-semibold text-accent"
          >
            Compléter avec des notes de démonstration
          </button>
        )}

        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-carte border border-bordure bg-white px-4 py-3.5 shadow-barre">
          <div className="flex flex-1 flex-wrap gap-4 text-leg text-encre-3">
            <span>
              Moyenne <strong className="text-titre-carte text-encre">{fmt(s.moyenne)}</strong>
            </span>
            <span>
              Min <strong className="text-encre">{fmt(s.min)}</strong>
            </span>
            <span>
              Max <strong className="text-encre">{fmt(s.max)}</strong>
            </span>
            <span>
              Absents <strong className="text-encre">{s.abs}</strong>
            </span>
          </div>
          {modifiable && (
            <button
              type="button"
              onClick={soumettre}
              className="flex h-[46px] items-center gap-2 rounded-bouton bg-accent px-5 text-corps font-bold text-white"
            >
              <Icone nom="paper-plane" />
              Soumettre
            </button>
          )}
        </div>
      </div>
      {feuille}
    </Coque>
  )
}

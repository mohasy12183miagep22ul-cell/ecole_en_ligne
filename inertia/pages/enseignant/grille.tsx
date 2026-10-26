import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Avatar from '~/components/ui/avatar'
import PastilleEval from '~/components/ui/pastille_eval'
import { notifier } from '~/components/ui/toast'
import { useFeuille } from '~/components/ui/feuille'
import { cx, fmt, fmtv, num } from '~/lib/format'
import {
  envoyerJson,
  type EtatEvaluation,
  type StatistiquesEvaluation,
  type TypeEvaluation,
} from '~/lib/notes'
import { Form } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { useCallback, useEffect, useRef, useState } from 'react'

type Ligne = {
  id: number
  matricule: string
  nom: string
  prenoms: string
  valeur: number | null
  absent: boolean
  observation: string
}
type Cellule = { v: string; abs: boolean; obs: string }
type Saisie = {
  eleveId: number
  valeur: number | null
  absent: boolean
  observation: string | null
}

const COLONNES = 'grid-cols-[28px_minmax(0,1fr)_72px_44px_40px]'
const DELAI = 600

/** File locale : saisies non confirmées par le serveur, conservées sur l'appareil. */
const cleFile = (id: number) => `grille-notes:${id}`
function lireFile(id: number): Record<number, Saisie> {
  try {
    return JSON.parse(window.localStorage.getItem(cleFile(id)) ?? '{}')
  } catch {
    return {}
  }
}
function ecrireFile(id: number, file: Record<number, Saisie>) {
  try {
    if (Object.keys(file).length) window.localStorage.setItem(cleFile(id), JSON.stringify(file))
    else window.localStorage.removeItem(cleFile(id))
  } catch {}
}

const versCellule = (l: Pick<Ligne, 'valeur' | 'absent' | 'observation'>): Cellule => ({
  v: l.valeur === null ? '' : fmtv(l.valeur),
  abs: l.absent,
  obs: l.observation ?? '',
})
const versSaisie = (eleveId: number, c: Cellule): Saisie => ({
  eleveId,
  valeur: c.abs || c.v === '' ? null : num(c.v),
  absent: c.abs,
  observation: c.obs.trim() || null,
})

/** Connexion réelle du navigateur. */
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

const heure = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export default function GrilleDeSaisie({
  evaluation: ev,
  saisie,
  types,
  lignes,
  statistiques,
}: {
  evaluation: {
    id: number
    titre: string
    type: TypeEvaluation
    typeLibelle: string
    date: string
    noteMax: number
    poids: number
    etat: EtatEvaluation
    motifRetour: string | null
    classe: string
    matiere: string
    periode: string
  }
  saisie: { ouverte: boolean; jusquAu: string | null; derogation: boolean }
  types: Array<{ cle: TypeEvaluation; libelle: string }>
  lignes: Ligne[]
  statistiques: StatistiquesEvaluation
}) {
  const modifiable = ev.etat === 'brouillon' && saisie.ouverte
  const [cellules, setCellules] = useState<Record<number, Cellule>>(() => {
    const base = Object.fromEntries(lignes.map((l) => [l.id, versCellule(l)]))
    // Saisies restées sur l'appareil lors d'une coupure : elles priment.
    for (const s of Object.values(typeof window === 'undefined' ? {} : lireFile(ev.id))) {
      if (base[s.eleveId])
        base[s.eleveId] = versCellule({
          valeur: s.valeur,
          absent: s.absent,
          observation: s.observation ?? '',
        })
    }
    return base
  })
  const [stats, setStats] = useState(statistiques)
  const [etat, setEtat] = useState<'enregistre' | 'enregistrement' | 'attente' | 'erreur'>(() =>
    typeof window !== 'undefined' && Object.keys(lireFile(ev.id)).length ? 'attente' : 'enregistre'
  )
  const [enregistreLe, setEnregistreLe] = useState<Date | null>(null)
  const [enAttente, setEnAttente] = useState(() =>
    typeof window === 'undefined' ? 0 : Object.keys(lireFile(ev.id)).length
  )
  const [simuleHorsLigne, setSimuleHorsLigne] = useState(false)
  const reseau = useEnLigne()
  const horsLigne = simuleHorsLigne || !reseau
  const [erreurs, setErreurs] = useState<Record<number, string | null>>({})
  const [obsOuverte, setObsOuverte] = useState<number | null>(null)
  const [edition, setEdition] = useState(false)
  const minuteries = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const envoiEnCours = useRef(false)
  // Nouvel essai planifié depuis l'envoi lui-même : passe par une référence à jour.
  const relancer = useRef<() => Promise<void>>(async () => {})
  const [feuille, ouvrir] = useFeuille()

  /** Envoie la file locale au serveur ; elle n'est vidée qu'après confirmation. */
  const envoyer = useCallback(async () => {
    if (envoiEnCours.current || horsLigne) return
    const file = lireFile(ev.id)
    const saisies = Object.values(file)
    if (!saisies.length) return
    envoiEnCours.current = true
    setEtat('enregistrement')
    try {
      const r = await envoyerJson<{ statistiques: StatistiquesEvaluation; enregistreLe: string }>(
        `/enseignant/evaluations/${ev.id}/notes`,
        { saisies }
      )
      // Ne retirer que ce qui a été envoyé : une frappe pendant l'envoi reste en file.
      const reste = lireFile(ev.id)
      for (const s of saisies) {
        if (JSON.stringify(reste[s.eleveId]) === JSON.stringify(s)) delete reste[s.eleveId]
      }
      ecrireFile(ev.id, reste)
      setEnAttente(Object.keys(reste).length)
      setStats(r.statistiques)
      setEnregistreLe(new Date(r.enregistreLe))
      setEtat(Object.keys(reste).length ? 'attente' : 'enregistre')
      if (Object.keys(reste).length)
        minuteries.current.envoi = setTimeout(() => relancer.current(), DELAI)
    } catch (e) {
      const err = e as Error & { reseau?: boolean }
      if (err.reseau) {
        // Serveur injoignable alors que le navigateur se croit en ligne : nouvel essai.
        setEtat('attente')
        minuteries.current.envoi = setTimeout(() => relancer.current(), 10_000)
      } else {
        // Refus du serveur (évaluation fermée, note hors bornes…) : rien n'est enregistré.
        ecrireFile(ev.id, {})
        setEnAttente(0)
        setEtat('erreur')
        notifier(err.message, true)
        router.reload()
      }
    } finally {
      envoiEnCours.current = false
    }
  }, [ev.id, horsLigne])
  useEffect(() => {
    relancer.current = envoyer
  }, [envoyer])

  // Retour du réseau, ou saisies conservées au chargement : renvoi automatique.
  useEffect(() => {
    if (horsLigne || !enAttente) return
    const n = enAttente
    minuteries.current.envoi = setTimeout(async () => {
      await relancer.current()
      if (n) notifier(`${n} modification${n > 1 ? 's' : ''} renvoyée${n > 1 ? 's' : ''} au serveur`)
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horsLigne])

  useEffect(() => {
    const t = minuteries.current
    return () => Object.values(t).forEach(clearTimeout)
  }, [])

  const mettreEnFile = (eleveId: number, c: Cellule) => {
    const file = lireFile(ev.id)
    file[eleveId] = versSaisie(eleveId, c)
    ecrireFile(ev.id, file)
    setEnAttente(Object.keys(file).length)
    setEtat('attente')
    clearTimeout(minuteries.current.envoi)
    minuteries.current.envoi = setTimeout(() => envoyer(), DELAI)
  }

  const modifier = (eleveId: number, partiel: Partial<Cellule>) => {
    const c = { ...cellules[eleveId], ...partiel }
    setCellules((x) => ({ ...x, [eleveId]: c }))
    mettreEnFile(eleveId, c)
  }

  const signaler = (eleveId: number, msg: string) => {
    setErreurs((e) => ({ ...e, [eleveId]: msg }))
    clearTimeout(minuteries.current[eleveId])
    minuteries.current[eleveId] = setTimeout(
      () => setErreurs((e) => ({ ...e, [eleveId]: null })),
      2600
    )
  }

  /** RG10 : une note hors bornes est refusée à la saisie, pas à l'envoi. */
  const saisir = (eleveId: number, brut: string) => {
    if (!modifiable) return
    const t = brut.trim().replace('.', ',')
    if (t !== '') {
      if (!/^\d{0,3}(,\d{0,2})?$/.test(t)) return signaler(eleveId, 'Saisissez un nombre, ex. 12,5')
      const n = num(t)
      if (n !== null && (n < 0 || n > ev.noteMax))
        return signaler(
          eleveId,
          `Note refusée : elle doit être comprise entre 0 et ${fmtv(ev.noteMax)}`
        )
    }
    setErreurs((e) => ({ ...e, [eleveId]: null }))
    modifier(eleveId, { v: t })
  }

  const focaliser = (depart: number, sens: 1 | -1) => {
    for (let i = depart; i >= 0 && i < lignes.length; i += sens) {
      const el = document.querySelector<HTMLInputElement>(`[data-ligne="${i}"]`)
      if (el && !el.disabled) {
        el.focus()
        el.select()
        return
      }
    }
  }

  // Compteurs immédiats (restant à noter) ; moyenne, min et max viennent du serveur.
  const valeurs = Object.values(cellules)
  const notes = valeurs.filter((c) => !c.abs && c.v !== '').length
  const absents = valeurs.filter((c) => c.abs).length
  const reste = Math.max(0, lignes.length - notes - absents)

  const soumettre = () =>
    ouvrir({
      titre: 'Soumettre les notes à la direction ?',
      texte:
        'Après soumission, la saisie est fermée. Une fois validée par la direction, l’évaluation ne sera plus modifiable.',
      lignes: [
        ['Évaluation', `${ev.titre} · ${ev.classe}`],
        ['Notés', `${notes} / ${lignes.length}`],
        ['Absents', String(absents)],
        ['Sans note', String(reste)],
        ['Moyenne', `${fmt(stats.moyenne)} / ${fmtv(ev.noteMax)}`],
      ],
      libelleConfirmer: 'Soumettre',
      onConfirmer: () =>
        router.post(`/enseignant/evaluations/${ev.id}/soumettre`, {}, { preserveScroll: true }),
    })

  const indicateur = horsLigne
    ? {
        c: 'bg-attention-fond text-attention',
        i: 'cloud' as const,
        t: `${enAttente} modification${enAttente > 1 ? 's' : ''} conservée${enAttente > 1 ? 's' : ''} sur l’appareil`,
        tourne: false,
      }
    : etat === 'enregistrement' || etat === 'attente'
      ? { c: 'bg-info-fond text-info', i: 'spinner' as const, t: 'Enregistrement…', tourne: true }
      : etat === 'erreur'
        ? {
            c: 'bg-erreur-fond text-erreur',
            i: 'circle-exclamation' as const,
            t: 'Saisie refusée',
            tourne: false,
          }
        : {
            c: 'bg-succes-fond text-succes',
            i: 'circle-check' as const,
            t: enregistreLe ? `Enregistré à ${heure(enregistreLe)}` : 'À jour',
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
                {ev.classe} · {ev.matiere} · {ev.typeLibelle} ·{' '}
                {ev.date.split('-').reverse().join('/')} · sur {fmtv(ev.noteMax)} · poids{' '}
                {fmtv(ev.poids)} · {ev.periode}
              </span>
            </div>
            <PastilleEval etat={ev.etat} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-live="polite"
              className={cx(
                'rounded-[8px] px-2.5 py-1.5 text-leg font-bold',
                reste === 0 ? 'bg-succes-fond text-succes' : 'bg-attention-fond text-attention'
              )}
            >
              {reste === 0
                ? 'Tous les élèves sont notés'
                : `${reste} ${reste > 1 ? 'élèves restent à noter' : 'élève reste à noter'}`}
            </span>
            {modifiable && (
              <>
                <span
                  role="status"
                  className={cx(
                    'flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-leg font-semibold',
                    indicateur.c
                  )}
                >
                  <Icone nom={indicateur.i} tourne={indicateur.tourne} />
                  {indicateur.t}
                </span>
                <button
                  type="button"
                  title="Simuler une coupure réseau"
                  aria-pressed={simuleHorsLigne}
                  onClick={() => {
                    if (!simuleHorsLigne)
                      notifier('Connexion perdue : les notes restent enregistrées sur l’appareil')
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
          {ev.etat === 'brouillon' && ev.motifRetour && (
            <div className="flex gap-2.5 rounded-champ bg-attention-fond p-3 text-meta leading-[1.45] text-attention">
              <Icone nom="triangle-exclamation" className="mt-0.5" />
              Évaluation revenue au brouillon : {ev.motifRetour}
            </div>
          )}
          {ev.etat === 'brouillon' && !saisie.ouverte && (
            <div className="flex gap-2.5 rounded-champ bg-neutre p-3 text-meta leading-[1.45] text-encre-2">
              <Icone nom="lock" className="mt-0.5" />
              La fenêtre de saisie du {ev.periode} est fermée : la direction peut accorder une
              dérogation (RG13).
            </div>
          )}
          {ev.etat !== 'brouillon' && (
            <div className="flex gap-2.5 rounded-champ bg-neutre p-3 text-meta leading-[1.45] text-encre-2">
              <Icone nom="lock" className="mt-0.5" />
              {ev.etat === 'soumise'
                ? 'Notes soumises à la direction : en attente de validation. La saisie est fermée.'
                : 'Évaluation validée par la direction : elle n’est plus modifiable (RG12). Seul le chef d’établissement peut la déverrouiller.'}
            </div>
          )}
          {modifiable && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex-1 text-leg text-encre-3">
                <Icone nom="reg-keyboard" className="mr-1.5" />
                Entrée ou ↓ pour l’élève suivant · enregistrement automatique
                {saisie.derogation && saisie.jusquAu && ` · dérogation jusqu’au ${saisie.jusquAu}`}
              </span>
              <button
                type="button"
                aria-expanded={edition}
                onClick={() => setEdition((v) => !v)}
                className="text-leg font-semibold text-accent"
              >
                <Icone nom="pen-to-square" className="mr-1" />
                {edition ? 'Fermer' : 'Modifier l’évaluation'}
              </button>
            </div>
          )}
          {modifiable && edition && (
            <Form
              route="enseignant.evaluations.update"
              routeParams={{ id: ev.id }}
              transform={(d) => ({
                ...d,
                noteMax: Number(String(d.noteMax).replace(',', '.')),
                poids: Number(String(d.poids).replace(',', '.')),
              })}
              options={{ preserveScroll: true }}
              onSuccess={() => setEdition(false)}
              className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-3 rounded-bouton bg-entete p-3"
            >
              {({ errors, processing }) => (
                <>
                  <label className="col-span-full flex flex-col gap-1 text-meta font-semibold">
                    Titre
                    <input
                      name="titre"
                      defaultValue={ev.titre}
                      className="h-10 rounded-champ border border-bordure-champ bg-white px-3 font-normal"
                    />
                    {errors.titre && (
                      <span className="text-leg text-erreur">3 caractères minimum.</span>
                    )}
                  </label>
                  <label className="flex flex-col gap-1 text-meta font-semibold">
                    Type
                    <select
                      name="type"
                      defaultValue={ev.type}
                      className="h-10 rounded-champ border border-bordure-champ bg-white px-2 font-normal"
                    >
                      {types.map((t) => (
                        <option key={t.cle} value={t.cle}>
                          {t.libelle}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-meta font-semibold">
                    Date
                    <input
                      type="date"
                      name="date"
                      defaultValue={ev.date}
                      className="h-10 rounded-champ border border-bordure-champ bg-white px-2 font-normal"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-meta font-semibold">
                    Note maximale
                    <input
                      name="noteMax"
                      inputMode="decimal"
                      defaultValue={fmtv(ev.noteMax)}
                      className="h-10 rounded-champ border border-bordure-champ bg-white px-3 font-normal"
                    />
                    {errors.noteMax && (
                      <span className="text-leg text-erreur">Entre 1 et 100.</span>
                    )}
                  </label>
                  <label className="flex flex-col gap-1 text-meta font-semibold">
                    Poids
                    <input
                      name="poids"
                      inputMode="decimal"
                      defaultValue={fmtv(ev.poids)}
                      className="h-10 rounded-champ border border-bordure-champ bg-white px-3 font-normal"
                    />
                    {errors.poids && (
                      <span className="text-leg text-erreur">Strictement positif.</span>
                    )}
                  </label>
                  <button
                    type="submit"
                    disabled={processing}
                    className="h-10 self-end rounded-champ bg-accent px-4 text-meta font-bold text-white disabled:opacity-60"
                  >
                    Enregistrer
                  </button>
                </>
              )}
            </Form>
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
            <span className="text-center">/ {fmtv(ev.noteMax)}</span>
            <span className="text-center">Abs.</span>
            <span />
          </div>
          {lignes.length === 0 && (
            <p className="p-5 text-center text-meta text-encre-3">
              Aucun élève inscrit dans cette classe.
            </p>
          )}
          {lignes.map((x, i) => {
            const c = cellules[x.id]
            const err = erreurs[x.id]
            const ouverte = obsOuverte === x.id
            const idErr = `err-${x.id}`
            const nom = `${x.prenoms} ${x.nom.toUpperCase()}`
            return (
              <div key={x.id} className="border-t border-separateur">
                <div className={cx('grid min-h-[52px] items-center gap-2 px-3 py-1.5', COLONNES)}>
                  <span className="text-leg font-semibold text-encre-4">{i + 1}</span>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar nom={`${x.prenoms} ${x.nom}`} taille={30} />
                    <span className="truncate text-corps">
                      <strong>{x.nom.toUpperCase()}</strong> {x.prenoms}
                    </span>
                  </div>
                  <input
                    data-ligne={i}
                    inputMode="decimal"
                    aria-label={`Note de ${nom}`}
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
                    aria-label={`Absent : ${nom}`}
                    disabled={!modifiable}
                    onClick={() => modifier(x.id, { abs: !c.abs, v: '' })}
                    className={cx(
                      'flex size-7 items-center justify-center justify-self-center rounded-[8px] border-[1.5px] text-leg text-white',
                      c.abs ? 'border-accent bg-accent' : 'border-bordure-forte bg-white'
                    )}
                  >
                    {c.abs && <Icone nom="check" />}
                  </button>
                  <button
                    type="button"
                    aria-label={`Observation : ${nom}`}
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
                      aria-label={`Observation pour ${nom}`}
                      value={c.obs}
                      disabled={!modifiable}
                      maxLength={120}
                      onChange={(e) => modifier(x.id, { obs: e.target.value.slice(0, 120) })}
                      placeholder="Observation (facultatif)"
                      className="h-10 w-full rounded-champ border border-bordure-champ bg-champ px-3 text-meta outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-carte border border-bordure bg-white px-4 py-3.5 shadow-barre">
          <div className="flex flex-1 flex-wrap gap-4 text-leg text-encre-3">
            <span>
              Moyenne <strong className="text-titre-carte text-encre">{fmt(stats.moyenne)}</strong>
            </span>
            <span>
              Min <strong className="text-encre">{fmt(stats.min)}</strong>
            </span>
            <span>
              Max <strong className="text-encre">{fmt(stats.max)}</strong>
            </span>
            <span>
              Absents <strong className="text-encre">{absents}</strong>
            </span>
          </div>
          {modifiable && (
            <button
              type="button"
              disabled={enAttente > 0 || horsLigne}
              title={
                enAttente > 0 || horsLigne
                  ? 'Attendez l’enregistrement de toutes les notes'
                  : undefined
              }
              onClick={soumettre}
              className="flex h-[46px] items-center gap-2 rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-50"
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

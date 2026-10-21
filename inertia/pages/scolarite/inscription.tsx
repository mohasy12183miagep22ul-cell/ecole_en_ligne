import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Pastille from '~/components/ui/pastille'
import Illustration from '~/components/ui/illustration'
import Interrupteur from '~/components/ui/interrupteur'
import { notifier } from '~/components/ui/toast'
import { cx } from '~/lib/format'
import { CLASSES } from '~/demo/donnees'
import { journaliser } from '~/demo/store'
import { usePage } from '@inertiajs/react'
import { useState, type ReactNode } from 'react'

const INITIAL = {
  nom: '',
  prenom: '',
  sexe: '',
  dob: '',
  lieu: '',
  nat: 'Guinéenne',
  acte: '',
  tNom: '',
  tLien: 'Mère',
  tTel: '',
  tProf: '',
  tAddr: '',
  niveau: '3e',
  classe: '3e A',
  origine: '',
  red: false,
  docs: { acte: true, bull: false, transf: false, photo: true } as Record<string, boolean>,
}
type Saisie = typeof INITIAL
type Cle = Exclude<keyof Saisie, 'red' | 'docs'>

const champ =
  'h-12 w-full min-w-0 rounded-bouton border bg-champ px-3.5 text-moyen text-encre outline-none focus:border-accent focus:bg-white'
const LIENS = ['Mère', 'Père', 'Tante', 'Oncle', 'Grand-parent', 'Autre tuteur légal']
const ETAPES = ['Identité', 'Tuteurs', 'Scolarité']

function Ligne({
  libelle,
  erreur,
  children,
}: {
  libelle: string
  erreur?: string
  children: ReactNode
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-meta font-semibold">{libelle}</span>
      {children}
      {erreur && (
        <span role="alert" className="text-leg text-erreur">
          {erreur}
        </span>
      )}
    </label>
  )
}

export default function NouvelleInscription() {
  const { props } = usePage()
  const auteur = props.user?.fullName ?? ''
  const [etape, setEtape] = useState(1)
  const [f, setF] = useState<Saisie>(structuredClone(INITIAL))
  const [err, setErr] = useState<Partial<Record<Cle, string>>>({})
  const [fini, setFini] = useState<null | {
    mat: string
    nom: string
    classe: string
    manquantes: string[]
  }>(null)

  const entree = (k: Cle, extra: Record<string, unknown> = {}) => ({
    value: f[k] as string,
    onChange: (e: { target: { value: string } }) => {
      setF({ ...f, [k]: e.target.value })
      setErr({ ...err, [k]: undefined })
    },
    className: cx(champ, err[k] ? 'border-danger' : 'border-bordure-champ'),
    ...extra,
  })

  const classes = CLASSES[f.niveau]
  const ci = classes.find((c) => c[0] === f.classe) ?? classes[0]
  const pieces: Array<[string, string, boolean]> = [
    ['acte', 'Acte de naissance', true],
    ['bull', 'Bulletin ou certificat de l’année précédente', true],
    ['transf', 'Certificat de transfert', !!f.origine.trim()],
    ['photo', 'Photo d’identité', true],
  ]

  const valider = (n: number) => {
    const e: Partial<Record<Cle, string>> = {}
    if (n === 1) {
      if (!f.nom.trim()) e.nom = 'Le nom est obligatoire.'
      if (!f.prenom.trim()) e.prenom = 'Les prénoms sont obligatoires.'
      if (!f.sexe) e.sexe = 'Indiquez le sexe.'
      if (!f.dob) e.dob = 'La date de naissance est obligatoire.'
      if (!f.lieu.trim()) e.lieu = 'Le lieu de naissance est obligatoire.'
    }
    if (n === 2) {
      if (!f.tNom.trim()) e.tNom = 'Au moins un tuteur est requis.'
      if (!/^[+\d][\d ]{8,}$/.test(f.tTel.trim()))
        e.tTel = 'Numéro invalide, ex. +224 622 00 00 00.'
    }
    if (n === 3 && ci[1] >= ci[2])
      e.classe = `Classe complète (${ci[1]} / ${ci[2]}). Seule la direction peut forcer l’affectation, avec motif (RG7).`
    return e
  }

  const haut = () => document.getElementById('defilement')?.scrollTo({ top: 0 })

  const suivant = () => {
    const e = valider(etape)
    if (Object.keys(e).length) return setErr(e)
    setErr({})
    setEtape(etape + 1)
    haut()
  }

  const soumettre = () => {
    const e = valider(3)
    if (Object.keys(e).length) return setErr(e)
    const manquantes = pieces
      .filter(([k, , requis]) => !f.docs[k] && (k !== 'transf' || requis))
      .map(([, l]) => l)
    const mat = `2026-${String(1287 + Math.floor(Math.random() * 90)).padStart(5, '0')}`
    const nom = `${f.prenom} ${f.nom.toUpperCase()}`
    setFini({ mat, nom, classe: f.classe, manquantes })
    journaliser(
      auteur,
      'Dossier d’inscription soumis',
      `${nom} · ${f.classe}`,
      'Brouillon',
      'Soumis'
    )
  }

  const recommencer = () => {
    setEtape(1)
    setF(structuredClone(INITIAL))
    setErr({})
    setFini(null)
  }

  return (
    <Coque espace="scolarite" titre="Nouvelle inscription">
      <div className="flex max-w-[720px] flex-col gap-3.5">
        <ol className="flex items-center gap-2">
          {ETAPES.map((l, i) => {
            const n = i + 1
            const on = etape === n && !fini
            const fait = etape > n || !!fini
            return (
              <li
                key={l}
                aria-current={on ? 'step' : undefined}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <span
                  className={cx(
                    'flex size-[30px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-meta font-extrabold',
                    fait
                      ? 'border-accent bg-accent text-white'
                      : on
                        ? 'border-accent bg-accent-doux text-accent'
                        : 'border-bordure-moyenne bg-white text-encre-4'
                  )}
                >
                  {fait ? <Icone nom="check" /> : n}
                </span>
                <span
                  className={cx('truncate text-meta font-bold', on ? 'text-encre' : 'text-encre-4')}
                >
                  {l}
                </span>
                <div className="h-0.5 min-w-2 flex-1 bg-bordure-champ" />
              </li>
            )
          })}
        </ol>

        {!fini && etape === 1 && (
          <div className="flex flex-col gap-4 rounded-carte border border-bordure bg-white p-5">
            <span className="text-titre-carte font-extrabold">Identité de l’élève</span>
            <div className="flex items-center gap-3.5">
              <div className="flex size-[72px] items-center justify-center rounded-full border-[1.5px] border-dashed border-bordure-forte text-section-lg text-encre-4">
                <Icone nom="camera" />
              </div>
              <span className="text-leg leading-[1.45] text-encre-3">
                Photo d’identité
                <br />
                JPG ou PNG · 5 Mo max.
              </span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
              <Ligne libelle="Nom *" erreur={err.nom}>
                <input {...entree('nom')} />
              </Ligne>
              <Ligne libelle="Prénoms *" erreur={err.prenom}>
                <input {...entree('prenom')} />
              </Ligne>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-meta font-semibold">Sexe *</span>
              <div role="radiogroup" aria-label="Sexe" className="flex gap-2">
                {[
                  ['F', 'Féminin'],
                  ['M', 'Masculin'],
                ].map(([k, l]) => {
                  const on = f.sexe === k
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        setF({ ...f, sexe: k })
                        setErr({ ...err, sexe: undefined })
                      }}
                      className={cx(
                        'h-[46px] flex-1 rounded-bouton border text-corps font-semibold',
                        on
                          ? 'border-accent bg-accent-doux text-accent'
                          : cx(
                              'bg-white text-encre-2',
                              err.sexe ? 'border-danger' : 'border-bordure-champ'
                            )
                      )}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>
              {err.sexe && (
                <span role="alert" className="text-leg text-erreur">
                  {err.sexe}
                </span>
              )}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
              <Ligne libelle="Date de naissance *" erreur={err.dob}>
                <input type="date" {...entree('dob')} />
              </Ligne>
              <Ligne libelle="Lieu de naissance *" erreur={err.lieu}>
                <input {...entree('lieu')} />
              </Ligne>
              <Ligne libelle="Nationalité">
                <input {...entree('nat')} />
              </Ligne>
              <Ligne libelle="N° d’acte de naissance">
                <input {...entree('acte')} />
              </Ligne>
            </div>
          </div>
        )}

        {!fini && etape === 2 && (
          <div className="flex flex-col gap-4 rounded-carte border border-bordure bg-white p-5">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-titre-carte font-extrabold">Tuteur principal</span>
              <button
                type="button"
                onClick={() => notifier('Recherche d’un tuteur existant — prototype')}
                className="text-meta font-bold text-accent"
              >
                <Icone nom="link" className="mr-1.5" />
                Tuteur existant (fratrie)
              </button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
              <Ligne libelle="Nom complet *" erreur={err.tNom}>
                <input {...entree('tNom')} />
              </Ligne>
              <Ligne libelle="Lien de parenté">
                <select {...entree('tLien')}>
                  {LIENS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </Ligne>
              <Ligne libelle="Téléphone *" erreur={err.tTel}>
                <input type="tel" placeholder="+224 622 00 00 00" {...entree('tTel')} />
              </Ligne>
              <Ligne libelle="Profession">
                <input {...entree('tProf')} />
              </Ligne>
            </div>
            <Ligne libelle="Adresse">
              <input {...entree('tAddr')} />
            </Ligne>
          </div>
        )}

        {!fini && etape === 3 && (
          <div className="flex flex-col gap-4 rounded-carte border border-bordure bg-white p-5">
            <span className="text-titre-carte font-extrabold">Scolarité demandée · 2026-2027</span>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
              <Ligne libelle="Niveau">
                <select
                  value={f.niveau}
                  onChange={(e) => {
                    const v = e.target.value
                    setF({ ...f, niveau: v, classe: CLASSES[v][0][0] })
                    setErr({ ...err, classe: undefined })
                  }}
                  className={cx(champ, 'border-bordure-champ')}
                >
                  {Object.keys(CLASSES).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Ligne>
              <Ligne libelle="Classe souhaitée">
                <select {...entree('classe')}>
                  {classes.map(([c, n, cap]) => (
                    <option key={c} value={c}>
                      {c} · {n} / {cap}
                      {n >= cap ? ' — complète' : ''}
                    </option>
                  ))}
                </select>
              </Ligne>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-leg text-encre-3">
                <span>Capacité de la classe</span>
                <span className="font-bold">
                  Effectif {ci[1]} / {ci[2]}
                </span>
              </div>
              <div className="h-1.5 rounded-[3px] bg-neutre">
                <div
                  className={cx('h-full rounded-[3px]', ci[1] >= ci[2] ? 'bg-danger' : 'bg-accent')}
                  style={{ width: `${(ci[1] / ci[2]) * 100}%` }}
                />
              </div>
              {err.classe && (
                <span role="alert" className="text-leg text-erreur">
                  {err.classe}
                </span>
              )}
            </div>
            <Ligne libelle="Établissement d’origine">
              <input placeholder="Laisser vide si déjà scolarisé ici" {...entree('origine')} />
            </Ligne>
            <div className="flex items-center justify-between gap-3">
              <span className="text-corps font-semibold text-encre">Redoublant</span>
              <Interrupteur
                libelle="Redoublant"
                actif={f.red}
                onChange={(v) => setF({ ...f, red: v })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-meta font-semibold">Pièces justificatives</span>
              {pieces.map(([k, l, requis]) => {
                const on = f.docs[k]
                return (
                  <div
                    key={k}
                    className="flex items-center gap-3 rounded-bouton border border-bordure px-3 py-2.5"
                  >
                    <Icone
                      nom={on ? 'file-circle-check' : 'paperclip'}
                      className={on ? 'text-succes' : 'text-erreur'}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-meta font-semibold">{l}</span>
                      <span className="text-micro text-encre-3">
                        {requis ? 'Obligatoire' : 'Si autre établissement'} · PDF ou image, 5 Mo
                        max.
                      </span>
                    </div>
                    <Pastille etat={on ? 'succes' : 'erreur'} taille="petite">
                      {on ? 'Fourni' : 'Manquant'}
                    </Pastille>
                    <button
                      type="button"
                      onClick={() => setF({ ...f, docs: { ...f.docs, [k]: !on } })}
                      className="h-[34px] rounded-[9px] border border-bordure-champ bg-white px-2.5 text-leg font-semibold text-encre-2"
                    >
                      {on ? 'Retirer' : 'Joindre'}
                    </button>
                  </div>
                )
              })}
              <span className="text-leg text-encre-3">
                Un dossier peut être soumis avec des pièces manquantes, mais il ne pourra pas être
                validé.
              </span>
            </div>
          </div>
        )}

        {fini && (
          <div className="flex flex-col items-center gap-3 rounded-carte border border-bordure bg-white p-6 text-center">
            <Illustration nom="coches" largeur={170} hauteur={130} />
            <span className="text-[18px] font-extrabold">Dossier soumis</span>
            <span className="text-corps text-encre-2">
              {fini.nom} · {fini.classe} · matricule <strong>{fini.mat}</strong>
            </span>
            {fini.manquantes.length > 0 ? (
              <div className="flex flex-col items-center gap-1.5 rounded-bouton bg-attention-fond p-3 text-meta text-attention">
                <span className="font-bold">
                  Pièces manquantes — validation impossible en l’état
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {fini.manquantes.map((m) => (
                    <span key={m} className="rounded-[8px] bg-white px-2 py-[3px]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-meta font-semibold text-succes">
                Dossier complet — en attente de validation par la direction.
              </span>
            )}
            <div className="flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={() => notifier('Fiche d’inscription imprimable générée (PDF)')}
                className="h-[46px] rounded-bouton border border-bordure-champ bg-white px-4 text-corps font-semibold text-encre-2"
              >
                <Icone nom="print" className="mr-2" />
                Fiche d’inscription
              </button>
              <button
                type="button"
                onClick={recommencer}
                className="h-[46px] rounded-bouton bg-accent px-[18px] text-corps font-bold text-white"
              >
                Nouvelle inscription
              </button>
            </div>
          </div>
        )}

        {!fini && (
          <div className="flex flex-wrap gap-2.5">
            {etape > 1 && (
              <button
                type="button"
                onClick={() => {
                  setEtape(etape - 1)
                  setErr({})
                }}
                className="h-12 rounded-bouton border border-bordure-champ bg-white px-4 text-corps font-semibold text-encre-2"
              >
                <Icone nom="arrow-left" className="mr-2" />
                Précédent
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => notifier('Brouillon enregistré')}
              className="h-12 rounded-bouton border border-bordure-champ bg-white px-4 text-corps font-semibold text-encre-2"
            >
              Brouillon
            </button>
            {etape < 3 ? (
              <button
                type="button"
                onClick={suivant}
                className="h-12 rounded-bouton bg-accent px-5 text-corps font-bold text-white"
              >
                Continuer
                <Icone nom="arrow-right" className="ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={soumettre}
                className="h-12 rounded-bouton bg-accent px-5 text-corps font-bold text-white"
              >
                Soumettre le dossier
              </button>
            )}
          </div>
        )}
      </div>
    </Coque>
  )
}

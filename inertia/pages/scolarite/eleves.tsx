import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Avatar from '~/components/ui/avatar'
import Pastille from '~/components/ui/pastille'
import Feuille from '~/components/ui/feuille'
import Pagination, { type InfosPagination } from '~/components/ui/pagination'
import Illustration from '~/components/ui/illustration'
import { Selection } from '~/components/ui/champ'
import SelecteurAnnee from '~/components/admin/selecteur_annee'
import EtatVide from '~/components/ui/etat_vide'
import { cx } from '~/lib/format'
import { type EtatAnnee } from '~/lib/structure'
import {
  LIBELLES_ETAT,
  LIBELLES_STATUT,
  dateFr,
  estPleine,
  etatDossier,
  etatStatut,
  libelleStatut,
  occupation,
  type ClasseEffectif,
  type EtatDossier,
  type StatutEleve,
} from '~/lib/scolarite'
import { Link } from '@adonisjs/inertia/react'
import { router, usePage } from '@inertiajs/react'
import { useRef, useState } from 'react'

type Annee = { id: number; libelle: string; etat: EtatAnnee }
type Colonne = { cle: string; libelle: string }
type Filtres = {
  q?: string
  niveau?: number | null
  classe?: number | null
  sexe?: 'F' | 'M' | null
  statut?: string | null
  redoublant?: boolean | null
  incomplet?: boolean
}
type Ligne = {
  id: number
  inscriptionId: number
  matricule: string
  nom: string
  prenoms: string
  sexe: string
  dateNaissance: string | null
  niveau: string
  classe: string | null
  statut: StatutEleve
  etat: EtatDossier
  redoublant: boolean
  incomplet: boolean
}

const URL = '/scolarite/eleves'
const PAR_DEFAUT = ['eleve', 'matricule', 'classe', 'sexe', 'statut', 'dossier']
const CLE_COLONNES = 'eleves.colonnes'
const LARGEURS: Record<string, string> = {
  eleve: 'minmax(200px,2fr)',
  matricule: '110px',
  classe: '80px',
  niveau: '70px',
  sexe: '50px',
  naissance: '100px',
  statut: '120px',
  dossier: '96px',
  etat: '96px',
  redoublant: '90px',
}
const bouton =
  'flex h-11 items-center rounded-bouton border border-bordure-champ bg-white px-3.5 text-meta font-semibold text-encre-2 hover:no-underline'
const filtre = 'h-9 shrink-0 rounded-champ border border-bordure-champ bg-white px-2 text-meta'
const actionMasse = 'h-9 rounded-[9px] bg-white/14 px-3 text-meta font-semibold disabled:opacity-40'

/** Colonnes affichées : préférence propre à ce navigateur, jamais bloquante. */
function colonnesMemorisees(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLE_COLONNES) ?? 'null')
    if (Array.isArray(v) && v.includes('eleve')) return v
  } catch {}
  return PAR_DEFAUT
}

function Case({ coche }: { coche: boolean }) {
  return (
    <span
      className={cx(
        'flex size-5 items-center justify-center rounded-[6px] border-[1.5px] text-[10px] text-white',
        coche ? 'border-accent bg-accent' : 'border-bordure-forte bg-white'
      )}
    >
      {coche && <Icone nom="check" />}
    </span>
  )
}

function Bascule({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        'h-9 shrink-0 rounded-champ border px-3 text-meta font-semibold',
        on
          ? 'border-accent bg-accent-doux text-accent'
          : 'border-bordure-champ bg-white text-encre-2'
      )}
    >
      {children}
    </button>
  )
}

function Cellule({ cle, l }: { cle: string; l: Ligne }) {
  switch (cle) {
    case 'eleve':
      return (
        <Link
          route="scolarite.fiche"
          routeParams={{ id: l.id }}
          className="flex min-w-0 items-center gap-2.5 text-left hover:no-underline"
        >
          <Avatar nom={`${l.prenoms} ${l.nom}`} taille={30} />
          <span className="truncate font-semibold text-encre">
            {l.nom.toUpperCase()} {l.prenoms}
          </span>
        </Link>
      )
    case 'matricule':
      return <span className="text-encre-2 tabular-nums">{l.matricule}</span>
    case 'classe':
      return <span>{l.classe ?? <span className="text-encre-3">à affecter</span>}</span>
    case 'niveau':
      return <span>{l.niveau}</span>
    case 'sexe':
      return <span>{l.sexe}</span>
    case 'naissance':
      return <span className="tabular-nums">{dateFr(l.dateNaissance)}</span>
    case 'statut':
      return (
        <Pastille etat={etatStatut(l.statut)} taille="moyenne" className="justify-self-start">
          {libelleStatut(l.statut)}
        </Pastille>
      )
    case 'dossier':
      return (
        <span className={cx('font-semibold', l.incomplet ? 'text-erreur' : 'text-succes')}>
          {l.incomplet ? 'Incomplet' : 'Complet'}
        </span>
      )
    case 'etat':
      return (
        <Pastille etat={etatDossier(l.etat)} taille="moyenne" className="justify-self-start">
          {LIBELLES_ETAT[l.etat]}
        </Pastille>
      )
    case 'redoublant':
      return <span>{l.redoublant ? 'Oui' : 'Non'}</span>
    default:
      return null
  }
}

/** Filtres au format attendu par le serveur (aucune valeur vide). */
const versRequete = (f: Filtres, annee: number) =>
  Object.fromEntries(
    Object.entries({
      annee,
      q: f.q || undefined,
      niveau: f.niveau ?? undefined,
      classe: f.classe ?? undefined,
      sexe: f.sexe ?? undefined,
      statut: f.statut ?? undefined,
      redoublant: f.redoublant ?? undefined,
      incomplet: f.incomplet || undefined,
    }).filter(([, v]) => v !== undefined)
  )

/** Même filtres, sous la forme du service (export de la liste). */
const versFiltresExport = (f: Filtres, anneeId: number) =>
  Object.fromEntries(
    Object.entries({
      anneeId,
      q: f.q || undefined,
      niveauId: f.niveau ?? undefined,
      classeId: f.classe ?? undefined,
      sexe: f.sexe ?? undefined,
      statut: f.statut ?? undefined,
      redoublant: f.redoublant ?? undefined,
      incomplet: f.incomplet || undefined,
    }).filter(([, v]) => v !== undefined)
  )

export default function ListeEleves({
  annee,
  annees,
  niveaux,
  colonnes,
  classes,
  filtres,
  eleves,
  pagination,
}: {
  annee: Annee | null
  annees: Annee[]
  niveaux: Array<{ id: number; libelle: string }>
  colonnes: Colonne[]
  classes: ClasseEffectif[]
  filtres: Filtres
  eleves: Ligne[]
  pagination: InfosPagination
}) {
  const { props } = usePage()
  const direction = (props.user?.roles ?? []).includes('direction')
  const [q, setQ] = useState(filtres.q ?? '')
  const [visibles, setVisibles] = useState<string[]>(colonnesMemorisees)
  const [sel, setSel] = useState<Record<number, Ligne>>({})
  const [changement, setChangement] = useState(false)
  const [cible, setCible] = useState<number | ''>('')
  const [forcer, setForcer] = useState(false)
  const [motif, setMotif] = useState('')
  const minuteur = useRef<ReturnType<typeof setTimeout>>(undefined)

  if (!annee) {
    return (
      <Coque espace="scolarite" titre="Liste des élèves">
        <EtatVide
          icone="calendar-days"
          titre="Aucune année scolaire active"
          texte="L’administrateur doit activer une année scolaire avant les inscriptions."
        />
      </Coque>
    )
  }

  const modifiable = annee.etat === 'active'
  const appliquer = (modif: Partial<Filtres>) =>
    router.get(URL, versRequete({ ...filtres, q, ...modif }, annee.id), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['eleves', 'filtres', 'pagination'],
    })
  // Recherche serveur, 300 ms après la dernière frappe.
  const rechercher = (v: string) => {
    setQ(v)
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => appliquer({ q: v }), 300)
  }
  const aller = (page: number) =>
    router.get(URL, { ...versRequete({ ...filtres, q }, annee.id), page }, { preserveState: true })

  const choisirColonnes = (cle: string) => {
    const suivant = visibles.includes(cle) ? visibles.filter((c) => c !== cle) : [...visibles, cle]
    const ordonne = colonnes.map((c) => c.cle).filter((c) => suivant.includes(c))
    setVisibles(ordonne)
    try {
      window.localStorage.setItem(CLE_COLONNES, JSON.stringify(ordonne))
    } catch {}
  }

  const exporter = (format: 'pdf' | 'xlsx', selection?: number[]) =>
    router.post(
      '/scolarite/documents',
      {
        type: 'liste_eleves',
        format,
        filtres: versFiltresExport({ ...filtres, q }, annee.id),
        colonnes: visibles,
        ...(selection ? { inscriptionIds: selection } : {}),
      },
      { preserveScroll: true }
    )

  const choisis = Object.values(sel)
  const nSel = choisis.length
  const validees = choisis.filter((l) => l.etat === 'valide')
  const tout = eleves.length > 0 && eleves.every((l) => sel[l.inscriptionId])
  const basculer = (l: Ligne) =>
    setSel((x) => {
      const o = { ...x }
      if (o[l.inscriptionId]) delete o[l.inscriptionId]
      else o[l.inscriptionId] = l
      return o
    })
  const classesFiltre = classes.filter((c) => !filtres.niveau || c.niveauId === filtres.niveau)
  const classeCible = classes.find((c) => c.id === cible)
  const gabarit = {
    gridTemplateColumns: ['40px', ...visibles.map((c) => LARGEURS[c]), '24px'].join(' '),
  }

  return (
    <Coque espace="scolarite" titre="Liste des élèves">
      <div className="flex flex-col gap-3">
        {annees.length > 1 && <SelecteurAnnee url={URL} annees={annees} courante={annee} />}

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-11 min-w-[220px] flex-1 items-center gap-2.5 rounded-bouton border border-bordure-champ bg-white px-3.5">
            <Icone nom="magnifying-glass" className="text-accent" />
            <input
              type="search"
              value={q}
              onChange={(e) => rechercher(e.target.value)}
              placeholder="Nom, prénom ou matricule"
              aria-label="Rechercher un élève"
              className="min-w-0 flex-1 border-none bg-transparent text-corps outline-none"
            />
          </div>
          {modifiable && (
            <Link route="scolarite.import" className={bouton}>
              <Icone nom="file-import" className="mr-1.5" />
              Importer
            </Link>
          )}
          <button type="button" className={bouton} onClick={() => exporter('xlsx')}>
            <Icone nom="reg-file-excel" className="mr-1.5" />
            Excel
          </button>
          <button type="button" className={bouton} onClick={() => exporter('pdf')}>
            <Icone nom="reg-file-pdf" className="mr-1.5" />
            PDF
          </button>
          <button
            type="button"
            className={bouton}
            onClick={() =>
              router.post(
                '/scolarite/documents',
                { type: 'registre', format: 'pdf', anneeId: annee.id },
                { preserveScroll: true }
              )
            }
          >
            <Icone nom="book" className="mr-1.5" />
            Registre
          </button>
          <details className="relative">
            <summary className={cx(bouton, 'cursor-pointer list-none')}>
              <Icone nom="layer-group" className="mr-1.5" />
              Colonnes
            </summary>
            <fieldset className="absolute right-0 z-20 mt-1.5 flex w-56 flex-col gap-1 rounded-bouton border border-bordure bg-white p-2.5 shadow-feuille">
              <legend className="sr-only">Colonnes affichées et exportées</legend>
              {colonnes.map((c) => (
                <label
                  key={c.cle}
                  className="flex items-center gap-2 rounded-champ px-1.5 py-1 text-meta"
                >
                  <input
                    type="checkbox"
                    checked={visibles.includes(c.cle)}
                    disabled={c.cle === 'eleve'}
                    onChange={() => choisirColonnes(c.cle)}
                    className="accent-accent"
                  />
                  {c.libelle}
                </label>
              ))}
            </fieldset>
          </details>
        </div>

        <div className="scroll-masque flex items-center gap-2 overflow-x-auto">
          <select
            aria-label="Niveau"
            value={filtres.niveau ?? ''}
            onChange={(e) =>
              appliquer({ niveau: e.target.value ? Number(e.target.value) : null, classe: null })
            }
            className={filtre}
          >
            <option value="">Tous les niveaux</option>
            {niveaux.map((n) => (
              <option key={n.id} value={n.id}>
                {n.libelle}
              </option>
            ))}
          </select>
          <select
            aria-label="Classe"
            value={filtres.classe ?? ''}
            onChange={(e) => appliquer({ classe: e.target.value ? Number(e.target.value) : null })}
            className={filtre}
          >
            <option value="">Toutes les classes</option>
            {classesFiltre.map((c) => (
              <option key={c.id} value={c.id}>
                {c.libelle}
              </option>
            ))}
          </select>
          <select
            aria-label="Sexe"
            value={filtres.sexe ?? ''}
            onChange={(e) => appliquer({ sexe: (e.target.value || null) as Filtres['sexe'] })}
            className={filtre}
          >
            <option value="">Filles et garçons</option>
            <option value="F">Filles</option>
            <option value="M">Garçons</option>
          </select>
          <select
            aria-label="Statut"
            value={filtres.statut ?? ''}
            onChange={(e) => appliquer({ statut: e.target.value || null })}
            className={filtre}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(LIBELLES_STATUT).map(([cle, libelle]) => (
              <option key={cle} value={cle}>
                {libelle}
              </option>
            ))}
          </select>
          <Bascule
            on={filtres.redoublant === true}
            onClick={() => appliquer({ redoublant: filtres.redoublant ? null : true })}
          >
            Redoublants
          </Bascule>
          <Bascule
            on={Boolean(filtres.incomplet)}
            onClick={() => appliquer({ incomplet: !filtres.incomplet })}
          >
            Dossier incomplet
          </Bascule>
          <span className="ml-auto pl-2 text-leg whitespace-nowrap text-encre-3" aria-live="polite">
            {pagination.total} élève{pagination.total > 1 ? 's' : ''}
          </span>
        </div>

        {nSel > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-bouton bg-encre px-3 py-2.5 text-white">
            <span className="flex-1 text-meta font-bold">
              {nSel} sélectionné{nSel > 1 ? 's' : ''}
            </span>
            {modifiable && (
              <button
                type="button"
                className={actionMasse}
                disabled={validees.length === 0}
                title={
                  validees.length === 0 ? 'Seuls les élèves inscrits changent de classe' : undefined
                }
                onClick={() => {
                  setCible('')
                  setForcer(false)
                  setMotif('')
                  setChangement(true)
                }}
              >
                Changer de classe
              </button>
            )}
            <button
              type="button"
              className={actionMasse}
              disabled={validees.length === 0}
              onClick={() =>
                router.post(
                  '/scolarite/documents',
                  {
                    type: 'certificats',
                    format: 'pdf',
                    inscriptionIds: validees.map((l) => l.inscriptionId),
                    anneeId: annee.id,
                  },
                  { preserveScroll: true }
                )
              }
            >
              Certificats
            </button>
            <button
              type="button"
              className={actionMasse}
              onClick={() =>
                exporter(
                  'xlsx',
                  choisis.map((l) => l.inscriptionId)
                )
              }
            >
              Exporter
            </button>
            <button
              type="button"
              aria-label="Désélectionner"
              onClick={() => setSel({})}
              className="size-9 rounded-[9px]"
            >
              <Icone nom="xmark" />
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-carte border border-bordure bg-white">
          {/* En-tête — bureau */}
          <div
            style={gabarit}
            className="hidden items-center gap-2 bg-entete px-3.5 py-3 text-leg font-semibold text-encre-3 lg:grid"
          >
            <button
              type="button"
              role="checkbox"
              aria-label="Sélectionner toute la page"
              aria-checked={tout}
              onClick={() =>
                setSel((x) => {
                  const o = { ...x }
                  eleves.forEach((l) =>
                    tout ? delete o[l.inscriptionId] : (o[l.inscriptionId] = l)
                  )
                  return o
                })
              }
            >
              <Case coche={tout} />
            </button>
            {visibles.map((c) => (
              <span key={c}>{colonnes.find((x) => x.cle === c)?.libelle}</span>
            ))}
            <span />
          </div>
          {eleves.map((l) => {
            const on = Boolean(sel[l.inscriptionId])
            const nom = `${l.nom.toUpperCase()} ${l.prenoms}`
            return (
              <div
                key={l.inscriptionId}
                className={cx('border-t border-separateur', on ? 'bg-accent-doux' : 'bg-white')}
              >
                {/* Ligne — bureau */}
                <div
                  style={gabarit}
                  className="hidden items-center gap-2 px-3.5 py-2.5 text-meta lg:grid"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={`Sélectionner ${nom}`}
                    onClick={() => basculer(l)}
                  >
                    <Case coche={on} />
                  </button>
                  {visibles.map((c) => (
                    <Cellule key={c} cle={c} l={l} />
                  ))}
                  <Link
                    route="scolarite.fiche"
                    routeParams={{ id: l.id }}
                    aria-label={`Ouvrir la fiche de ${nom}`}
                    className="text-encre-3"
                  >
                    <Icone nom="chevron-right" />
                  </Link>
                </div>
                {/* Ligne — mobile */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 lg:hidden">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={`Sélectionner ${nom}`}
                    onClick={() => basculer(l)}
                    className="-my-2.5 -mr-1.5 -ml-2.5 flex size-11 items-center justify-center"
                  >
                    <Case coche={on} />
                  </button>
                  <Link
                    route="scolarite.fiche"
                    routeParams={{ id: l.id }}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left hover:no-underline"
                  >
                    <Avatar nom={`${l.prenoms} ${l.nom}`} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-corps font-bold text-encre">{nom}</span>
                      <span className="text-leg text-encre-3">
                        {l.matricule} · {l.classe ?? `${l.niveau}, à affecter`}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <Pastille etat={etatStatut(l.statut)} taille="petite">
                        {libelleStatut(l.statut)}
                      </Pastille>
                      {l.incomplet && (
                        <span className="text-micro font-semibold text-erreur">Incomplet</span>
                      )}
                    </span>
                  </Link>
                </div>
              </div>
            )
          })}
          {eleves.length === 0 && (
            <div className="flex flex-col items-center gap-2.5 p-7">
              <Illustration nom="vide" largeur={150} hauteur={110} />
              <span className="text-corps font-bold">Aucun élève ne correspond aux filtres</span>
            </div>
          )}
        </div>

        <Pagination pagination={pagination} aller={aller} />
      </div>

      <Feuille
        ouverte={changement}
        titre="Changer de classe"
        texte={`${validees.length} élève(s) inscrit(s) seront affectés à la classe choisie. L’affectation est refusée si la capacité est atteinte (RG7).`}
        lignes={classeCible ? [['Classe cible', occupation(classeCible)]] : undefined}
        libelleConfirmer="Changer de classe"
        onFermer={() => setChangement(false)}
        onConfirmer={() => {
          if (!cible) return
          router.post(
            '/scolarite/inscriptions/changer-classe',
            {
              inscriptionIds: validees.map((l) => l.inscriptionId),
              classeId: cible,
              ...(forcer ? { forcer: true, motifDepassement: motif } : {}),
            },
            {
              preserveScroll: true,
              onSuccess: () => {
                setChangement(false)
                setSel({})
              },
            }
          )
        }}
      >
        <Selection
          libelle="Classe cible"
          value={cible}
          onChange={(e) => setCible(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">— Choisir —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.libelle} · {occupation(c)}
              {estPleine(c, validees.length) ? ' · capacité dépassée' : ''}
            </option>
          ))}
        </Selection>
        {direction && classeCible && estPleine(classeCible, validees.length) && (
          <div className="flex flex-col gap-2 rounded-bouton bg-attention-fond p-3 text-meta text-attention">
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={forcer}
                onChange={(e) => setForcer(e.target.checked)}
                className="accent-accent"
              />
              Forcer le dépassement de capacité (direction)
            </label>
            {forcer && (
              <textarea
                aria-label="Motif du dépassement (journalisé)"
                rows={2}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Motif du dépassement (journalisé)"
                className="rounded-champ border border-bordure-champ bg-white p-2 text-encre"
              />
            )}
          </div>
        )}
      </Feuille>
    </Coque>
  )
}

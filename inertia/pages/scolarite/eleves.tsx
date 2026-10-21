import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Pastille from '~/components/ui/pastille'
import Illustration from '~/components/ui/illustration'
import { notifier } from '~/components/ui/toast'
import { useFeuille } from '~/components/ui/feuille'
import { cx } from '~/lib/format'
import { TOUS, type Eleve } from '~/demo/donnees'
import { estIncomplet, etatStatut } from '~/demo/scolarite'
import { journaliser, useDemo } from '~/demo/store'
import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'

const COLONNES = 'grid-cols-[40px_minmax(200px,2fr)_120px_70px_60px_110px_100px_32px]'
const bouton =
  'h-11 rounded-bouton border border-bordure-champ bg-white px-3.5 text-meta font-semibold text-encre-2'
const filtre = 'h-9 shrink-0 rounded-champ border border-bordure-champ bg-white px-2 text-meta'

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

export default function ListeEleves() {
  const st = useDemo()
  const { props } = usePage()
  const auteur = props.user?.fullName ?? ''
  const [feuille, ouvrir] = useFeuille()
  const [q, setQ] = useState('')
  const [classe, setClasse] = useState('Toutes')
  const [statut, setStatut] = useState('Tous')
  const [redoublants, setRedoublants] = useState(false)
  const [incomplets, setIncomplets] = useState(false)
  const [sel, setSel] = useState<Record<string, boolean>>({})

  const r = q.trim().toLowerCase()
  const liste = TOUS.filter(
    (s) =>
      (!r || `${s.nom} ${s.prenom} ${s.matricule}`.toLowerCase().includes(r)) &&
      (classe === 'Toutes' || s.classe === classe) &&
      (statut === 'Tous' || s.statut === statut) &&
      (!redoublants || s.redoublant) &&
      (!incomplets || estIncomplet(st, s))
  )
  const nSel = Object.values(sel).filter(Boolean).length
  const tout = liste.length > 0 && liste.every((s) => sel[s.id])
  const basculer = (s: Eleve) => setSel((x) => ({ ...x, [s.id]: !x[s.id] }))
  const ouvrirFiche = (s: Eleve) => router.visit(`/scolarite/eleves/${s.id}`)

  return (
    <Coque espace="scolarite" titre="Liste des élèves">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-11 min-w-[220px] flex-1 items-center gap-2.5 rounded-bouton border border-bordure-champ bg-white px-3.5">
            <Icone nom="magnifying-glass" className="text-accent" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, prénom ou matricule"
              aria-label="Rechercher"
              className="min-w-0 flex-1 border-none bg-transparent text-corps outline-none"
            />
          </div>
          <button
            type="button"
            className={bouton}
            onClick={() =>
              notifier('Import Excel : rapport d’erreurs à valider avant enregistrement')
            }
          >
            <Icone nom="file-import" className="mr-1.5" />
            Importer
          </button>
          <button
            type="button"
            className={bouton}
            onClick={() => notifier('Liste exportée en Excel — colonnes visibles uniquement')}
          >
            <Icone nom="reg-file-excel" className="mr-1.5" />
            Excel
          </button>
          <button
            type="button"
            className={bouton}
            onClick={() => notifier('Liste exportée en PDF')}
          >
            <Icone nom="reg-file-pdf" className="mr-1.5" />
            PDF
          </button>
        </div>

        <div className="scroll-masque flex items-center gap-2 overflow-x-auto">
          <select
            aria-label="Classe"
            value={classe}
            onChange={(e) => setClasse(e.target.value)}
            className={filtre}
          >
            {['Toutes', '3e A', '4e A', '6e B'].map((c) => (
              <option key={c} value={c}>
                {c === 'Toutes' ? 'Toutes les classes' : c}
              </option>
            ))}
          </select>
          <select
            aria-label="Statut"
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className={filtre}
          >
            {['Tous', 'Inscrit', 'Transféré'].map((c) => (
              <option key={c} value={c}>
                {c === 'Tous' ? 'Tous les statuts' : c}
              </option>
            ))}
          </select>
          <Bascule on={redoublants} onClick={() => setRedoublants((v) => !v)}>
            Redoublants
          </Bascule>
          <Bascule on={incomplets} onClick={() => setIncomplets((v) => !v)}>
            Dossier incomplet
          </Bascule>
          <span className="ml-auto pl-2 text-leg whitespace-nowrap text-encre-3">
            {liste.length} élève{liste.length > 1 ? 's' : ''}
          </span>
        </div>

        {nSel > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-bouton bg-encre px-3 py-2.5 text-white">
            <span className="flex-1 text-meta font-bold">
              {nSel} sélectionné{nSel > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              className="h-9 rounded-[9px] bg-white/14 px-3 text-meta font-semibold"
              onClick={() =>
                ouvrir({
                  titre: 'Changer de classe',
                  texte: `${nSel} élève(s) seront affectés à la 4e A. L’affectation est refusée si la capacité est atteinte (RG7).`,
                  lignes: [['Classe cible', '4e A · 31 / 40']],
                  libelleConfirmer: 'Changer de classe',
                  onConfirmer: () => {
                    journaliser(auteur, 'Changement de classe', `${nSel} élève(s)`, '—', '4e A')
                    setSel({})
                    notifier(`Classe mise à jour pour ${nSel} élève(s)`)
                  },
                })
              }
            >
              Changer de classe
            </button>
            <button
              type="button"
              className="h-9 rounded-[9px] bg-white/14 px-3 text-meta font-semibold"
              onClick={() => notifier(`${nSel} certificat(s) de scolarité générés (PDF)`)}
            >
              Certificats
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
            className={cx(
              'hidden items-center gap-2 bg-entete px-3.5 py-3 text-leg font-semibold text-encre-3 lg:grid',
              COLONNES
            )}
          >
            <button
              type="button"
              aria-label="Tout sélectionner"
              aria-pressed={tout}
              onClick={() => {
                const o = { ...sel }
                liste.forEach((x) => (o[x.id] = !tout))
                setSel(o)
              }}
            >
              <Case coche={tout} />
            </button>
            <span>Élève</span>
            <span>Matricule</span>
            <span>Classe</span>
            <span>Sexe</span>
            <span>Statut</span>
            <span>Dossier</span>
            <span />
          </div>
          {liste.map((s) => {
            const on = !!sel[s.id]
            const inc = estIncomplet(st, s)
            return (
              <div
                key={s.id}
                className={cx('border-t border-separateur', on ? 'bg-accent-doux' : 'bg-white')}
              >
                {/* Ligne — bureau */}
                <div
                  className={cx(
                    'hidden items-center gap-2 px-3.5 py-2.5 text-meta lg:grid',
                    COLONNES
                  )}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={`Sélectionner ${s.complet}`}
                    onClick={() => basculer(s)}
                  >
                    <Case coche={on} />
                  </button>
                  <button
                    type="button"
                    onClick={() => ouvrirFiche(s)}
                    className="flex min-w-0 items-center gap-2.5 text-left"
                  >
                    <span
                      className={cx(
                        'flex size-8 shrink-0 items-center justify-center rounded-full text-micro font-bold',
                        s.avatar
                      )}
                    >
                      {s.initiales}
                    </span>
                    <span className="truncate font-semibold text-encre">
                      {s.nomU} {s.prenom}
                    </span>
                  </button>
                  <span className="text-encre-2">{s.matricule}</span>
                  <span>{s.classe}</span>
                  <span>{s.sexe}</span>
                  <Pastille etat={etatStatut(s)} taille="moyenne" className="justify-self-start">
                    {s.statut}
                  </Pastille>
                  <span className={cx('font-semibold', inc ? 'text-erreur' : 'text-succes')}>
                    {inc ? 'Incomplet' : 'Complet'}
                  </span>
                  <button
                    type="button"
                    aria-label="Ouvrir la fiche"
                    onClick={() => ouvrirFiche(s)}
                    className="text-encre-3"
                  >
                    <Icone nom="chevron-right" />
                  </button>
                </div>
                {/* Ligne — mobile */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 lg:hidden">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={`Sélectionner ${s.complet}`}
                    onClick={() => basculer(s)}
                    className="-my-2.5 -mr-1.5 -ml-2.5 flex size-11 items-center justify-center"
                  >
                    <Case coche={on} />
                  </button>
                  <button
                    type="button"
                    onClick={() => ouvrirFiche(s)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <span
                      className={cx(
                        'flex size-[38px] shrink-0 items-center justify-center rounded-full text-leg font-bold',
                        s.avatar
                      )}
                    >
                      {s.initiales}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-corps font-bold text-encre">
                        {s.nomU} {s.prenom}
                      </span>
                      <span className="text-leg text-encre-3">
                        {s.matricule} · {s.classe}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <Pastille etat={etatStatut(s)} taille="petite">
                        {s.statut}
                      </Pastille>
                      {inc && (
                        <span className="text-micro font-semibold text-erreur">Incomplet</span>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            )
          })}
          {liste.length === 0 && (
            <div className="flex flex-col items-center gap-2.5 p-7">
              <Illustration nom="vide" largeur={150} hauteur={110} />
              <span className="text-corps font-bold">Aucun élève ne correspond aux filtres</span>
            </div>
          )}
        </div>
      </div>
      {feuille}
    </Coque>
  )
}

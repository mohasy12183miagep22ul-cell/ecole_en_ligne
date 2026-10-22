import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Champ, { Selection } from '~/components/ui/champ'
import EtatVide from '~/components/ui/etat_vide'
import { notifier } from '~/components/ui/toast'
import { cx } from '~/lib/format'
import { type NomIcone } from '~/lib/icones'
import { Form } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { useState } from 'react'

type Niveau = { id: number; code: string; libelle: string; ordre: number; cycle: string }
type Matiere = { id: number; code: string; libelle: string; famille: string; noteMaxDefaut: number }
type Coefficient = { niveauId: number; matiereId: number; coefficient: number }

const FAMILLES: Record<string, string> = {
  litteraire: 'Littéraire',
  scientifique: 'Scientifique',
  langue: 'Langue',
  artistique: 'Artistique',
  sportive: 'Sportive',
}
const ICONES: Record<string, NomIcone> = {
  FR: 'book-open',
  MA: 'square-root-variable',
  AN: 'language',
  HG: 'earth-africa',
  SVT: 'leaf',
  PC: 'flask',
  EPS: 'person-running',
}

/** Valeur affichée : « 2 », « 1,5 ». */
const affiche = (c?: number) => (c === undefined ? '' : String(c).replace('.', ','))

/**
 * Cellule de coefficient : enregistrée à la sortie du champ (RG3). Vide =
 * matière retirée du programme du niveau.
 */
function Cellule({
  niveau,
  matiere,
  valeur,
}: {
  niveau: Niveau
  matiere: Matiere
  valeur?: number
}) {
  const [saisie, setSaisie] = useState(affiche(valeur))
  const [erreur, setErreur] = useState(false)

  const enregistrer = () => {
    const brut = saisie.trim().replace(',', '.')
    const coefficient = brut === '' ? null : Number(brut)
    if (coefficient !== null && !(coefficient > 0 && coefficient <= 20)) {
      setErreur(true)
      notifier('Coefficient invalide : nombre entre 0 et 20.', true)
      return
    }
    if (coefficient === (valeur ?? null)) return
    router.put(
      '/admin/coefficients',
      { niveauId: niveau.id, matiereId: matiere.id, coefficient },
      {
        preserveScroll: true,
        onSuccess: () =>
          notifier(
            coefficient === null
              ? `${matiere.libelle} retirée du programme de ${niveau.libelle}`
              : `Coefficient ${matiere.libelle} · ${niveau.libelle} enregistré`
          ),
      }
    )
  }

  return (
    <input
      inputMode="decimal"
      aria-label={`Coefficient ${matiere.libelle} en ${niveau.libelle}`}
      aria-invalid={erreur || undefined}
      placeholder="—"
      value={saisie}
      onChange={(e) => {
        setSaisie(e.target.value)
        setErreur(false)
      }}
      onBlur={enregistrer}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className={cx(
        'h-[38px] w-full rounded-[9px] border text-center text-moyen font-bold outline-none focus:border-accent focus:bg-white',
        erreur ? 'border-danger bg-erreur-champ' : 'border-bordure-champ bg-champ'
      )}
    />
  )
}

export default function Structure({
  niveaux,
  matieres,
  coefficients,
}: {
  niveaux: Niveau[]
  matieres: Matiere[]
  coefficients: Coefficient[]
}) {
  const [ajout, setAjout] = useState<'niveau' | 'matiere' | null>(null)
  const coef = (n: number, m: number) =>
    coefficients.find((c) => c.niveauId === n && c.matiereId === m)?.coefficient
  // Défilement horizontal interne à la carte seulement, quand les niveaux sont nombreux.
  const colonnes = {
    gridTemplateColumns: `minmax(150px,1fr) repeat(${niveaux.length}, 52px)`,
    minWidth: 150 + niveaux.length * 58 + 28,
  }

  return (
    <Coque espace="admin" titre="Niveaux, matières et coefficients">
      <div className="flex max-w-[880px] flex-col gap-3">
        <div className="flex gap-2.5 rounded-bouton bg-info-fond px-3.5 py-3 text-meta leading-[1.45] text-info-fort">
          <Icone nom="circle-info" className="mt-0.5" />
          Le coefficient appartient au couple niveau + matière, jamais à la matière seule. Laissez
          une case vide pour retirer la matière du programme du niveau.
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {(['niveau', 'matiere'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-expanded={ajout === t}
              onClick={() => setAjout(ajout === t ? null : t)}
              className="h-10 rounded-champ border border-accent bg-white px-3.5 text-meta font-bold text-accent"
            >
              <Icone nom={ajout === t ? 'xmark' : 'plus'} className="mr-1.5" />
              {t === 'niveau' ? 'Ajouter un niveau' : 'Ajouter une matière'}
            </button>
          ))}
        </div>

        {ajout === 'niveau' && (
          <Form
            route="admin.niveaux.store"
            onSuccess={() => setAjout(null)}
            className="flex flex-col gap-3.5 rounded-carte border border-bordure bg-white p-5"
          >
            {({ errors, processing }) => (
              <>
                <span className="text-titre-carte font-extrabold">Nouveau niveau</span>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3.5">
                  <Champ
                    libelle="Code *"
                    name="code"
                    placeholder="TLE-A"
                    erreur={errors.code && 'Code obligatoire et unique.'}
                  />
                  <Champ
                    libelle="Libellé *"
                    name="libelle"
                    placeholder="Terminale A"
                    erreur={errors.libelle && 'Libellé obligatoire.'}
                  />
                  <Champ
                    libelle="Ordre *"
                    name="ordre"
                    type="number"
                    min={1}
                    defaultValue={niveaux.length + 1}
                    erreur={errors.ordre && 'Nombre entre 1 et 99.'}
                  />
                  <Selection libelle="Cycle" name="cycle" defaultValue="college">
                    <option value="primaire">Primaire</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                  </Selection>
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="h-11 self-start rounded-bouton bg-accent px-4 text-corps font-bold text-white disabled:opacity-60"
                >
                  Créer le niveau
                </button>
              </>
            )}
          </Form>
        )}

        {ajout === 'matiere' && (
          <Form
            route="admin.matieres.store"
            onSuccess={() => setAjout(null)}
            className="flex flex-col gap-3.5 rounded-carte border border-bordure bg-white p-5"
          >
            {({ errors, processing }) => (
              <>
                <span className="text-titre-carte font-extrabold">Nouvelle matière</span>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3.5">
                  <Champ
                    libelle="Code *"
                    name="code"
                    placeholder="ART"
                    erreur={errors.code && 'Code obligatoire et unique.'}
                  />
                  <Champ
                    libelle="Libellé *"
                    name="libelle"
                    placeholder="Arts plastiques"
                    erreur={errors.libelle && 'Libellé obligatoire.'}
                  />
                  <Selection libelle="Famille" name="famille" defaultValue="litteraire">
                    {Object.entries(FAMILLES).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Selection>
                  <Champ
                    libelle="Note maximale"
                    name="noteMaxDefaut"
                    type="number"
                    min={1}
                    defaultValue={20}
                    erreur={errors.noteMaxDefaut && 'Nombre entre 1 et 100.'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="h-11 self-start rounded-bouton bg-accent px-4 text-corps font-bold text-white disabled:opacity-60"
                >
                  Créer la matière
                </button>
              </>
            )}
          </Form>
        )}

        {niveaux.length === 0 || matieres.length === 0 ? (
          <EtatVide
            icone="sitemap"
            titre="Structure à compléter"
            texte="Créez au moins un niveau et une matière pour définir les coefficients."
          />
        ) : (
          <div className="overflow-x-auto rounded-carte border border-bordure bg-white">
            <div
              style={colonnes}
              className="grid items-center gap-1.5 bg-entete px-3.5 py-3 text-leg font-bold text-encre-3"
            >
              <span>Matière</span>
              {niveaux.map((n) => (
                <span key={n.id} className="text-center">
                  {n.libelle}
                </span>
              ))}
            </div>
            {matieres.map((m) => (
              <div
                key={m.id}
                style={colonnes}
                className="grid items-center gap-1.5 border-t border-separateur px-3.5 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Icone nom={ICONES[m.code] ?? 'book'} className="w-[18px] text-accent" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-corps font-semibold">{m.libelle}</span>
                    <span className="text-micro text-encre-3">
                      {m.code} · {FAMILLES[m.famille] ?? m.famille}
                    </span>
                  </span>
                </div>
                {niveaux.map((n) => (
                  <Cellule
                    key={`${n.id}-${m.id}-${coef(n.id, m.id) ?? ''}`}
                    niveau={n}
                    matiere={m}
                    valeur={coef(n.id, m.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Coque>
  )
}

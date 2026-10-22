import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import EtatVide from '~/components/ui/etat_vide'
import Pastille from '~/components/ui/pastille'
import { useFeuille } from '~/components/ui/feuille'
import { cx } from '~/lib/format'
import { router } from '@inertiajs/react'
import { useRef, useState } from 'react'

type Rapport = {
  id: number
  fichier: string
  etat: 'analyse' | 'accepte' | 'abandonne'
  valides: number
  lignes: Array<{
    ligne: number
    matricule: string | null
    nom: string
    prenoms: string
    classe: string
    tuteur: string
  }>
  erreurs: Array<{ ligne: number; colonne: string; message: string }>
}

const carte = 'flex flex-col gap-3 rounded-carte border border-bordure bg-white p-5'
const contour =
  'flex h-11 items-center rounded-bouton border border-bordure-champ bg-white px-4 text-corps font-semibold text-encre-2 hover:no-underline'

/**
 * Import initial des élèves (§ 4) : modèle fourni, analyse, rapport d'erreurs
 * ligne par ligne. Rien n'est enregistré tant que le rapport n'est pas accepté.
 */
export default function ImportEleves({
  annee,
  colonnes,
  rapport,
}: {
  annee: { id: number; libelle: string } | null
  colonnes: string[]
  rapport: Rapport | null
}) {
  const champ = useRef<HTMLInputElement>(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [feuille, ouvrir] = useFeuille()

  if (!annee) {
    return (
      <Coque espace="scolarite" titre="Import des élèves">
        <EtatVide
          icone="calendar-days"
          titre="Aucune année scolaire active"
          texte="L’import se fait sur l’année active."
        />
      </Coque>
    )
  }

  const analyser = (fichier: File) => {
    if (!fichier.name.toLowerCase().endsWith('.xlsx'))
      return setErreur('Utilisez le modèle Excel fourni (.xlsx).')
    if (fichier.size > 5 * 1024 * 1024)
      return setErreur('Fichier trop volumineux : 5 Mo au maximum.')
    setErreur('')
    router.post(
      '/scolarite/import',
      { fichier },
      { forceFormData: true, onStart: () => setEnvoi(true), onFinish: () => setEnvoi(false) }
    )
  }

  const enCours = rapport?.etat === 'analyse'

  return (
    <Coque
      espace="scolarite"
      titre="Import des élèves"
      retour={{ href: '/scolarite/eleves', libelle: 'Liste des élèves' }}
    >
      <div className="flex max-w-[880px] flex-col gap-3.5">
        {!enCours && (
          <div className={carte}>
            <span className="text-titre-carte font-extrabold">
              Importer une liste d’élèves · {annee.libelle}
            </span>
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-meta leading-[1.5] text-encre-2">
              <li>
                Téléchargez le modèle et complétez une ligne par élève, sans changer l’ordre des
                colonnes.
              </li>
              <li>
                Déposez le fichier : chaque ligne est contrôlée, rien n’est encore enregistré.
              </li>
              <li>
                Lisez le rapport, puis acceptez : les lignes valides deviennent des dossiers soumis
                à la direction ; les lignes en erreur sont écartées, à corriger et réimporter.
              </li>
            </ol>
            <details className="text-leg text-encre-3">
              <summary className="cursor-pointer font-semibold">Colonnes du modèle</summary>
              <span className="mt-1.5 block">{colonnes.join(' · ')}</span>
            </details>
            <div className="flex flex-wrap gap-2.5">
              <a href="/scolarite/import/modele" className={contour}>
                <Icone nom="download" className="mr-2" />
                Modèle Excel
              </a>
              <input
                ref={champ}
                type="file"
                hidden
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) analyser(f)
                }}
              />
              <button
                type="button"
                disabled={envoi}
                onClick={() => champ.current?.click()}
                className="h-11 rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-60"
              >
                <Icone
                  nom={envoi ? 'spinner' : 'file-import'}
                  className={cx('mr-2', envoi && 'animate-spin')}
                />
                {envoi ? 'Analyse…' : 'Déposer le fichier'}
              </button>
            </div>
            {erreur && (
              <span role="alert" className="text-leg text-erreur">
                {erreur}
              </span>
            )}
          </div>
        )}

        {rapport && (
          <div className={carte}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex-1 text-titre-carte font-extrabold">
                Rapport · {rapport.fichier}
              </span>
              {rapport.etat !== 'analyse' && (
                <Pastille etat={rapport.etat === 'accepte' ? 'succes' : 'verrou'} taille="moyenne">
                  {rapport.etat === 'accepte' ? 'Accepté' : 'Abandonné'}
                </Pastille>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-0.5 rounded-bouton bg-succes-fond p-3 text-succes">
                <span className="text-section-lg font-extrabold">{rapport.valides}</span>
                <span className="text-meta font-semibold">
                  ligne{rapport.valides > 1 ? 's' : ''} valide{rapport.valides > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-bouton bg-erreur-fond p-3 text-erreur">
                <span className="text-section-lg font-extrabold">{rapport.erreurs.length}</span>
                <span className="text-meta font-semibold">
                  erreur{rapport.erreurs.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {rapport.erreurs.length > 0 && (
              <div className="overflow-hidden rounded-bouton border border-bordure">
                <div className="bg-entete px-3.5 py-2 text-micro font-bold tracking-[0.06em] text-encre-3 uppercase">
                  Erreurs · lignes écartées
                </div>
                <ul className="max-h-[320px] overflow-y-auto">
                  {rapport.erreurs.map((e, i) => (
                    <li
                      key={i}
                      className="flex gap-3 border-t border-separateur px-3.5 py-2 text-meta"
                    >
                      <span className="w-16 shrink-0 font-bold">Ligne {e.ligne}</span>
                      <span className="w-32 shrink-0 text-encre-3">{e.colonne}</span>
                      <span className="text-erreur">{e.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rapport.lignes.length > 0 && (
              <div className="overflow-hidden rounded-bouton border border-bordure">
                <div className="bg-entete px-3.5 py-2 text-micro font-bold tracking-[0.06em] text-encre-3 uppercase">
                  Lignes valides
                  {rapport.valides > rapport.lignes.length &&
                    ` · ${rapport.lignes.length} premières`}
                </div>
                <ul className="max-h-[320px] overflow-y-auto">
                  {rapport.lignes.map((l) => (
                    <li
                      key={l.ligne}
                      className="flex flex-wrap gap-x-3 border-t border-separateur px-3.5 py-2 text-meta"
                    >
                      <span className="w-16 shrink-0 text-encre-3">Ligne {l.ligne}</span>
                      <span className="min-w-[160px] flex-1 font-semibold">
                        {l.nom.toUpperCase()} {l.prenoms}
                      </span>
                      <span className="w-16">{l.classe}</span>
                      <span className="text-encre-3">{l.matricule ?? 'matricule à attribuer'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {enCours && (
              <div className="flex flex-wrap justify-end gap-2.5">
                <button
                  type="button"
                  className={contour}
                  onClick={() => router.post(`/scolarite/import/${rapport.id}/abandonner`)}
                >
                  Abandonner
                </button>
                <button
                  type="button"
                  disabled={rapport.valides === 0}
                  onClick={() =>
                    ouvrir({
                      titre: 'Accepter le rapport ?',
                      texte: `${rapport.valides} dossier(s) seront créés et soumis à la validation de la direction. ${rapport.erreurs.length ? 'Les lignes en erreur sont écartées.' : ''}`,
                      libelleConfirmer: 'Importer',
                      onConfirmer: () => router.post(`/scolarite/import/${rapport.id}/accepter`),
                    })
                  }
                  className="h-11 rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-60"
                >
                  Accepter et importer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {feuille}
    </Coque>
  )
}

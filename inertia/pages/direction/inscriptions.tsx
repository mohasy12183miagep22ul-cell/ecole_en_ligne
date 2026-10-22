import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Avatar from '~/components/ui/avatar'
import Feuille, { useFeuille } from '~/components/ui/feuille'
import EtatVide from '~/components/ui/etat_vide'
import Pagination, { type InfosPagination } from '~/components/ui/pagination'
import { Selection } from '~/components/ui/champ'
import { estPleine, occupation, type ClasseEffectif } from '~/lib/scolarite'
import { type Dossier } from '~/pages/scolarite/dossiers'
import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { useState } from 'react'

/** Validation des inscriptions soumises (RG5 à RG8). */
export default function InscriptionsAValider({
  annee,
  classes,
  dossiers,
  pagination,
}: {
  annee: { id: number; libelle: string } | null
  classes: ClasseEffectif[]
  dossiers: Dossier[]
  pagination: InfosPagination
}) {
  const [enCours, setEnCours] = useState<Dossier | null>(null)
  const [classeId, setClasseId] = useState<number | ''>('')
  const [forcer, setForcer] = useState(false)
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')
  const [feuille, ouvrir] = useFeuille()

  if (!annee) {
    return (
      <Coque espace="direction" titre="Inscriptions à valider">
        <EtatVide icone="calendar-days" titre="Aucune année scolaire active" />
      </Coque>
    )
  }

  const classe = classes.find((c) => c.id === classeId)
  const pleine = classe ? estPleine(classe) : false
  const ouvrirValidation = (d: Dossier) => {
    setEnCours(d)
    setClasseId(d.classeId ?? '')
    setForcer(false)
    setMotif('')
    setErreur('')
  }

  return (
    <Coque espace="direction" titre="Inscriptions à valider">
      <div className="flex max-w-[880px] flex-col gap-3">
        <span className="text-leg text-encre-3">
          {pagination.total} dossier{pagination.total > 1 ? 's' : ''} soumis en {annee.libelle}. Un
          dossier ne se valide qu’avec toutes ses pièces obligatoires (RG6) et dans une classe qui a
          de la place (RG7).
        </span>
        {dossiers.map((d) => {
          const complet = d.manquantes.length === 0
          return (
            <div
              key={d.id}
              className="flex flex-wrap items-center gap-3 rounded-carte border border-bordure bg-white px-4 py-3.5"
            >
              <Avatar nom={`${d.prenoms} ${d.nom}`} />
              <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                <Link
                  route="scolarite.fiche"
                  routeParams={{ id: d.eleveId }}
                  className="text-corps font-bold text-encre"
                >
                  {d.nom.toUpperCase()} {d.prenoms}
                </Link>
                <span className="text-leg text-encre-3">
                  {d.matricule} · {d.niveau} ·{' '}
                  {d.classe ? `classe souhaitée ${d.classe}` : 'classe à affecter'}
                  {d.redoublant && ' · redoublant'} · soumis le {d.date}
                  {d.depuis > 0 && ` (${d.depuis} j)`}
                </span>
                {complet ? (
                  <span className="text-leg font-semibold text-succes">
                    <Icone nom="circle-check" className="mr-1" />
                    Dossier complet
                  </span>
                ) : (
                  <span className="text-leg font-semibold text-erreur">
                    Manque : {d.manquantes.join(', ')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    ouvrir({
                      titre: 'Refuser l’inscription',
                      texte: `${d.prenoms} ${d.nom.toUpperCase()} : le dossier sera clos. Le motif est journalisé.`,
                      libelleConfirmer: 'Refuser',
                      danger: true,
                      motif: true,
                      onConfirmer: (m) =>
                        router.post(
                          `/direction/inscriptions/${d.id}/refuser`,
                          { motif: m },
                          { preserveScroll: true }
                        ),
                    })
                  }
                  className="h-10 rounded-champ border border-bordure-champ bg-white px-3.5 text-meta font-semibold text-erreur"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  disabled={!complet}
                  title={complet ? undefined : 'Pièces obligatoires manquantes (RG6)'}
                  onClick={() => ouvrirValidation(d)}
                  className="h-10 rounded-champ bg-accent px-4 text-meta font-bold text-white disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>
          )
        })}
        {dossiers.length === 0 && (
          <EtatVide
            illustration="coches"
            dimensions={[160, 120]}
            titre="Aucune inscription en attente"
          />
        )}
        <Pagination
          pagination={pagination}
          aller={(page) =>
            router.get('/direction/inscriptions', { page }, { preserveScroll: true })
          }
        />
      </div>

      <Feuille
        ouverte={enCours !== null}
        titre="Valider l’inscription"
        texte={
          enCours
            ? `${enCours.prenoms} ${enCours.nom.toUpperCase()} · ${enCours.niveau}. Confirmez ou choisissez la classe.`
            : undefined
        }
        lignes={classe ? [['Effectif de la classe', occupation(classe)]] : undefined}
        libelleConfirmer="Valider l’inscription"
        onFermer={() => setEnCours(null)}
        onConfirmer={() => {
          if (!enCours) return
          if (!classeId) return setErreur('Choisissez la classe.')
          if (pleine && !forcer)
            return setErreur('Classe complète : cochez le forçage et indiquez un motif.')
          if (forcer && motif.trim().length < 5)
            return setErreur('Motif du dépassement : 5 caractères minimum.')
          router.post(
            `/direction/inscriptions/${enCours.id}/valider`,
            { classeId, ...(forcer ? { forcer: true, motifDepassement: motif.trim() } : {}) },
            { preserveScroll: true, onSuccess: () => setEnCours(null) }
          )
        }}
      >
        {enCours && (
          <div className="flex flex-col gap-3">
            <Selection
              libelle="Classe *"
              value={classeId}
              erreur={erreur || undefined}
              onChange={(e) => {
                setClasseId(e.target.value ? Number(e.target.value) : '')
                setErreur('')
              }}
            >
              <option value="">— Choisir —</option>
              {classes
                .filter((c) => c.niveauId === enCours.niveauId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle} · {occupation(c)}
                    {estPleine(c) ? ' · complète' : ''}
                  </option>
                ))}
            </Selection>
            {pleine && (
              <div className="flex flex-col gap-2 rounded-bouton bg-attention-fond p-3 text-meta text-attention">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={forcer}
                    onChange={(e) => setForcer(e.target.checked)}
                    className="accent-accent"
                  />
                  Forcer le dépassement de capacité (RG7)
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
          </div>
        )}
      </Feuille>
      {feuille}
    </Coque>
  )
}

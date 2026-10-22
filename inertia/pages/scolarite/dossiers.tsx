import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Avatar from '~/components/ui/avatar'
import Pastille from '~/components/ui/pastille'
import EtatVide from '~/components/ui/etat_vide'
import Pagination, { type InfosPagination } from '~/components/ui/pagination'
import { LIBELLES_ETAT, etatDossier, type EtatDossier } from '~/lib/scolarite'
import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'

export type Dossier = {
  id: number
  eleveId: number
  matricule: string
  nom: string
  prenoms: string
  sexe: string
  niveauId: number
  niveau: string
  classeId: number | null
  classe: string | null
  etat: EtatDossier
  redoublant: boolean
  origine: string | null
  date: string
  depuis: number
  manquantes: string[]
}

export default function DossiersIncomplets({
  annee,
  dossiers,
  pagination,
}: {
  annee: { id: number; libelle: string } | null
  dossiers: Dossier[]
  pagination: InfosPagination
}) {
  return (
    <Coque espace="scolarite" titre="Dossiers à compléter">
      <div className="flex max-w-[880px] flex-col gap-3">
        {!annee ? (
          <EtatVide icone="calendar-days" titre="Aucune année scolaire active" />
        ) : (
          <>
            {pagination.total > 0 && (
              <div className="flex gap-2.5 rounded-bouton bg-attention-fond px-3.5 py-3 text-meta leading-[1.45] text-attention">
                <Icone nom="triangle-exclamation" className="mt-0.5" />
                <span>
                  {pagination.total} dossier{pagination.total > 1 ? 's' : ''} en {annee.libelle}{' '}
                  avec des pièces manquantes : un dossier incomplet ne peut pas être validé (RG6).
                </span>
              </div>
            )}
            {dossiers.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-3 rounded-carte border border-bordure bg-white px-4 py-3.5"
              >
                <Avatar nom={`${d.prenoms} ${d.nom}`} />
                <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
                  <span className="text-corps font-bold">
                    {d.nom.toUpperCase()} {d.prenoms}{' '}
                    <span className="text-leg font-medium text-encre-3">
                      · {d.classe ?? d.niveau} · {d.matricule} · dossier du {d.date}
                    </span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Pastille etat={etatDossier(d.etat)} taille="petite">
                      {LIBELLES_ETAT[d.etat]}
                    </Pastille>
                    {d.manquantes.map((m) => (
                      <span
                        key={m}
                        className="rounded-[8px] bg-erreur-fond px-2 py-1 text-leg font-semibold text-erreur"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  route="scolarite.fiche"
                  routeParams={{ id: d.eleveId }}
                  qs={{ onglet: 'documents' }}
                  className="flex h-10 items-center rounded-champ border border-accent bg-white px-3.5 text-meta font-bold text-accent hover:no-underline"
                >
                  Compléter
                </Link>
              </div>
            ))}
            {dossiers.length === 0 && (
              <EtatVide
                illustration="coches"
                dimensions={[160, 120]}
                titre="Tous les dossiers sont complets"
              />
            )}
            <Pagination
              pagination={pagination}
              aller={(page) =>
                router.get('/scolarite/dossiers', { page }, { preserveScroll: true })
              }
            />
          </>
        )}
      </div>
    </Coque>
  )
}

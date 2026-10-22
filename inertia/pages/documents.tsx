import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Pastille from '~/components/ui/pastille'
import EtatVide from '~/components/ui/etat_vide'
import { espaceDesRoles } from '~/lib/navigation'
import { router, usePage } from '@inertiajs/react'
import { useEffect } from 'react'

type Fichier = {
  id: number
  libelle: string
  format: 'pdf' | 'xlsx'
  etat: 'en_attente' | 'pret' | 'echec'
  erreur: string | null
  date: string
}

/**
 * « Mes documents » (§ 9) : les documents demandés sont produits en file
 * d'attente ; la page se rafraîchit seule tant qu'un document est en cours.
 */
export default function MesDocuments({ fichiers }: { fichiers: Fichier[] }) {
  const { props } = usePage()
  const enAttente = fichiers.some((f) => f.etat === 'en_attente')

  useEffect(() => {
    if (!enAttente) return
    const t = setInterval(() => router.reload({ only: ['fichiers'] }), 4000)
    return () => clearInterval(t)
  }, [enAttente])

  return (
    <Coque espace={espaceDesRoles(props.user?.roles)} titre="Mes documents">
      <div className="flex max-w-[760px] flex-col gap-3">
        <span className="text-leg text-encre-3">
          Exports, listes, certificats et registres que vous avez demandés. Ils restent
          téléchargeables ici, par vous seul.
        </span>
        {fichiers.length === 0 ? (
          <EtatVide illustration="vide" dimensions={[150, 110]} titre="Aucun document demandé" />
        ) : (
          <ul className="overflow-hidden rounded-carte border border-bordure bg-white">
            {fichiers.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center gap-3 border-t border-separateur px-4 py-3 first:border-t-0"
              >
                <Icone
                  nom={f.format === 'pdf' ? 'reg-file-pdf' : 'reg-file-excel'}
                  className="text-[20px] text-accent"
                />
                <div className="flex min-w-[180px] flex-1 flex-col gap-0.5">
                  <span className="text-corps font-semibold">{f.libelle}</span>
                  <span className="text-leg text-encre-3">
                    Demandé le {f.date} · {f.format.toUpperCase()}
                  </span>
                  {f.erreur && <span className="text-leg text-erreur">{f.erreur}</span>}
                </div>
                {f.etat === 'pret' ? (
                  <a
                    href={`/documents/${f.id}`}
                    className="flex h-9 items-center rounded-[9px] border border-accent bg-white px-3 text-meta font-bold text-accent hover:no-underline"
                  >
                    <Icone nom="download" className="mr-1.5" />
                    Télécharger
                  </a>
                ) : (
                  <Pastille
                    etat={f.etat === 'echec' ? 'erreur' : 'info'}
                    taille="moyenne"
                    icone={f.etat === 'echec' ? 'circle-exclamation' : 'hourglass-half'}
                  >
                    {f.etat === 'echec' ? 'Échec' : 'En préparation'}
                  </Pastille>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Coque>
  )
}

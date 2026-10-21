import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import EtatVide from '~/components/ui/etat_vide'
import { notifier } from '~/components/ui/toast'
import { type NomIcone } from '~/lib/icones'
import { espaceDesRoles, LIBELLES_ROLES } from '~/lib/navigation'
import { router, usePage } from '@inertiajs/react'
import { type JSONDataTypes } from '@adonisjs/core/types/transformers'

type Valeurs = { [cle: string]: JSONDataTypes } | null

type Entree = {
  id: number
  action: string
  entite: string
  entiteId: string | null
  avant: Valeurs
  apres: Valeurs
  ip: string | null
  auteur: string
  date: string
}

const icone = (action: string): NomIcone =>
  /Connexion|verrouillé/i.test(action)
    ? 'right-to-bracket'
    : /Publication|rectificatif/.test(action)
      ? 'file-export'
      : /Validation/.test(action)
        ? 'circle-check'
        : /Déverrouillage|Dérogation/.test(action)
          ? 'unlock'
          : /rôle|Compte/.test(action)
            ? 'user-shield'
            : /mot de passe/i.test(action)
              ? 'shield-halved'
              : 'pen'

const ENTITES: Record<string, string> = { users: 'Compte' }

/** Valeur lisible : rôles traduits, booléens en clair. */
const lisible = (v: unknown): string =>
  Array.isArray(v)
    ? v.map((x) => LIBELLES_ROLES[String(x)] ?? String(x)).join(', ')
    : typeof v === 'boolean'
      ? v
        ? 'oui'
        : 'non'
      : String(v)

const resume = (valeurs: Valeurs) =>
  valeurs
    ? Object.entries(valeurs)
        .map(([k, v]) =>
          k === 'roles' || k === 'actif' || k === 'essais' ? lisible(v) : `${k} : ${lisible(v)}`
        )
        .join(' · ')
    : ''

/** Journal d'activité (RG22) : lecture seule, jamais effaçable depuis l'application. */
export default function Journal({
  entrees,
  pagination,
}: {
  entrees: Entree[]
  pagination: { page: number; dernierePage: number; total: number }
}) {
  const { props } = usePage()
  const aller = (page: number) => router.get('/admin/journal', { page }, { preserveScroll: true })

  return (
    <Coque espace={espaceDesRoles(props.user?.roles)} titre="Journal d’activité">
      <div className="flex max-w-[880px] flex-col gap-3">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-leg text-encre-3">
            <Icone nom="lock" className="mr-1.5" />
            Journal non modifiable · {pagination.total} entrée{pagination.total > 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={() => notifier('L’export Excel du journal arrive avec le lot 5.')}
            className="h-[38px] rounded-champ border border-bordure-champ bg-white px-3 text-meta font-semibold text-encre-2"
          >
            <Icone nom="reg-file-excel" className="mr-1.5" />
            Exporter
          </button>
        </div>

        {entrees.length === 0 ? (
          <EtatVide icone="clock-rotate-left" titre="Aucune opération journalisée" />
        ) : (
          <ol className="overflow-hidden rounded-carte border border-bordure bg-white">
            {entrees.map((l) => {
              const avant = resume(l.avant)
              const apres = resume(l.apres)
              return (
                <li key={l.id} className="flex gap-3 border-b border-separateur px-4 py-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-champ bg-accent-doux text-accent">
                    <Icone nom={icone(l.action)} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="text-corps font-bold">{l.action}</span>
                    <span className="text-meta text-encre-2">
                      {ENTITES[l.entite] ?? l.entite}
                      {l.entiteId && ` n°${l.entiteId}`}
                    </span>
                    {(avant || apres) && (
                      <span className="text-leg break-words text-encre-3">
                        {avant && <>{avant} → </>}
                        <strong className="text-encre">{apres}</strong>
                      </span>
                    )}
                    <span className="text-leg text-encre-4">
                      {l.auteur} · {l.date}
                      {l.ip && ` · IP ${l.ip}`}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        {pagination.dernierePage > 1 && (
          <nav
            aria-label="Pagination"
            className="flex items-center justify-between gap-3 text-meta"
          >
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => aller(pagination.page - 1)}
              className="h-9 rounded-champ border border-bordure-champ bg-white px-3 font-semibold disabled:opacity-40"
            >
              <Icone nom="arrow-left" className="mr-1.5" />
              Plus récentes
            </button>
            <span className="text-encre-3">
              Page {pagination.page} / {pagination.dernierePage}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.dernierePage}
              onClick={() => aller(pagination.page + 1)}
              className="h-9 rounded-champ border border-bordure-champ bg-white px-3 font-semibold disabled:opacity-40"
            >
              Plus anciennes
              <Icone nom="arrow-right" className="ml-1.5" />
            </button>
          </nav>
        )}
      </div>
    </Coque>
  )
}

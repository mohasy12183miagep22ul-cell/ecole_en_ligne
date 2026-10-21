import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Champ from '~/components/ui/champ'
import Pastille from '~/components/ui/pastille'
import Interrupteur from '~/components/ui/interrupteur'
import { notifier } from '~/components/ui/toast'
import { cx } from '~/lib/format'
import { LIBELLES_ROLES } from '~/lib/navigation'
import { Form } from '@adonisjs/inertia/react'
import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'

const ROLES = Object.keys(LIBELLES_ROLES)

type Compte = {
  id: number
  fullName: string | null
  email: string
  sousTitre: string | null
  initials: string
  actif: boolean
  roles: string[]
  verrouille: boolean
  doitChangerMotDePasse: boolean
}

/** Pastilles de rôles cochables ; les rôles cochés partent en champs cachés `roles[]`. */
function ChoixRoles({
  valeur,
  onChange,
  erreur,
}: {
  valeur: string[]
  onChange: (r: string[]) => void
  erreur?: string
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-meta font-semibold text-encre-2">Rôles</legend>
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => {
          const on = valeur.includes(r)
          return (
            <button
              key={r}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onChange(on ? valeur.filter((x) => x !== r) : [...valeur, r])}
              className={cx(
                'flex h-9 items-center gap-1.5 rounded-full border px-3 text-meta font-semibold',
                on
                  ? 'border-accent bg-accent-doux text-accent'
                  : 'border-bordure-champ bg-white text-encre-2'
              )}
            >
              {on && <Icone nom="check" />}
              {LIBELLES_ROLES[r]}
            </button>
          )
        })}
      </div>
      {valeur.map((r) => (
        <input key={r} type="hidden" name="roles[]" value={r} />
      ))}
      {erreur && (
        <span role="alert" className="text-leg text-erreur">
          Choisissez au moins un rôle.
        </span>
      )}
    </fieldset>
  )
}

function LigneCompte({ c, moi }: { c: Compte; moi: boolean }) {
  const [edition, setEdition] = useState(false)
  const [roles, setRoles] = useState(c.roles)

  return (
    <div className="border-b border-separateur px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-[38px] items-center justify-center rounded-full bg-accent-doux text-leg font-bold text-accent">
          {c.initials}
        </span>
        <div className="flex min-w-[170px] flex-1 flex-col gap-1">
          <span className="text-corps font-bold">
            {c.fullName}
            {moi && <span className="ml-1.5 text-leg font-medium text-encre-3">(vous)</span>}
          </span>
          <span className="text-leg break-all text-encre-3">{c.email}</span>
          <div className="flex flex-wrap gap-1.5">
            {c.roles.map((r) => (
              <span
                key={r}
                className="rounded-full bg-neutre px-2 py-[3px] text-micro font-semibold text-encre-2"
              >
                {LIBELLES_ROLES[r] ?? r}
              </span>
            ))}
            {c.verrouille && (
              <Pastille etat="erreur" icone="lock" taille="petite">
                Verrouillé
              </Pastille>
            )}
            {c.doitChangerMotDePasse && (
              <Pastille etat="attention" taille="petite">
                Mot de passe à changer
              </Pastille>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-expanded={edition}
          onClick={() => {
            setRoles(c.roles)
            setEdition((v) => !v)
          }}
          className="h-9 rounded-champ border border-bordure-champ bg-white px-3 text-meta font-semibold text-encre-2"
        >
          Rôles
        </button>
        <div className="flex items-center gap-2">
          <span className={cx('text-leg font-semibold', c.actif ? 'text-succes' : 'text-encre-4')}>
            {c.actif ? 'Actif' : 'Désactivé'}
          </span>
          <Interrupteur
            libelle={`Compte de ${c.fullName} actif`}
            actif={c.actif}
            onChange={(actif) =>
              router.put(`/admin/comptes/${c.id}/activation`, { actif }, { preserveScroll: true })
            }
          />
        </div>
      </div>
      {edition && (
        <div className="mt-3 flex flex-col gap-3 rounded-bouton bg-entete p-3">
          <ChoixRoles valeur={roles} onChange={setRoles} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEdition(false)}
              className="h-10 rounded-champ border border-bordure-champ bg-white px-3.5 text-meta font-semibold text-encre-2"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={roles.length === 0}
              onClick={() =>
                router.put(
                  `/admin/comptes/${c.id}/roles`,
                  { roles },
                  { preserveScroll: true, onSuccess: () => setEdition(false) }
                )
              }
              className="h-10 rounded-champ bg-accent px-4 text-meta font-bold text-white disabled:opacity-50"
            >
              Enregistrer les rôles
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Comptes({
  comptes,
  pagination,
  recherche,
}: {
  comptes: Compte[]
  pagination: { page: number; dernierePage: number; total: number }
  recherche: string
}) {
  const { props, flash } = usePage()
  const [creation, setCreation] = useState(false)
  const [rolesNouveau, setRolesNouveau] = useState<string[]>([])
  const cree = flash.compteCree

  const aller = (page: number) =>
    router.get('/admin/comptes', { page, q: recherche || undefined }, { preserveScroll: true })

  return (
    <Coque espace="admin" titre="Comptes et rôles">
      <div className="flex max-w-[880px] flex-col gap-3">
        {cree && (
          <div
            role="status"
            className="flex flex-col gap-2 rounded-bouton bg-succes-fond px-4 py-3 text-meta text-succes"
          >
            <span className="font-bold">
              <Icone nom="circle-check" className="mr-1.5" />
              Compte créé pour {cree.email}
            </span>
            <span>
              Mot de passe provisoire, affiché une seule fois — à transmettre à la personne, qui
              devra le changer à sa première connexion :
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-champ bg-white px-3 py-1.5 text-moyen font-bold tracking-wider text-encre">
                {cree.motDePasse}
              </code>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard
                    ?.writeText(cree.motDePasse)
                    .then(() => notifier('Mot de passe copié'))
                }
                className="h-9 rounded-champ border border-succes bg-white px-3 font-semibold"
              >
                <Icone nom="reg-copy" className="mr-1.5" />
                Copier
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <form
            role="search"
            className="flex h-11 min-w-[220px] flex-1 items-center gap-2.5 rounded-bouton border border-bordure-champ bg-white px-3.5"
            onSubmit={(e) => {
              e.preventDefault()
              const q = new FormData(e.currentTarget).get('q')
              router.get('/admin/comptes', { q: q || undefined })
            }}
          >
            <Icone nom="magnifying-glass" className="text-accent" />
            <input
              name="q"
              defaultValue={recherche}
              placeholder="Nom ou adresse e-mail"
              aria-label="Rechercher un compte"
              className="min-w-0 flex-1 border-none bg-transparent text-corps outline-none"
            />
          </form>
          <button
            type="button"
            aria-expanded={creation}
            onClick={() => setCreation((v) => !v)}
            className="h-[42px] rounded-champ border border-accent bg-white px-4 text-corps font-bold text-accent"
          >
            <Icone nom={creation ? 'xmark' : 'plus'} className="mr-2" />
            {creation ? 'Fermer' : 'Créer un compte'}
          </button>
        </div>

        {creation && (
          <Form
            route="admin.comptes.store"
            onSuccess={() => {
              setCreation(false)
              setRolesNouveau([])
            }}
            className="flex flex-col gap-4 rounded-carte border border-bordure bg-white p-5"
          >
            {({ errors, processing }) => (
              <>
                <span className="text-titre-carte font-extrabold">Nouveau compte</span>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
                  <Champ
                    libelle="Nom complet *"
                    name="fullName"
                    autoComplete="off"
                    erreur={errors.fullName && 'Le nom est obligatoire (2 caractères minimum).'}
                  />
                  <Champ
                    libelle="Adresse e-mail *"
                    name="email"
                    type="email"
                    autoComplete="off"
                    erreur={
                      errors.email &&
                      (errors.email.includes('taken') || errors.email.includes('already')
                        ? 'Cette adresse est déjà utilisée par un compte.'
                        : 'Adresse e-mail invalide.')
                    }
                  />
                </div>
                <Champ
                  libelle="Fonction (facultatif)"
                  name="sousTitre"
                  placeholder="Ex. Mathématiques · PP 3e A"
                />
                <ChoixRoles
                  valeur={rolesNouveau}
                  onChange={setRolesNouveau}
                  erreur={errors.roles}
                />
                <span className="text-leg text-encre-3">
                  Un mot de passe provisoire est généré ; il devra être changé à la première
                  connexion. Les comptes direction et administrateur ont le second facteur activé.
                </span>
                <button
                  type="submit"
                  disabled={processing}
                  className="h-[46px] self-start rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-60"
                >
                  Créer le compte
                </button>
              </>
            )}
          </Form>
        )}

        <div className="overflow-hidden rounded-carte border border-bordure bg-white">
          {comptes.map((c) => (
            <LigneCompte key={c.id} c={c} moi={c.id === props.user?.id} />
          ))}
          {comptes.length === 0 && (
            <p className="p-6 text-center text-corps text-encre-3">Aucun compte ne correspond.</p>
          )}
        </div>

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
              Précédent
            </button>
            <span className="text-encre-3">
              Page {pagination.page} / {pagination.dernierePage} · {pagination.total} comptes
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.dernierePage}
              onClick={() => aller(pagination.page + 1)}
              className="h-9 rounded-champ border border-bordure-champ bg-white px-3 font-semibold disabled:opacity-40"
            >
              Suivant
              <Icone nom="arrow-right" className="ml-1.5" />
            </button>
          </nav>
        )}
      </div>
    </Coque>
  )
}

import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Interrupteur from '~/components/ui/interrupteur'
import { notifier } from '~/components/ui/toast'
import { cx, initiales } from '~/lib/format'
import { journaliser, modifier, useDemo } from '~/demo/store'
import { usePage } from '@inertiajs/react'

export default function Comptes() {
  const st = useDemo()
  const { props } = usePage()

  return (
    <Coque espace="admin" titre="Comptes et rôles">
      <div className="flex max-w-[880px] flex-col gap-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              notifier('Création de compte : mot de passe à changer à la première connexion')
            }
            className="h-[42px] rounded-champ border border-accent bg-white px-4 text-corps font-bold text-accent"
          >
            <Icone nom="plus" className="mr-2" />
            Créer un compte
          </button>
        </div>
        <div className="overflow-hidden rounded-carte border border-bordure bg-white">
          {st.comptes.map((u, i) => (
            <div
              key={u.email}
              className="flex flex-wrap items-center gap-3 border-b border-separateur px-4 py-3"
            >
              <span className="flex size-[38px] items-center justify-center rounded-full bg-accent-doux text-leg font-bold text-accent">
                {initiales(u.nom)}
              </span>
              <div className="flex min-w-[170px] flex-1 flex-col gap-1">
                <span className="text-corps font-bold">{u.nom}</span>
                <span className="text-leg break-all text-encre-3">{u.email}</span>
                <div className="flex flex-wrap gap-1.5">
                  {u.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-neutre px-2 py-[3px] text-micro font-semibold text-encre-2"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cx('text-leg font-semibold', u.actif ? 'text-succes' : 'text-encre-4')}
                >
                  {u.actif ? 'Actif' : 'Désactivé'}
                </span>
                <Interrupteur
                  libelle={`Compte de ${u.nom} actif`}
                  actif={u.actif}
                  onChange={() => {
                    modifier((s) => ({
                      comptes: s.comptes.map((x, j) => (j === i ? { ...x, actif: !x.actif } : x)),
                    }))
                    journaliser(
                      props.user?.fullName ?? '',
                      u.actif ? 'Compte désactivé' : 'Compte activé',
                      u.email,
                      u.actif ? 'Actif' : 'Désactivé',
                      u.actif ? 'Désactivé' : 'Actif'
                    )
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Coque>
  )
}

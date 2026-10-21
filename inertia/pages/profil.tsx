import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import { notifier } from '~/components/ui/toast'
import { espaceDesRoles, espaces, LIBELLES_ROLES } from '~/lib/navigation'
import { reinitialiser } from '~/demo/store'
import { Form } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { useState, type ReactNode } from 'react'

const LONGUEUR_MIN = 10
const champ =
  'h-12 rounded-bouton border bg-champ px-3.5 text-moyen outline-none focus:border-accent focus:bg-white'

function Erreur({ id, children }: { id: string; children?: ReactNode }) {
  return children ? (
    <span id={id} role="alert" className="text-leg text-erreur">
      {children}
    </span>
  ) : null
}

export default function Profil({ changementImpose }: { changementImpose: boolean }) {
  const { props } = usePage()
  const u = props.user
  const espace = espaceDesRoles(u?.roles)
  const [nouveau, setNouveau] = useState('')

  return (
    <Coque
      espace={espace}
      titre="Mon profil"
      retour={
        changementImpose
          ? undefined
          : {
              href: espaces[espace].nav[0].href,
              libelle: espaces[espace].libelle,
              surligner: false,
            }
      }
    >
      <div className="flex max-w-[640px] flex-col gap-3.5">
        {changementImpose && (
          <div
            role="alert"
            className="flex gap-2.5 rounded-bouton bg-attention-fond px-3.5 py-3 text-meta leading-[1.45] text-attention"
          >
            <Icone nom="triangle-exclamation" className="mt-0.5" />
            <span>
              Votre compte a été créé par l’administrateur : choisissez votre propre mot de passe
              pour accéder à l’application.
            </span>
          </div>
        )}

        <div className="flex items-center gap-3.5 rounded-carte border border-bordure bg-white p-[18px]">
          <span className="flex size-[60px] items-center justify-center rounded-full bg-accent-doux text-[18px] font-extrabold text-accent">
            {u?.initials}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[18px] font-extrabold">{u?.fullName}</span>
            <span className="text-meta break-all text-encre-3">{u?.email}</span>
            <div className="flex flex-wrap gap-1.5">
              {(u?.roles ?? []).map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-accent-doux px-2 py-[3px] text-micro font-bold text-accent"
                >
                  {LIBELLES_ROLES[r] ?? r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Form
          route="profil.mot_de_passe"
          resetOnSuccess
          onSuccess={() => setNouveau('')}
          className="flex flex-col gap-3.5 rounded-carte border border-bordure bg-white p-[18px]"
        >
          {({ errors, processing }) => (
            <>
              <span className="text-moyen font-bold">Changer de mot de passe</span>
              <label className="flex flex-col gap-1.5">
                <span className="text-meta font-semibold">Mot de passe actuel</span>
                <input
                  name="actuel"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={errors.actuel ? true : undefined}
                  aria-describedby={errors.actuel ? 'err-actuel' : undefined}
                  className={`${champ} ${errors.actuel ? 'border-danger' : 'border-bordure-champ'}`}
                />
                <Erreur id="err-actuel">
                  {errors.actuel &&
                    (errors.actuel.includes('incorrect')
                      ? errors.actuel
                      : 'Saisissez votre mot de passe actuel.')}
                </Erreur>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-meta font-semibold">Nouveau mot de passe</span>
                <input
                  name="nouveau"
                  type="password"
                  autoComplete="new-password"
                  value={nouveau}
                  onChange={(e) => setNouveau(e.target.value)}
                  aria-invalid={errors.nouveau ? true : undefined}
                  aria-describedby="aide-nouveau"
                  className={`${champ} ${errors.nouveau ? 'border-danger' : 'border-bordure-champ'}`}
                />
                <span
                  id="aide-nouveau"
                  className={
                    nouveau.length >= LONGUEUR_MIN
                      ? 'text-leg text-succes'
                      : 'text-leg text-encre-4'
                  }
                >
                  {nouveau.length} / {LONGUEUR_MIN} caractères minimum
                </span>
                <Erreur id="err-nouveau">
                  {errors.nouveau &&
                    (errors.nouveau.includes('différent')
                      ? errors.nouveau
                      : errors.nouveau.toLowerCase().includes('confirm')
                        ? 'Les deux mots de passe ne correspondent pas.'
                        : `${LONGUEUR_MIN} caractères minimum.`)}
                </Erreur>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-meta font-semibold">Confirmer</span>
                <input
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  className={`${champ} border-bordure-champ`}
                />
              </label>
              <button
                type="submit"
                disabled={processing}
                className="h-[46px] self-start rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-60"
              >
                Enregistrer
              </button>
            </>
          )}
        </Form>

        <div className="flex flex-wrap gap-2.5">
          <Form route="session.destroy" className="flex flex-1">
            <button
              type="submit"
              className="h-12 flex-1 rounded-bouton border border-bordure-champ bg-white text-corps font-semibold text-encre-2"
            >
              <Icone nom="repeat" className="mr-2" />
              Changer de profil (démo)
            </button>
          </Form>
          <Form route="session.destroy" className="flex flex-1">
            <button
              type="submit"
              className="h-12 flex-1 rounded-bouton border border-bordure-danger bg-white text-corps font-bold text-erreur"
            >
              <Icone nom="arrow-right-from-bracket" className="mr-2" />
              Se déconnecter
            </button>
          </Form>
        </div>
        {!changementImpose && (
          <button
            type="button"
            onClick={() => {
              reinitialiser()
              notifier('Données de démonstration réinitialisées')
            }}
            className="self-start py-1 text-meta font-semibold text-accent"
          >
            Réinitialiser les données de démonstration
          </button>
        )}
      </div>
    </Coque>
  )
}

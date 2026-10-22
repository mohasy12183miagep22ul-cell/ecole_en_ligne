import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import { ChampMotDePasse } from '~/components/ui/champ'
import { notifier } from '~/components/ui/toast'
import { espaceDesRoles, espaces, LIBELLES_ROLES } from '~/lib/navigation'
import { reinitialiser } from '~/demo/store'
import { Form } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { useState } from 'react'

const LONGUEUR_MIN = 10
export default function Profil({ changementImpose }: { changementImpose: boolean }) {
  const { props } = usePage()
  const u = props.user
  const espace = espaceDesRoles(u?.roles)
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')

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
          onSuccess={() => {
            setNouveau('')
            setConfirmation('')
          }}
          onError={() => notifier('Mot de passe non enregistré : corrigez le formulaire.', true)}
          className="flex flex-col gap-3.5 rounded-carte border border-bordure bg-white p-[18px]"
        >
          {({ errors, processing }) => {
            const differents = confirmation.length > 0 && confirmation !== nouveau
            return (
              <>
                <span className="text-moyen font-bold">Changer de mot de passe</span>
                <ChampMotDePasse
                  libelle="Mot de passe actuel"
                  name="actuel"
                  autoComplete="current-password"
                  erreur={
                    errors.actuel &&
                    (errors.actuel.includes('incorrect')
                      ? errors.actuel
                      : 'Saisissez votre mot de passe actuel.')
                  }
                />
                <ChampMotDePasse
                  libelle="Nouveau mot de passe"
                  name="nouveau"
                  autoComplete="new-password"
                  value={nouveau}
                  onChange={(e) => setNouveau(e.target.value)}
                  erreur={
                    errors.nouveau &&
                    (errors.nouveau.includes('différent')
                      ? errors.nouveau
                      : `${LONGUEUR_MIN} caractères minimum.`)
                  }
                  aide={
                    <span className={nouveau.length >= LONGUEUR_MIN ? 'text-succes' : undefined}>
                      {nouveau.length} / {LONGUEUR_MIN} caractères minimum
                    </span>
                  }
                />
                <ChampMotDePasse
                  libelle="Confirmer le nouveau mot de passe"
                  name="confirmation"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  erreur={
                    differents || (errors as Record<string, string | undefined>).confirmation
                      ? 'Les deux mots de passe ne correspondent pas.'
                      : undefined
                  }
                  aide={
                    confirmation.length > 0 && !differents ? (
                      <span className="text-succes">Les deux mots de passe correspondent.</span>
                    ) : undefined
                  }
                />
                <button
                  type="submit"
                  disabled={processing}
                  className="flex h-[46px] items-center gap-2 self-start rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-60"
                >
                  {processing && <Icone nom="spinner" tourne />}
                  {processing ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </>
            )
          }}
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

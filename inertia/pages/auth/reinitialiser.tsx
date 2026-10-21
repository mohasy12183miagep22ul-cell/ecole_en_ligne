import AuthLayout from '~/layouts/auth'
import Icone from '~/components/ui/icone'
import Illustration from '~/components/ui/illustration'
import { ChampMotDePasse } from '~/components/ui/champ'
import { Form, Link } from '@adonisjs/inertia/react'
import { useState } from 'react'

const LONGUEUR_MIN = 10

export default function Reinitialiser({ jeton, valide }: { jeton: string; valide: boolean }) {
  const [nouveau, setNouveau] = useState('')

  if (!valide) {
    return (
      <AuthLayout titre="Lien expiré">
        <div className="flex flex-col items-start gap-4">
          <Illustration nom="vide" largeur={180} hauteur={140} />
          <h1 className="text-[24px] font-extrabold">Ce lien n’est plus valable</h1>
          <p className="text-corps leading-[1.55] text-encre-3">
            Un lien de réinitialisation sert une seule fois et expire après 30 minutes. Faites une
            nouvelle demande.
          </p>
          <Link
            route="mot_de_passe_oublie.create"
            className="flex h-12 items-center rounded-bouton bg-accent px-5 text-moyen font-bold text-white hover:text-white hover:no-underline"
          >
            Nouvelle demande
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout titre="Nouveau mot de passe">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[24px] font-extrabold">Nouveau mot de passe</h1>
        <p className="text-corps leading-normal text-encre-3">
          Choisissez un mot de passe d’au moins {LONGUEUR_MIN} caractères.
        </p>
      </div>
      <Form
        route="reinitialisation.update"
        routeParams={{ jeton }}
        className="flex flex-col gap-[18px]"
      >
        {({ errors, processing }) => (
          <>
            <ChampMotDePasse
              libelle="Nouveau mot de passe"
              name="nouveau"
              autoComplete="new-password"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              aide={`${nouveau.length} / ${LONGUEUR_MIN} caractères minimum`}
              erreur={
                errors.nouveau &&
                (errors.nouveau.toLowerCase().includes('confirm')
                  ? 'Les deux mots de passe ne correspondent pas.'
                  : `${LONGUEUR_MIN} caractères minimum.`)
              }
            />
            <ChampMotDePasse libelle="Confirmer" name="confirmation" autoComplete="new-password" />
            <button
              type="submit"
              disabled={processing}
              className="flex h-[50px] items-center justify-center gap-2.5 rounded-bouton bg-accent text-moyen font-bold text-white hover:brightness-[.94] disabled:opacity-60"
            >
              {processing && <Icone nom="spinner" tourne />}
              Enregistrer le mot de passe
            </button>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}

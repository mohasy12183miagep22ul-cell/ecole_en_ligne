import AuthLayout from '~/layouts/auth'
import Icone from '~/components/ui/icone'
import Champ from '~/components/ui/champ'
import { Form, Link } from '@adonisjs/inertia/react'

export default function MotDePasseOublie() {
  return (
    <AuthLayout titre="Mot de passe oublié">
      <Link
        route="session.create"
        className="flex items-center gap-2 self-start text-corps font-semibold text-encre-3"
      >
        <Icone nom="arrow-left" />
        Connexion
      </Link>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[24px] font-extrabold">Mot de passe oublié</h1>
        <p className="text-corps leading-normal text-encre-3">
          Saisissez l’adresse de votre compte : nous vous enverrons un lien de réinitialisation.
        </p>
      </div>
      <Form route="mot_de_passe_oublie.store" className="flex flex-col gap-[18px]">
        {({ errors, processing }) => (
          <>
            <Champ
              libelle="Adresse e-mail"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              erreur={errors.email ? 'Adresse e-mail invalide.' : undefined}
            />
            <button
              type="submit"
              disabled={processing}
              className="h-[50px] rounded-bouton bg-accent text-moyen font-bold text-white hover:brightness-[.94]"
            >
              Envoyer le lien
            </button>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}

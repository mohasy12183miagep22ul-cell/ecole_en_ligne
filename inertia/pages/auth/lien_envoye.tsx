import AuthLayout from '~/layouts/auth'
import Illustration from '~/components/ui/illustration'
import { Link } from '@adonisjs/inertia/react'

export default function LienEnvoye({ email }: { email: string }) {
  return (
    <AuthLayout titre="Vérifiez votre messagerie">
      <div className="flex flex-col items-start gap-4">
        <Illustration nom="coches" largeur={180} hauteur={140} />
        <h1 className="text-[24px] font-extrabold">Vérifiez votre messagerie</h1>
        <p className="text-corps leading-[1.55] text-encre-3">
          Si un compte est associé à <strong className="text-encre">{email}</strong>, un lien
          valable 30 minutes vient d’être envoyé.
        </p>
        <Link
          route="session.create"
          className="flex h-12 items-center rounded-bouton border border-accent bg-white px-5 text-moyen font-bold text-accent hover:no-underline"
        >
          Retour à la connexion
        </Link>
      </div>
    </AuthLayout>
  )
}

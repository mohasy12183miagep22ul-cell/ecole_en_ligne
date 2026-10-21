import AuthLayout from '~/layouts/auth'
import EtatVide from '~/components/ui/etat_vide'
import { Link } from '@adonisjs/inertia/react'

export default function PageIntrouvable() {
  return (
    <AuthLayout titre="Page introuvable">
      <EtatVide
        illustration="vide"
        titre="Page introuvable"
        texte="La page demandée n’existe pas ou n’a pas encore été construite."
        action={
          <Link
            route="home"
            className="flex h-11 items-center rounded-bouton border border-accent bg-white px-4 text-corps font-bold text-accent hover:no-underline"
          >
            Retour à l’accueil
          </Link>
        }
      />
    </AuthLayout>
  )
}

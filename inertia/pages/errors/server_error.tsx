import AuthLayout from '~/layouts/auth'
import EtatVide from '~/components/ui/etat_vide'

export default function ErreurServeur() {
  return (
    <AuthLayout titre="Erreur du serveur">
      <EtatVide
        icone="triangle-exclamation"
        titre="Une erreur est survenue"
        texte="Le serveur a rencontré un problème inattendu. Réessayez dans un instant."
      />
    </AuthLayout>
  )
}

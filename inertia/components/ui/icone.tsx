import { icones, type NomIcone } from '~/lib/icones'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

type Props = {
  nom: NomIcone
  /** Rotation continue, pour les indicateurs de chargement. */
  tourne?: boolean
  className?: string
}

/**
 * Icône décorative : masquée aux lecteurs d'écran. Un bouton qui ne porte
 * qu'une icône doit recevoir son propre `aria-label`.
 */
export default function Icone({ nom, tourne, className }: Props) {
  return (
    <FontAwesomeIcon
      icon={icones[nom]}
      spin={tourne}
      fixedWidth
      aria-hidden="true"
      className={className}
    />
  )
}

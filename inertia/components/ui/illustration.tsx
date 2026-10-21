import vide from '~/assets/illustrations/empty_4zx0.svg'
import coches from '~/assets/illustrations/check-boxes_ewf2.svg'
import lecture from '~/assets/illustrations/reading-time_gcvc.svg'
import apprentissage from '~/assets/illustrations/online-learning_tgmv.svg'

/** Illustrations unDraw du prototype, servies localement (réseau lent). */
const sources = { vide, coches, lecture, apprentissage }

export type NomIllustration = keyof typeof sources

export default function Illustration({
  nom,
  largeur,
  hauteur,
  className,
}: {
  nom: NomIllustration
  largeur: number
  hauteur: number
  className?: string
}) {
  return (
    <img
      src={sources[nom]}
      alt=""
      width={largeur}
      height={hauteur}
      loading="lazy"
      className={className ?? 'object-contain'}
      style={{ width: largeur, height: hauteur }}
    />
  )
}

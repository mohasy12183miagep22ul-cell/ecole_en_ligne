import { cx, initiales } from '~/lib/format'

/** Paires fond / texte pour les avatars, choisies de façon stable depuis le nom. */
const palette = [
  'bg-av1-fond text-av1',
  'bg-av2-fond text-av2',
  'bg-av3-fond text-av3',
  'bg-av4-fond text-av4',
  'bg-av5-fond text-av5',
]

const indice = (nom: string) => [...nom].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length

export default function Avatar({
  nom,
  taille = 38,
  className,
}: {
  nom: string
  taille?: 30 | 34 | 38 | 52 | 64
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: taille, height: taille, fontSize: Math.round(taille * 0.32) }}
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        palette[indice(nom)],
        className
      )}
    >
      {initiales(nom)}
    </span>
  )
}

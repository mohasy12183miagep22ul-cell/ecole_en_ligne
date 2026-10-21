import Icone from './icone'
import { cx } from '~/lib/format'
import { type NomIcone } from '~/lib/icones'
import { type ButtonHTMLAttributes, type ReactNode } from 'react'

export type VarianteBouton = 'principal' | 'contour' | 'secondaire' | 'danger' | 'discret'
export type TailleBouton = 'grand' | 'moyen' | 'compact'

const variantes: Record<VarianteBouton, string> = {
  principal: 'border-transparent bg-accent text-white hover:brightness-95',
  contour: 'border-accent bg-carte text-accent hover:bg-accent-doux',
  secondaire: 'border-bordure-champ bg-carte text-encre-2 hover:bg-neutre',
  danger: 'border-transparent bg-danger text-white hover:brightness-95',
  discret: 'border-transparent bg-transparent text-accent hover:bg-accent-doux',
}

const tailles: Record<TailleBouton, string> = {
  grand: 'h-[50px] px-5 text-moyen',
  moyen: 'h-11 px-4 text-corps',
  compact: 'h-9 px-3 text-meta',
}

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variante?: VarianteBouton
  taille?: TailleBouton
  icone?: NomIcone
  /** Place l'icône après le libellé (ex. « Continuer → »). */
  iconeApres?: boolean
  pleineLargeur?: boolean
  enCours?: boolean
  children: ReactNode
}

export default function Bouton({
  variante = 'principal',
  taille = 'grand',
  icone,
  iconeApres,
  pleineLargeur,
  enCours,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: Props) {
  const ic = enCours ? <Icone nom="spinner" tourne /> : icone ? <Icone nom={icone} /> : null
  return (
    <button
      type={type}
      disabled={disabled || enCours}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-bouton border font-bold transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantes[variante],
        tailles[taille],
        pleineLargeur && 'w-full',
        className
      )}
      {...rest}
    >
      {!iconeApres && ic}
      {children}
      {iconeApres && ic}
    </button>
  )
}

type PropsIcone = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  'icone': NomIcone
  /** Obligatoire : le bouton ne porte aucun texte visible. */
  'aria-label': string
  'variante'?: 'bordure' | 'nu'
}

/** Bouton carré 44 px qui ne porte qu'une icône. */
export function BoutonIcone({
  icone,
  variante = 'nu',
  className,
  type = 'button',
  ...rest
}: PropsIcone) {
  return (
    <button
      type={type}
      className={cx(
        'flex size-11 shrink-0 items-center justify-center rounded-bouton text-encre-3 transition hover:bg-neutre',
        variante === 'bordure' && 'border border-bordure-champ bg-carte text-accent',
        className
      )}
      {...rest}
    >
      <Icone nom={icone} />
    </button>
  )
}

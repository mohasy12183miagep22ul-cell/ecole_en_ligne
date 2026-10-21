import Icone from './icone'
import { cx } from '~/lib/format'
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

const base =
  'w-full rounded-bouton border bg-champ px-3.5 text-moyen text-encre outline-none transition focus:border-accent focus:bg-white disabled:opacity-60'

type Commun = {
  libelle: string
  /** Message d'erreur, rattaché au champ via aria-describedby. */
  erreur?: string | null
  aide?: ReactNode
  className?: string
}

function Enveloppe({
  id,
  libelle,
  erreur,
  aide,
  className,
  children,
}: Commun & { id: string; children: ReactNode }) {
  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-meta font-semibold text-encre-2">
        {libelle}
      </label>
      {children}
      {aide && !erreur && (
        <span id={`${id}-aide`} className="text-leg text-encre-3">
          {aide}
        </span>
      )}
      {erreur && (
        <span id={`${id}-erreur`} role="alert" className="text-leg text-erreur">
          {erreur}
        </span>
      )}
    </div>
  )
}

const decrit = (id: string, erreur?: string | null, aide?: ReactNode) =>
  erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined

type PropsChamp = Commun & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>

export default function Champ({ libelle, erreur, aide, className, id, ...rest }: PropsChamp) {
  const auto = useId()
  const ident = id ?? auto
  return (
    <Enveloppe id={ident} libelle={libelle} erreur={erreur} aide={aide} className={className}>
      <input
        id={ident}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit(ident, erreur, aide)}
        className={cx(base, 'h-12', erreur ? 'border-danger' : 'border-bordure-champ')}
        {...rest}
      />
    </Enveloppe>
  )
}

/** Champ mot de passe avec bouton « afficher / masquer ». */
export function ChampMotDePasse({ libelle, erreur, aide, className, id, ...rest }: PropsChamp) {
  const auto = useId()
  const ident = id ?? auto
  const [visible, setVisible] = useState(false)
  return (
    <Enveloppe id={ident} libelle={libelle} erreur={erreur} aide={aide} className={className}>
      <div className="relative flex">
        <input
          id={ident}
          type={visible ? 'text' : 'password'}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={decrit(ident, erreur, aide)}
          className={cx(
            base,
            'h-12 min-w-0 pr-12',
            erreur ? 'border-danger' : 'border-bordure-champ'
          )}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          className="absolute top-1 right-1 flex size-10 items-center justify-center rounded-champ text-encre-3"
        >
          <Icone nom={visible ? 'reg-eye-slash' : 'reg-eye'} />
        </button>
      </div>
    </Enveloppe>
  )
}

type PropsSelect = Commun & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'>

export function Selection({
  libelle,
  erreur,
  aide,
  className,
  id,
  children,
  ...rest
}: PropsSelect) {
  const auto = useId()
  const ident = id ?? auto
  return (
    <Enveloppe id={ident} libelle={libelle} erreur={erreur} aide={aide} className={className}>
      <select
        id={ident}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit(ident, erreur, aide)}
        className={cx(base, 'h-12', erreur ? 'border-danger' : 'border-bordure-champ')}
        {...rest}
      >
        {children}
      </select>
    </Enveloppe>
  )
}

type PropsZone = Commun & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export function ZoneTexte({ libelle, erreur, aide, className, id, ...rest }: PropsZone) {
  const auto = useId()
  const ident = id ?? auto
  return (
    <Enveloppe id={ident} libelle={libelle} erreur={erreur} aide={aide} className={className}>
      <textarea
        id={ident}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit(ident, erreur, aide)}
        className={cx(
          base,
          'py-2.5 leading-snug',
          erreur ? 'border-danger' : 'border-bordure-champ'
        )}
        {...rest}
      />
    </Enveloppe>
  )
}

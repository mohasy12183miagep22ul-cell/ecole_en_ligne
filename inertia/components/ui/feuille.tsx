import Icone from './icone'
import { ZoneTexte } from './champ'
import { cx } from '~/lib/format'
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'

type Props = {
  ouverte: boolean
  titre: string
  texte?: string
  /** Lignes « libellé / valeur » de récapitulatif. */
  lignes?: Array<[string, string]>
  libelleConfirmer: string
  danger?: boolean
  /** Demande un motif (5 caractères minimum), transmis à `onConfirmer`. */
  motif?: boolean
  onConfirmer: (motif: string) => void
  onFermer: () => void
  children?: ReactNode
}

const FOCALISABLES = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Confirmation d'une action sensible : feuille collée en bas sur mobile,
 * dialogue centré dès 1024 px. Piège de focus, Échap pour fermer.
 */
export type ConfigFeuille = Omit<Props, 'ouverte' | 'onFermer' | 'children'>

/**
 * Feuille pilotée par une configuration : `ouvrir({...})` l'affiche,
 * la confirmation la referme avant d'appeler `onConfirmer`.
 */
export function useFeuille() {
  const [config, setConfig] = useState<ConfigFeuille | null>(null)
  const fermer = useCallback(() => setConfig(null), [])
  const element = config ? (
    <Feuille
      {...config}
      ouverte
      onFermer={fermer}
      onConfirmer={(m) => {
        setConfig(null)
        config.onConfirmer(m)
      }}
    />
  ) : null
  return [element, setConfig] as const
}

export default function Feuille(props: Props) {
  // Le contenu est monté à l'ouverture : motif et erreur repartent donc à zéro.
  return props.ouverte ? <FeuilleOuverte {...props} /> : null
}

function FeuilleOuverte({
  titre,
  texte,
  lignes,
  libelleConfirmer,
  danger,
  motif,
  onConfirmer,
  onFermer,
  children,
}: Props) {
  const idTitre = useId()
  const panneau = useRef<HTMLDivElement>(null)
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null
    panneau.current?.querySelector<HTMLElement>(FOCALISABLES)?.focus()
    const clavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onFermer()
      if (e.key !== 'Tab' || !panneau.current) return
      const el = [...panneau.current.querySelectorAll<HTMLElement>(FOCALISABLES)].filter(
        (n) => !n.hasAttribute('disabled')
      )
      if (!el.length) return
      const premier = el[0]
      const dernier = el[el.length - 1]
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault()
        dernier.focus()
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault()
        premier.focus()
      }
    }
    document.addEventListener('keydown', clavier)
    return () => {
      document.removeEventListener('keydown', clavier)
      precedent?.focus()
    }
  }, [onFermer])

  const confirmer = () => {
    if (motif && saisie.trim().length < 5) {
      setErreur('Indiquez un motif (5 caractères minimum).')
      return
    }
    onConfirmer(saisie.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6">
      <div className="absolute inset-0 bg-encre/42" onClick={onFermer} aria-hidden="true" />
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        className={cx(
          'relative flex max-h-[90dvh] w-full flex-col gap-4 overflow-y-auto bg-white shadow-feuille',
          'rounded-t-[22px] px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
          'lg:max-w-[460px] lg:rounded-[18px] lg:pb-6'
        )}
      >
        <div className="flex items-start gap-3">
          <h2 id={idTitre} className="flex-1 text-[18px] leading-[1.3] font-extrabold">
            {titre}
          </h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onFermer}
            className="size-9 shrink-0 rounded-full border border-bordure-moyenne bg-white text-encre-2"
          >
            <Icone nom="xmark" />
          </button>
        </div>
        {texte && <p className="text-corps leading-[1.55] text-encre-3">{texte}</p>}
        {lignes && lignes.length > 0 && (
          <dl className="flex flex-col rounded-bouton border border-bordure">
            {lignes.map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-3 border-b border-separateur px-3.5 py-2.5 text-meta last:border-b-0"
              >
                <dt className="text-encre-3">{k}</dt>
                <dd className="text-right font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {children}
        {motif && (
          <ZoneTexte
            libelle="Motif (journalisé)"
            rows={3}
            value={saisie}
            maxLength={200}
            onChange={(e) => {
              setSaisie(e.target.value)
              setErreur('')
            }}
            erreur={erreur}
          />
        )}
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onFermer}
            className="h-[46px] rounded-bouton border border-bordure-champ bg-white px-[18px] text-corps font-semibold text-encre-2"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirmer}
            className={cx(
              'h-[46px] rounded-bouton px-5 text-corps font-bold text-white',
              danger ? 'bg-danger' : 'bg-accent'
            )}
          >
            {libelleConfirmer}
          </button>
        </div>
      </div>
    </div>
  )
}

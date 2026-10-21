import Icone from './icone'
import { cx } from '~/lib/format'
import { useEffect, useState } from 'react'
import { router, usePage } from '@inertiajs/react'

type Message = { id: number; texte: string; erreur?: boolean }

let suivant = 0
const ecouteurs = new Set<(m: Message) => void>()

/** Affiche un message bref, depuis n'importe où : `notifier('Enregistré')`. */
export const notifier = (texte: string, erreur = false) => {
  const m = { id: ++suivant, texte, erreur }
  ecouteurs.forEach((f) => f(m))
}

/**
 * Zone d'affichage des toasts (role="status"). Relaie aussi les messages
 * flash du serveur. À monter une fois par layout.
 */
export default function Toasts({ bas = 'coque' }: { bas?: 'coque' | 'auth' }) {
  const [message, setMessage] = useState<Message | null>(null)
  const { flash } = usePage()

  useEffect(() => {
    ecouteurs.add(setMessage)
    return () => {
      ecouteurs.delete(setMessage)
    }
  }, [])

  useEffect(() => router.on('start', () => setMessage(null)), [])

  useEffect(() => {
    if (flash.error) notifier(flash.error, true)
    else if (flash.success) notifier(flash.success)
  }, [flash])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 2800)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null
  return (
    <div
      className={cx(
        'pointer-events-none absolute inset-x-0 z-[60] flex justify-center px-4',
        bas === 'coque' ? 'bottom-[84px] lg:bottom-7' : 'bottom-6 lg:bottom-7'
      )}
    >
      <div
        role="status"
        className="flex max-w-[420px] items-center gap-2.5 rounded-bouton bg-encre px-4 py-3 text-meta font-medium text-white shadow-[0_10px_30px_rgba(27,23,38,.25)]"
      >
        <Icone
          nom={message.erreur ? 'circle-exclamation' : 'circle-check'}
          className={message.erreur ? 'text-erreur-fond' : 'text-toast-ok'}
        />
        {message.texte}
      </div>
    </div>
  )
}

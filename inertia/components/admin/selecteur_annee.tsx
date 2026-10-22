import Icone from '~/components/ui/icone'
import { cx } from '~/lib/format'
import { ETATS_ANNEE, type EtatAnnee } from '~/lib/structure'
import { router } from '@inertiajs/react'

type Annee = { id: number; libelle: string; etat: EtatAnnee }

/**
 * Choix de l'année consultée (écrans classes et affectations), et rappel
 * qu'une année clôturée est en lecture seule (RG2).
 */
export default function SelecteurAnnee({
  url,
  annees,
  courante,
}: {
  url: string
  annees: Annee[]
  courante: Annee
}) {
  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="Année scolaire"
        className="scroll-masque flex gap-2 overflow-x-auto"
      >
        {annees.map((a) => {
          const on = a.id === courante.id
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={on}
              onClick={() => router.get(url, { annee: a.id })}
              className={cx(
                'flex h-9 shrink-0 items-center gap-1.5 rounded-champ border px-3.5 text-meta font-semibold',
                on
                  ? 'border-accent bg-accent text-white'
                  : 'border-bordure-champ bg-white text-encre-2'
              )}
            >
              {a.etat === 'cloturee' && <Icone nom="lock" className="text-micro" />}
              {a.libelle}
              <span className={cx('text-micro font-medium', on ? 'text-white/80' : 'text-encre-4')}>
                · {ETATS_ANNEE[a.etat].libelle}
              </span>
            </button>
          )
        })}
      </div>
      {courante.etat === 'cloturee' && (
        <div className="flex gap-2.5 rounded-champ bg-neutre p-3 text-meta leading-[1.45] text-encre-2">
          <Icone nom="lock" className="mt-0.5" />
          L’année {courante.libelle} est clôturée : elle est en lecture seule définitive (RG2).
        </div>
      )}
    </div>
  )
}

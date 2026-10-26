import { router } from '@inertiajs/react'

const filtre = 'h-9 shrink-0 rounded-champ border border-bordure-champ bg-white px-2 text-meta'

export type Choix = {
  affectations: Array<{ id: number; libelle: string }>
  periodes: Array<{ id: number; libelle: string }>
  affectation: number | null
  periode: number | null
}

/** Sélecteurs affectation + période, partagés avec le récapitulatif. */
export function Selecteurs({ choix, url }: { choix: Choix; url: string }) {
  const aller = (modif: Partial<Pick<Choix, 'affectation' | 'periode'>>) =>
    router.get(url, { affectation: choix.affectation, periode: choix.periode, ...modif })
  return (
    <div className="flex flex-wrap gap-2">
      <select
        aria-label="Classe et matière"
        value={choix.affectation ?? ''}
        onChange={(e) => aller({ affectation: Number(e.target.value) })}
        className={filtre}
      >
        {choix.affectations.map((a) => (
          <option key={a.id} value={a.id}>
            {a.libelle}
          </option>
        ))}
      </select>
      <select
        aria-label="Période"
        value={choix.periode ?? ''}
        onChange={(e) => aller({ periode: Number(e.target.value) })}
        className={filtre}
      >
        {choix.periodes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.libelle}
          </option>
        ))}
      </select>
    </div>
  )
}

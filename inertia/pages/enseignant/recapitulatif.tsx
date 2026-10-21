import Coque from '~/layouts/coque'
import { cx, fmt } from '~/lib/format'
import { useDemo } from '~/demo/store'
import { donneesClasse, moyenneMaths } from '~/demo/calculs'
import { inscrits } from '~/demo/donnees'

export default function Recapitulatif() {
  const st = useDemo()
  const miennes = st.evals.filter((e) => e.mine)
  const cartes = ['3e A', '3e B', '4e A'].map((c) => {
    const vals = inscrits(c)
      .map((s) => moyenneMaths(st, c, s.id))
      .filter((v): v is number => v !== null)
    const m = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    return {
      classe: c,
      effectif: inscrits(c).length,
      nEv: miennes.filter((e) => e.classe === c).length,
      moyenne: m,
      min: vals.length ? Math.min(...vals) : null,
      max: vals.length ? Math.max(...vals) : null,
      reussite: vals.length
        ? `${Math.round((vals.filter((v) => v >= 10).length / vals.length) * 100)} %`
        : '—',
    }
  })
  const lignes = donneesClasse(st)
    .lignes.slice()
    .sort((a, b) => (b.av.MA ?? 0) - (a.av.MA ?? 0))

  return (
    <Coque espace="enseignant" titre="Récapitulatif de ma matière">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3">
          {cartes.map((c) => (
            <div
              key={c.classe}
              className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-4"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-titre-carte font-extrabold">{c.classe}</span>
                <span className="text-leg text-encre-3">
                  {c.effectif} élèves · {c.nEv} év.
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-extrabold text-accent">{fmt(c.moyenne)}</span>
                <span className="text-leg text-encre-3">moyenne de classe</span>
              </div>
              <div className="h-1.5 rounded-[3px] bg-neutre">
                <div
                  className="h-full rounded-[3px] bg-accent"
                  style={{ width: c.moyenne ? `${((c.moyenne / 20) * 100).toFixed(0)}%` : '0%' }}
                />
              </div>
              <div className="flex justify-between text-leg text-encre-3">
                <span>Min {fmt(c.min)}</span>
                <span>Max {fmt(c.max)}</span>
                <span>≥ 10 : {c.reussite}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2.5 rounded-carte border border-bordure bg-white p-4">
          <span className="text-moyen font-bold">3e A · moyennes en mathématiques</span>
          {lignes.map((r) => {
            const v = r.av.MA
            return (
              <div
                key={r.s.id}
                className="grid grid-cols-[minmax(0,1fr)_90px_48px] items-center gap-2.5 text-meta"
              >
                <span className="truncate">
                  {r.s.nomU} {r.s.prenom}
                </span>
                <div className="h-1.5 rounded-[3px] bg-neutre">
                  <div
                    className={cx(
                      'h-full rounded-[3px]',
                      v !== null && v < 10 ? 'bg-barre-alerte' : 'bg-accent'
                    )}
                    style={{ width: v ? `${((v / 20) * 100).toFixed(0)}%` : '0%' }}
                  />
                </div>
                <span className="text-right font-bold">{fmt(v)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </Coque>
  )
}

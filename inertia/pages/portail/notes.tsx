import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import SelecteurEnfant from '~/components/portail/selecteur_enfant'
import { cx, fmt, fmtv } from '~/lib/format'
import { useDemo } from '~/demo/store'
import { donneesPortail } from '~/demo/portail'
import { AMINATA, ARCHIVES, MATIERE, MATIERES } from '~/demo/donnees'
import { useState } from 'react'

const PERIODES_AMINATA = [
  { id: 'cur', libelle: 'T1 · 2026-2027' },
  { id: 'a3', libelle: 'T3 · 2025-2026' },
  { id: 'a2', libelle: 'T2 · 2025-2026' },
  { id: 'a1', libelle: 'T1 · 2025-2026' },
]

export default function NotesPortail() {
  const st = useDemo()
  const { estAminata, publie, moi } = donneesPortail(st)
  const [periode, setPeriode] = useState('cur')
  const periodes = estAminata ? PERIODES_AMINATA : PERIODES_AMINATA.slice(0, 1)
  const p = periodes.some((x) => x.id === periode) ? periode : 'cur'
  const verrouille = p === 'cur' && !(estAminata && publie)

  let mg: number | null = null
  let matieres: Array<{
    nom: string
    icone: (typeof MATIERES)[number]['icone']
    coef: number
    moy: string
    evals: Array<{ titre: string; date: string; note: string }>
  }> = []

  if (!verrouille) {
    if (p === 'cur') {
      mg = moi.mg
      matieres = MATIERES.map((m) => {
        let evals: Array<{ titre: string; date: string; note: string }>
        if (m.code === 'MA') {
          evals = st.evals
            .filter(
              (e) =>
                e.classe === '3e A' &&
                e.matiere === 'MA' &&
                ['validée', 'verrouillée'].includes(e.etat)
            )
            .map((e) => {
              const c = st.grids[e.id]?.[AMINATA.id]
              return {
                titre: e.titre,
                date: e.date,
                note: c?.abs ? 'Absent' : `${c?.v || '—'} / ${e.max}`,
              }
            })
        } else {
          const e = st.evals.find((x) => x.classe === '3e A' && x.matiere === m.code)
          const v = moi.av[m.code]
          evals = e && v !== null ? [{ titre: e.titre, date: e.date, note: `${fmtv(v)} / 20` }] : []
        }
        return { nom: m.nom, icone: m.icone, coef: m.coef, moy: fmt(moi.av[m.code]), evals }
      })
    } else {
      const b = ARCHIVES.find((x) => x.id === p)!
      mg = b.mg
      matieres = b.lignes.map((l) => {
        const m = MATIERE[l.code]
        return {
          nom: m.nom,
          icone: m.icone,
          coef: m.coef,
          moy: fmt(l.v),
          evals: [{ titre: 'Composition', date: b.libelle, note: `${fmtv(l.v ?? 0)} / 20` }],
        }
      })
    }
  }

  return (
    <Coque espace="portail" titre="Notes publiées">
      <div className="flex flex-col gap-4">
        <SelecteurEnfant />
        <div
          role="group"
          aria-label="Période"
          className="scroll-masque flex gap-2 overflow-x-auto pb-0.5"
        >
          {periodes.map((x) => {
            const on = p === x.id
            const lock = x.id === 'cur' && !(estAminata && publie)
            return (
              <button
                key={x.id}
                type="button"
                aria-pressed={on}
                onClick={() => setPeriode(x.id)}
                className={cx(
                  'flex h-9 shrink-0 items-center gap-1.5 rounded-champ border px-3.5 text-meta font-semibold',
                  on
                    ? 'border-accent bg-accent text-white'
                    : 'border-bordure-champ bg-white text-encre-2'
                )}
              >
                {lock && <Icone nom="lock" className="text-micro" />}
                {x.libelle}
              </button>
            )
          })}
        </div>

        {verrouille ? (
          <div className="flex flex-col items-center gap-3 rounded-carte border border-bordure bg-white px-5 py-7 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent-doux text-[22px] text-accent">
              <Icone nom="lock" />
            </div>
            <span className="text-titre-carte font-bold">Résultats non publiés</span>
            <span className="max-w-[340px] text-meta leading-normal text-encre-3">
              Les notes de cette période deviennent visibles uniquement après la délivrance
              officielle du bulletin.
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-[14px] bg-accent-doux px-4 py-3.5">
              <span className="text-corps font-semibold">Moyenne générale</span>
              <span className="text-[22px] font-extrabold text-accent">
                {fmt(mg)}
                <span className="text-meta font-medium text-encre-3"> /20</span>
              </span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-3">
              {matieres.map((s) => (
                <div
                  key={s.nom}
                  className="flex flex-col gap-2.5 rounded-carte border border-bordure bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-[38px] items-center justify-center rounded-champ bg-accent-doux text-accent">
                      <Icone nom={s.icone} />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-moyen font-bold">{s.nom}</span>
                      <span className="text-leg text-encre-3">Coefficient {s.coef}</span>
                    </div>
                    <span className="text-section-lg font-extrabold">{s.moy}</span>
                  </div>
                  {s.evals.map((e) => (
                    <div
                      key={e.titre + e.date}
                      className="flex justify-between gap-2.5 border-t border-separateur pt-2 text-meta"
                    >
                      <span className="text-encre-2">
                        {e.titre} <span className="text-encre-4">· {e.date}</span>
                      </span>
                      <span className="font-bold whitespace-nowrap">{e.note}</span>
                    </div>
                  ))}
                  {s.evals.length === 0 && (
                    <span className="border-t border-separateur pt-2 text-meta text-encre-4">
                      Aucune note sur la période
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Coque>
  )
}

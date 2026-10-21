import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import { notifier } from '~/components/ui/toast'
import { clamp, DECISIONS, MATIERES, rnd, suggerer } from '~/demo/donnees'
import { donneesClasse } from '~/demo/calculs'
import { modifier, useDemo } from '~/demo/store'
import { cx, fmt, rang } from '~/lib/format'
import { useState } from 'react'

export default function Deliberation() {
  const st = useDemo()
  const cd = donneesClasse(st)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const attente = st.evals.filter(
    (e) => e.classe === '3e A' && !['validée', 'verrouillée'].includes(e.etat)
  )
  const lignes = cd.lignes.slice().sort((a, b) => (b.mg ?? 0) - (a.mg ?? 0))

  return (
    <Coque espace="direction" titre="Délibération">
      <div className="flex max-w-[960px] flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-section font-extrabold">Conseil de classe · 3e A</span>
              <span className="text-leg text-encre-3">
                1er trimestre 2026-2027 · trié par moyenne générale
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => notifier('Procès-verbal de délibération exporté (PDF)')}
                className="h-[38px] rounded-champ border border-bordure-champ bg-white px-3 text-meta font-semibold text-encre-2"
              >
                <Icone nom="reg-file-pdf" className="mr-1.5" />
                PV
              </button>
              <button
                type="button"
                onClick={() => notifier('Tableau des moyennes exporté (Excel)')}
                className="h-[38px] rounded-champ border border-bordure-champ bg-white px-3 text-meta font-semibold text-encre-2"
              >
                <Icone nom="reg-file-excel" className="mr-1.5" />
                Excel
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Effectif', String(cd.effectif)],
              ['Moyenne', fmt(cd.moyenne)],
              ['≥ 10/20', `${Math.round(cd.reussite * 100)} %`],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col rounded-champ bg-page px-3 py-2.5">
                <span className="text-micro text-encre-3">{k}</span>
                <span className="text-[18px] font-extrabold">{v}</span>
              </div>
            ))}
          </div>
          {attente.length > 0 && (
            <div className="flex gap-2.5 rounded-champ bg-attention-fond px-3 py-2.5 text-meta font-medium text-attention">
              <Icone nom="triangle-exclamation" className="mt-0.5" />
              {attente.length} évaluation{attente.length > 1 ? 's' : ''} non validée
              {attente.length > 1 ? 's' : ''} : moyennes provisoires.
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-carte border border-bordure bg-white">
          {lignes.map((r) => {
            const o = ouvert === r.s.id
            const dec = st.dec[r.s.id] ?? suggerer(r.mg)
            return (
              <div key={r.s.id} className="border-b border-separateur">
                <div className="flex flex-wrap items-center gap-2.5 px-3 py-2.5">
                  <span className="w-[34px] text-meta font-extrabold text-accent">
                    {rang(r.rang)}
                  </span>
                  <button
                    type="button"
                    aria-expanded={o}
                    onClick={() => setOuvert(o ? null : r.s.id)}
                    className="flex min-w-[150px] flex-1 items-center gap-2.5 text-left"
                  >
                    <span
                      className={cx(
                        'flex size-[30px] shrink-0 items-center justify-center rounded-full text-micro font-bold',
                        r.s.avatar
                      )}
                    >
                      {r.s.initiales}
                    </span>
                    <span className="flex-1 truncate text-corps font-semibold text-encre">
                      {r.s.nomU} {r.s.prenom}
                    </span>
                    <span
                      className={cx(
                        'text-moyen font-extrabold',
                        r.mg !== null && r.mg < 10 ? 'text-erreur' : 'text-encre'
                      )}
                    >
                      {fmt(r.mg)}
                    </span>
                    <Icone
                      nom={o ? 'chevron-up' : 'chevron-down'}
                      className="text-micro text-encre-4"
                    />
                  </button>
                  <select
                    aria-label="Décision du conseil"
                    value={dec}
                    onChange={(e) => {
                      const v = e.target.value
                      modifier((s) => ({ dec: { ...s.dec, [r.s.id]: v } }))
                    }}
                    className="h-[38px] max-w-[210px] shrink-0 rounded-champ border border-bordure-champ bg-champ px-2 text-meta text-encre"
                  >
                    {DECISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d === '—' ? 'Aucune mention' : d}
                      </option>
                    ))}
                  </select>
                </div>
                {o && (
                  <div className="flex flex-col gap-2 pr-3 pb-3 pl-14">
                    <div className="flex flex-wrap gap-1.5">
                      {MATIERES.map((m) => {
                        const v = r.av[m.code]
                        return (
                          <span
                            key={m.code}
                            className="rounded-[8px] bg-page px-2 py-[5px] text-leg text-encre-3"
                          >
                            {m.code === 'SVT' || m.code === 'EPS'
                              ? m.code
                              : `${m.nom.slice(0, 4)}.`}{' '}
                            <strong className={v !== null && v < 10 ? 'text-erreur' : 'text-encre'}>
                              {fmt(v)}
                            </strong>
                          </span>
                        )
                      })}
                    </div>
                    <span className="text-leg text-encre-3">
                      Historique · T3 25-26 :{' '}
                      {fmt(clamp((r.mg ?? 0) - 0.6 + rnd(r.s.i) * 1.2, 0, 20))}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Coque>
  )
}

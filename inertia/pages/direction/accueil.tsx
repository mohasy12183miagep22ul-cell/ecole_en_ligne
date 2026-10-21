import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import { cx, fmt } from '~/lib/format'
import { type NomIcone } from '~/lib/icones'
import { useDemo } from '~/demo/store'
import { donneesClasse } from '~/demo/calculs'
import { MATIERES } from '~/demo/donnees'

const carte = 'flex flex-col gap-3 rounded-carte border border-bordure bg-white p-[18px]'

export default function AccueilDirection() {
  const st = useDemo()
  const cd = donneesClasse(st)
  const ev3A = st.evals.filter((e) => e.classe === '3e A')
  const attente = ev3A.filter((e) => !['validée', 'verrouillée'].includes(e.etat))
  const validees = ev3A.length - attente.length

  const kpis: Array<{ libelle: string; v: string; sous: string; icone: NomIcone }> = [
    {
      libelle: 'Élèves inscrits',
      v: '1 248',
      sous: '18 classes · 2026-2027',
      icone: 'user-graduate',
    },
    {
      libelle: 'Évaluations validées · 3e A',
      v: `${validees} / ${ev3A.length}`,
      sous: attente.length ? `${attente.length} en attente` : 'Prêt pour le conseil',
      icone: 'circle-check',
    },
    {
      libelle: 'Moyenne générale · 3e A',
      v: fmt(cd.moyenne),
      sous: `${Math.round(cd.reussite * 100)} % ≥ 10/20`,
      icone: 'chart-line',
    },
  ]
  const saisies: Array<[string, string, number]> = [
    ['6e A', 'A. Keïta', 92],
    ['6e B', 'O. Barry', 78],
    ['5e A', 'S. Condé', 100],
    ['4e A', 'L. Kaba', 85],
    ['3e A', 'I. Sow', Math.round((validees / ev3A.length) * 100)],
    ['3e B', 'H. Touré', 64],
  ]
  const niveaux: Array<[string, number]> = [
    ['6e', 78],
    ['5e', 81],
    ['4e', 74],
    ['3e', Math.round(cd.reussite * 100)],
  ]

  return (
    <Coque espace="direction" titre="Tableau de bord">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
          {kpis.map((k) => (
            <div
              key={k.libelle}
              className="flex items-center gap-3.5 rounded-carte border border-bordure bg-white p-4"
            >
              <div className="flex size-11 items-center justify-center rounded-bouton bg-accent-doux text-section text-accent">
                <Icone nom={k.icone} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-leg text-encre-3">{k.libelle}</span>
                <span className="text-[22px] font-extrabold">{k.v}</span>
                <span className="text-leg text-encre-3">{k.sous}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
          <div className={carte}>
            <span className="text-moyen font-bold">Suivi des saisies par classe · T1</span>
            {saisies.map(([c, pp, p]) => (
              <div
                key={c}
                className="grid grid-cols-[52px_minmax(0,1fr)_48px] items-center gap-3 text-meta"
              >
                <span className="font-bold">{c}</span>
                <div className="flex flex-col gap-1">
                  <div className="h-2 rounded-[4px] bg-neutre">
                    <div
                      className={cx(
                        'h-full rounded-[4px]',
                        p === 100 ? 'bg-barre-ok' : p < 70 ? 'bg-barre-alerte' : 'bg-accent'
                      )}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <span className="text-micro text-encre-3">PP : {pp}</span>
                </div>
                <span className="text-right font-bold">{p} %</span>
              </div>
            ))}
          </div>
          <div className={carte}>
            <span className="text-moyen font-bold">Moyennes par matière · 3e A</span>
            {MATIERES.filter((m) => cd.stats[m.code]).map((m) => {
              const v = cd.stats[m.code]!.moyenne
              return (
                <div
                  key={m.code}
                  className="grid grid-cols-[120px_minmax(0,1fr)_44px] items-center gap-2.5 text-meta"
                >
                  <span className="truncate">{m.nom}</span>
                  <div className="h-2 rounded-[4px] bg-neutre">
                    <div
                      className={cx(
                        'h-full rounded-[4px]',
                        v < 10 ? 'bg-barre-alerte' : 'bg-accent'
                      )}
                      style={{ width: `${((v / 20) * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="text-right font-bold">{fmt(v)}</span>
                </div>
              )
            })}
          </div>
          <div className={carte}>
            <span className="text-moyen font-bold">Taux de réussite par niveau</span>
            <div className="flex h-[140px] items-end gap-4">
              {niveaux.map(([l, p]) => (
                <div
                  key={l}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <span className="text-leg font-bold">{p} %</span>
                  <div
                    className="w-full max-w-10 rounded-[8px_8px_4px_4px] bg-accent"
                    style={{ height: `${p}%` }}
                  />
                  <span className="text-leg text-encre-3">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Coque>
  )
}

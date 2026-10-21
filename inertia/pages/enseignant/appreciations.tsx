import Coque from '~/layouts/coque'
import Onglets from '~/components/ui/onglets'
import { cx, fmt } from '~/lib/format'
import { modifier, useDemo } from '~/demo/store'
import { donneesClasse } from '~/demo/calculs'
import { apprAuto } from '~/demo/donnees'
import { useState } from 'react'

export default function Appreciations() {
  const st = useDemo()
  const [mode, setMode] = useState<'mat' | 'gen'>('mat')
  const cd = donneesClasse(st)
  const cle = mode === 'mat' ? 'appr' : 'apprG'

  return (
    <Coque espace="enseignant" titre="Appréciations">
      <div className="flex max-w-[820px] flex-col gap-3">
        <Onglets
          aria-label="Type d’appréciation"
          actif={mode}
          onChange={setMode}
          onglets={[
            { id: 'mat', libelle: 'Mathématiques · 3e A' },
            { id: 'gen', libelle: 'Appréciation générale (PP)' },
          ]}
        />
        <span className="text-leg text-encre-3">
          250 caractères maximum · enregistrement automatique
        </span>
        {cd.lignes.map((r) => {
          const t = st[cle][r.s.id] ?? ''
          return (
            <div
              key={r.s.id}
              className="flex flex-col gap-2.5 rounded-[14px] border border-bordure bg-white p-3.5"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cx(
                    'flex size-[30px] items-center justify-center rounded-full text-micro font-bold',
                    r.s.avatar
                  )}
                >
                  {r.s.initiales}
                </span>
                <span className="flex-1 text-corps font-bold">
                  {r.s.nomU} {r.s.prenom}
                </span>
                <span className="text-corps font-extrabold">
                  {fmt(mode === 'mat' ? r.av.MA : r.mg)}
                </span>
              </div>
              <textarea
                aria-label={`Appréciation de ${r.s.prenom} ${r.s.nomU}`}
                value={t}
                rows={2}
                maxLength={250}
                placeholder={
                  mode === 'mat' ? `Ex. ${apprAuto(r.av.MA)}` : 'Appréciation du conseil de classe…'
                }
                onChange={(e) => {
                  const v = e.target.value.slice(0, 250)
                  modifier((s) => ({ [cle]: { ...s[cle], [r.s.id]: v } }))
                }}
                className="resize-y rounded-champ border border-bordure-champ bg-champ px-3 py-2.5 text-corps leading-[1.45] outline-none focus:border-accent focus:bg-white"
              />
              <span
                className={cx(
                  'self-end text-micro font-semibold',
                  t.length >= 230 ? 'text-erreur' : 'text-encre-4'
                )}
              >
                {t.length} / 250
              </span>
            </div>
          )
        })}
      </div>
    </Coque>
  )
}

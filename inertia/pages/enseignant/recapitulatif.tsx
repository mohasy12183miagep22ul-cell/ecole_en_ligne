import Coque from '~/layouts/coque'
import EtatVide from '~/components/ui/etat_vide'
import { cx, fmt, rang } from '~/lib/format'
import { Selecteurs, type Choix } from '~/components/enseignant/selecteurs'

type Carte = {
  id: number
  classe: string
  matiere: string
  effectif: number
  moyenne: number | null
  min: number | null
  max: number | null
  reussite: number | null
}
type Ligne = {
  id: number
  nom: string
  prenoms: string
  moyenne: number | null
  rang: number | null
}

export default function Recapitulatif({
  choix,
  cartes,
  detail,
}: {
  choix: Choix | null
  cartes: Carte[]
  detail: Ligne[]
}) {
  const choisie = cartes.find((c) => c.id === choix?.affectation)
  return (
    <Coque espace="enseignant" titre="Récapitulatif de ma matière">
      <div className="flex flex-col gap-4">
        {!choix ? (
          <EtatVide icone="chart-column" titre="Aucune classe confiée" />
        ) : (
          <>
            <Selecteurs choix={choix} url="/enseignant/recapitulatif" />
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3">
              {cartes.map((c) => (
                <div
                  key={c.id}
                  className={cx(
                    'flex flex-col gap-3 rounded-carte border bg-white p-4',
                    c.id === choix.affectation ? 'border-accent' : 'border-bordure'
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-titre-carte font-extrabold">{c.classe}</span>
                    <span className="text-leg text-encre-3">
                      {c.matiere} · {c.effectif} élèves
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[28px] font-extrabold text-accent">{fmt(c.moyenne)}</span>
                    <span className="text-leg text-encre-3">moyenne de classe</span>
                  </div>
                  <div className="h-1.5 rounded-[3px] bg-neutre">
                    <div
                      className="h-full rounded-[3px] bg-accent"
                      style={{
                        width:
                          c.moyenne === null ? '0%' : `${((c.moyenne / 20) * 100).toFixed(0)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-leg text-encre-3">
                    <span>Min {fmt(c.min)}</span>
                    <span>Max {fmt(c.max)}</span>
                    <span>
                      ≥ 10 : {c.reussite === null ? '—' : `${Math.round(c.reussite * 100)} %`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 rounded-carte border border-bordure bg-white p-4">
              <span className="text-moyen font-bold">
                {choisie
                  ? `${choisie.classe} · moyennes en ${choisie.matiere.toLowerCase()}`
                  : 'Moyennes'}
              </span>
              <span className="text-leg text-encre-3">
                Provisoires : toutes les évaluations de la période comptent, validées ou non.
              </span>
              {detail.map((l) => (
                <div
                  key={l.id}
                  className="grid grid-cols-[36px_minmax(0,1fr)_90px_48px] items-center gap-2.5 text-meta"
                >
                  <span className="text-leg text-encre-4">{rang(l.rang)}</span>
                  <span className="truncate">
                    {l.nom.toUpperCase()} {l.prenoms}
                  </span>
                  <div className="h-1.5 rounded-[3px] bg-neutre">
                    <div
                      className={cx(
                        'h-full rounded-[3px]',
                        l.moyenne !== null && l.moyenne < 10 ? 'bg-barre-alerte' : 'bg-accent'
                      )}
                      style={{
                        width:
                          l.moyenne === null ? '0%' : `${((l.moyenne / 20) * 100).toFixed(0)}%`,
                      }}
                    />
                  </div>
                  <span className="text-right font-bold">{fmt(l.moyenne)}</span>
                </div>
              ))}
              {detail.length === 0 && <span className="text-meta text-encre-3">Aucun élève.</span>}
            </div>
          </>
        )}
      </div>
    </Coque>
  )
}

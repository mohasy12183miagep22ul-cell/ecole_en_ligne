import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import EtatVide from '~/components/ui/etat_vide'
import SelecteurEnfant from '~/components/portail/selecteur_enfant'
import { notifier } from '~/components/ui/toast'
import { fmt } from '~/lib/format'
import { useDemo } from '~/demo/store'
import { ANNEE, ECOLE, type Bulletin } from '~/demo/donnees'
import { donneesPortail } from '~/demo/portail'
import { Link } from '@adonisjs/inertia/react'

export const telechargerPdf = (b: Bulletin, prenom: string) =>
  notifier(`Bulletin_${b.libelle.replace(/ /g, '-')}_${b.annee}_${prenom}.pdf téléchargé`)

export default function AccueilPortail() {
  const st = useDemo()
  const { enfant, bulletins, courant, enAttente } = donneesPortail(st)
  const dernier = bulletins[0]
  const evolution =
    enfant.id === 'aminata'
      ? [
          ...[...bulletins.filter((b) => b.id !== 'cur')].reverse().map((b, i) => ({
            libelle: `T${i + 1} · 25-26`,
            v: b.mg,
            actuel: false,
          })),
          ...(courant ? [{ libelle: 'T1 · 26-27', v: courant.mg, actuel: true }] : []),
        ]
      : []

  return (
    <Coque espace="portail" titre="Accueil">
      <div className="flex flex-col gap-4">
        <SelecteurEnfant riche />

        <div className="flex flex-col gap-3.5 rounded-[20px] bg-accent p-5 text-white">
          <div className="flex items-center gap-3.5">
            <div className="flex size-[52px] items-center justify-center rounded-full bg-white/20 text-[18px] font-extrabold">
              {enfant.s.initiales}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-section-lg font-extrabold">{enfant.s.complet}</span>
              <span className="text-meta">
                {enfant.classe} · Matricule {enfant.s.matricule}
              </span>
            </div>
          </div>
          <span className="text-meta">
            {ECOLE} · Année {ANNEE}
          </span>
        </div>

        {enAttente && (
          <div className="flex gap-3 rounded-[14px] bg-info-fond p-3.5 text-meta leading-normal text-info-fort">
            <Icone nom="circle-info" className="mt-0.5" />
            <span>
              Le bulletin du 1er trimestre sera visible ici dès sa publication par l’établissement.
            </span>
          </div>
        )}

        {dernier ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
            <div className="flex flex-col gap-3.5 rounded-carte border border-bordure bg-white p-[18px]">
              <span className="text-leg font-bold tracking-[0.06em] text-encre-3 uppercase">
                Dernier bulletin délivré
              </span>
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-titre-carte font-bold">
                    {dernier.libelle} · {dernier.annee}
                  </span>
                  <span className="text-meta text-encre-3">
                    {dernier.classe} · publié le {dernier.publie}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[30px] font-extrabold text-accent">{fmt(dernier.mg)}</span>
                  <span className="text-meta text-encre-3"> /20</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-neutre px-2.5 py-1.5 text-leg font-semibold">
                  Rang {dernier.rang} / {dernier.effectif}
                </span>
                <span className="rounded-full bg-succes-fond px-2.5 py-1.5 text-leg font-semibold text-succes">
                  {dernier.decision}
                </span>
              </div>
              <div className="flex gap-2.5">
                <Link
                  route="portail.bulletin"
                  routeParams={{ id: dernier.id }}
                  className="flex h-[46px] flex-1 items-center justify-center rounded-bouton bg-accent text-corps font-bold text-white hover:text-white hover:no-underline"
                >
                  Consulter
                </Link>
                <button
                  type="button"
                  onClick={() => telechargerPdf(dernier, enfant.s.prenom)}
                  className="flex h-[46px] items-center gap-2 rounded-bouton border border-accent bg-white px-4 text-corps font-bold text-accent"
                >
                  <Icone nom="download" />
                  PDF
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 rounded-carte border border-bordure bg-white p-[18px]">
              <span className="text-leg font-bold tracking-[0.06em] text-encre-3 uppercase">
                Évolution de la moyenne générale
              </span>
              <div className="flex h-[150px] items-end gap-3">
                {evolution.map((b) => (
                  <div
                    key={b.libelle}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <span className="text-leg font-bold">{fmt(b.v)}</span>
                    <div
                      className={`w-full max-w-11 rounded-[8px_8px_4px_4px] ${b.actuel ? 'bg-accent' : 'bg-evolution'}`}
                      style={{ height: `${((b.v / 20) * 100).toFixed(0)}%` }}
                    />
                    <span className="text-micro whitespace-nowrap text-encre-3">{b.libelle}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EtatVide
            illustration="lecture"
            dimensions={[200, 150]}
            titre="Aucun bulletin délivré pour l’instant"
            texte={`Les résultats de ${enfant.s.prenom} apparaîtront après la publication du premier bulletin par l’établissement.`}
          />
        )}
      </div>
    </Coque>
  )
}

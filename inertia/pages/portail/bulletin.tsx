import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import EtatVide from '~/components/ui/etat_vide'
import { fmt, rang } from '~/lib/format'
import { useDemo } from '~/demo/store'
import { donneesPortail } from '~/demo/portail'
import { ECOLE, MATIERE, apprAuto } from '~/demo/donnees'
import { telechargerPdf } from './accueil'

export default function BulletinPortail({ id }: { id: string }) {
  const st = useDemo()
  const { enfant, bulletins } = donneesPortail(st)
  const b = bulletins.find((x) => x.id === id) ?? bulletins[0]
  const retour = { href: '/portail/bulletins', libelle: 'Mes bulletins' }

  if (!b) {
    return (
      <Coque espace="portail" titre="Bulletin" retour={retour}>
        <EtatVide illustration="vide" titre="Bulletin introuvable" />
      </Coque>
    )
  }

  return (
    <Coque espace="portail" titre="Bulletin" retour={retour}>
      <div className="flex max-w-[880px] flex-col gap-3.5">
        <div className="flex flex-col gap-3.5 rounded-carte border border-bordure bg-white p-[18px]">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-leg text-encre-3">{ECOLE}</span>
              <span className="text-[18px] font-extrabold">
                {b.libelle} · {b.annee}
              </span>
              <span className="text-meta text-encre-3">
                {enfant.s.complet} · {b.classe} · {enfant.s.matricule}
              </span>
            </div>
            {b.rectif ? (
              <span className="self-start rounded-full bg-attention-fond px-2.5 py-1.5 text-leg font-bold text-attention">
                Rectificatif n°{b.rectif}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5 rounded-bouton bg-accent-doux p-3">
              <span className="text-micro text-encre-2">Moyenne</span>
              <span className="text-section-lg font-extrabold text-accent">{fmt(b.mg)}</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-bouton bg-page p-3">
              <span className="text-micro text-encre-2">Rang</span>
              <span className="text-section-lg font-extrabold">
                {b.rang}
                <span className="text-leg font-medium text-encre-3"> / {b.effectif}</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-bouton bg-page p-3">
              <span className="text-micro text-encre-2">Décision</span>
              <span className="text-meta leading-[1.3] font-bold">{b.decision}</span>
            </div>
          </div>
        </div>

        {b.lignes.map((l) => {
          const m = MATIERE[l.code]
          return (
            <div
              key={l.code}
              className="flex flex-col gap-2 rounded-[14px] border border-bordure bg-white px-4 py-3.5"
            >
              <div className="flex items-center gap-2.5">
                <Icone nom={m.icone} className="w-[18px] text-accent" />
                <span className="flex-1 text-moyen font-bold">{m.nom}</span>
                <span className="text-section font-extrabold">
                  {l.v === null ? 'Non noté' : fmt(l.v)}
                </span>
              </div>
              {l.v !== null && (
                <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-leg text-encre-3">
                  <span>Coef. {m.coef}</span>
                  <span>Rang {rang(l.rang)}</span>
                  <span>Classe {fmt(l.moyenne)}</span>
                  <span>
                    Min {fmt(l.min)} · Max {fmt(l.max)}
                  </span>
                </div>
              )}
              <span className="text-meta leading-[1.45] text-encre-2 italic">
                « {l.appr || apprAuto(l.v)} »
              </span>
            </div>
          )
        })}

        <div className="flex flex-col gap-2.5 rounded-carte border border-bordure bg-white p-[18px]">
          <span className="text-leg font-bold tracking-[0.06em] text-encre-3 uppercase">
            Appréciation du conseil de classe
          </span>
          <p className="text-corps leading-[1.55]">{b.appr}</p>
          <span className="text-leg text-encre-3">
            Mariama Camara, cheffe d’établissement · délivré le {b.publie}
          </span>
        </div>

        <button
          type="button"
          onClick={() => telechargerPdf(b, enfant.s.prenom)}
          className="flex h-[50px] items-center justify-center gap-2.5 rounded-bouton bg-accent text-moyen font-bold text-white"
        >
          <Icone nom="download" />
          Télécharger le bulletin (PDF)
        </button>
      </div>
    </Coque>
  )
}

import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import EtatVide from '~/components/ui/etat_vide'
import SelecteurEnfant from '~/components/portail/selecteur_enfant'
import { fmt } from '~/lib/format'
import { useDemo } from '~/demo/store'
import { donneesPortail } from '~/demo/portail'
import { telechargerPdf } from './accueil'
import { Link } from '@adonisjs/inertia/react'

export default function BulletinsPortail() {
  const st = useDemo()
  const { enfant, bulletins, enAttente } = donneesPortail(st)

  return (
    <Coque espace="portail" titre="Mes bulletins">
      <div className="flex flex-col gap-3">
        <SelecteurEnfant />
        {enAttente && (
          <div className="flex items-center gap-3.5 rounded-carte border border-dashed border-pointille bg-bandeau p-4">
            <div className="flex size-[42px] items-center justify-center rounded-bouton bg-neutre text-encre-3">
              <Icone nom="hourglass-half" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-moyen font-bold">1er trimestre · 2026-2027</span>
              <span className="text-meta text-encre-3">
                En attente de publication par l’établissement
              </span>
            </div>
          </div>
        )}
        {bulletins.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-3.5 rounded-carte border border-bordure bg-white py-3.5 pr-3 pl-4"
          >
            <Link
              route="portail.bulletin"
              routeParams={{ id: b.id }}
              className="flex min-w-0 flex-1 items-center gap-3.5 text-left hover:no-underline"
            >
              <div className="flex size-[42px] shrink-0 items-center justify-center rounded-bouton bg-accent-doux text-accent">
                <Icone nom="file-lines" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-moyen font-bold text-encre">
                  {b.libelle} · {b.annee}
                </span>
                <span className="text-leg text-encre-3">
                  {b.classe} · publié le {b.publie}
                </span>
              </div>
              <span className="text-section font-extrabold text-encre">{fmt(b.mg)}</span>
            </Link>
            <button
              type="button"
              aria-label="Télécharger le PDF"
              onClick={() => telechargerPdf(b, enfant.s.prenom)}
              className="size-11 rounded-bouton border border-bordure-champ bg-white text-accent"
            >
              <Icone nom="download" />
            </button>
          </div>
        ))}
        {bulletins.length === 0 && (
          <EtatVide
            illustration="vide"
            titre={`Aucun bulletin pour ${enfant.s.prenom}`}
            texte="Les bulletins délivrés de l’année et des années passées s’afficheront ici."
          />
        )}
      </div>
    </Coque>
  )
}

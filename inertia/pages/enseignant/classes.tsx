import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import EtatVide from '~/components/ui/etat_vide'
import { cx } from '~/lib/format'
import { Link } from '@adonisjs/inertia/react'

type Carte = {
  id: number
  classe: string
  niveau: string
  matiere: string
  effectif: number
  evaluations: number
  professeurPrincipal: boolean
  enCours: { id: number; titre: string; faits: number; effectif: number } | null
}

export default function MesClasses({
  annee,
  periode,
  cartes,
}: {
  annee: { id: number; libelle: string } | null
  periode: { libelle: string; fin: string; ouverte: boolean } | null
  cartes: Carte[]
}) {
  return (
    <Coque espace="enseignant" titre="Mes classes">
      <div className="flex flex-col gap-4">
        {periode && (
          <div
            className={cx(
              'flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-meta font-medium',
              periode.ouverte ? 'bg-succes-fond text-succes' : 'bg-attention-fond text-attention'
            )}
          >
            <Icone nom={periode.ouverte ? 'door-open' : 'lock'} />
            {periode.ouverte
              ? `Saisie du ${periode.libelle} ouverte jusqu’au ${periode.fin}`
              : `Saisie du ${periode.libelle} fermée (fenêtre jusqu’au ${periode.fin})`}
          </div>
        )}
        {cartes.length === 0 ? (
          <EtatVide
            icone="chalkboard-user"
            titre={annee ? 'Aucune classe confiée' : 'Aucune année scolaire active'}
            texte={
              annee
                ? `Vous n’avez pas d’affectation en ${annee.libelle}. L’administration vous attribue vos classes et matières.`
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">
            {cartes.map((c) => (
              <Link
                key={c.id}
                route="enseignant.evaluations"
                qs={{ affectation: c.id }}
                className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-[18px] text-left transition hover:border-accent hover:no-underline"
              >
                <div className="flex w-full items-center gap-3">
                  <div className="flex size-[46px] items-center justify-center rounded-bouton bg-accent-doux text-moyen font-extrabold text-accent">
                    {c.classe}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-titre-carte font-bold text-encre">
                      Classe de {c.classe}
                    </span>
                    <span className="text-leg text-encre-3">
                      {c.matiere} · {c.effectif} élèves · {c.evaluations} évaluation
                      {c.evaluations > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Icone nom="chevron-right" className="text-encre-4" />
                </div>
                {c.professeurPrincipal && (
                  <span className="self-start rounded-full bg-neutre px-2.5 py-[5px] text-leg font-semibold text-encre-2">
                    <Icone nom="star" className="mr-1.5 text-accent" />
                    Professeur principal
                  </span>
                )}
                {c.enCours && (
                  <div className="flex w-full flex-col gap-1.5">
                    <div className="flex justify-between text-leg text-encre-2">
                      <span>{c.enCours.titre}</span>
                      <span className="font-bold">
                        {c.enCours.faits}/{c.enCours.effectif}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-[3px] bg-neutre">
                      <div
                        className="h-full rounded-[3px] bg-accent"
                        style={{
                          width: `${c.enCours.effectif ? ((c.enCours.faits / c.enCours.effectif) * 100).toFixed(0) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Coque>
  )
}

import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Pastille from '~/components/ui/pastille'
import EtatVide from '~/components/ui/etat_vide'
import { type NomIcone } from '~/lib/icones'
import {
  dateFr,
  ETATS_ANNEE,
  ETATS_SAISIE,
  jourMois,
  type EtatAnnee,
  type EtatSaisie,
} from '~/lib/structure'
import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'

type Props = {
  statistiques: { niveaux: number; classes: number; matieres: number; comptesActifs: number }
  annees: Array<{
    id: number
    libelle: string
    etat: EtatAnnee
    decoupage: 'trimestres' | 'semestres'
    classes: number
  }>
  periodes: Array<{
    id: number
    libelle: string
    debutSaisie: string
    finSaisie: string
    etatSaisie: EtatSaisie
  }>
}

const sousTitre = (a: Props['annees'][number]) =>
  a.etat === 'cloturee'
    ? 'Lecture seule'
    : `${a.decoupage === 'trimestres' ? 'Trimestres' : 'Semestres'} · ${a.classes} classe${a.classes > 1 ? 's' : ''}`

export default function AccueilAdmin({ statistiques, annees, periodes }: Props) {
  const { props } = usePage()
  const active = props.anneeActive
  const tuiles: Array<[string, number, NomIcone]> = [
    ['Niveaux', statistiques.niveaux, 'layer-group'],
    ['Classes', statistiques.classes, 'door-open'],
    ['Matières', statistiques.matieres, 'book'],
    ['Comptes actifs', statistiques.comptesActifs, 'users'],
  ]

  return (
    <Coque espace="admin" titre="Tableau de bord">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3">
          {tuiles.map(([l, v, i]) => (
            <div
              key={l}
              className="flex items-center gap-3 rounded-carte border border-bordure bg-white p-4"
            >
              <div className="flex size-10 items-center justify-center rounded-bouton bg-accent-doux text-accent">
                <Icone nom={i} />
              </div>
              <div className="flex flex-col">
                <span className="text-section-lg font-extrabold">{v}</span>
                <span className="text-leg text-encre-3">{l}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
          <div className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-[18px]">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-moyen font-bold">Années scolaires</span>
              <Link
                route="admin.annees"
                className="flex h-9 items-center rounded-champ border border-accent bg-white px-3 text-meta font-bold text-accent hover:no-underline"
              >
                <Icone nom="reg-copy" className="mr-1.5" />
                Gérer et dupliquer
              </Link>
            </div>
            {annees.map((a) => (
              <div key={a.id} className="flex items-center gap-3 border-t border-separateur py-2.5">
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-corps font-bold">{a.libelle}</span>
                  <span className="text-leg text-encre-3">{sousTitre(a)}</span>
                </div>
                <Pastille etat={ETATS_ANNEE[a.etat].etat} taille="moyenne">
                  {ETATS_ANNEE[a.etat].libelle}
                </Pastille>
              </div>
            ))}
            {annees.length === 0 && (
              <EtatVide icone="calendar-days" titre="Aucune année scolaire" cadre={false} />
            )}
            <span className="text-leg text-encre-3">
              Une seule année active à la fois · une année clôturée est en lecture seule définitive.
            </span>
          </div>

          <div className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-[18px]">
            <span className="text-moyen font-bold">
              {active ? `Périodes ${active.libelle} · fenêtres de saisie` : 'Périodes'}
            </span>
            {periodes.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-t border-separateur py-2.5">
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-corps font-bold">{p.libelle}</span>
                  <span className="text-leg text-encre-3">
                    {jourMois(p.debutSaisie)} → {dateFr(p.finSaisie)}
                  </span>
                </div>
                <Pastille etat={ETATS_SAISIE[p.etatSaisie].etat} taille="moyenne">
                  {ETATS_SAISIE[p.etatSaisie].libelle}
                </Pastille>
              </div>
            ))}
            {!active && (
              <EtatVide
                icone="calendar-days"
                titre="Aucune année active"
                texte="Activez une année en préparation pour ouvrir les saisies."
                cadre={false}
              />
            )}
          </div>
        </div>
      </div>
    </Coque>
  )
}

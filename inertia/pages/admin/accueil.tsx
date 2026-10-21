import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Pastille, { type Etat } from '~/components/ui/pastille'
import { notifier } from '~/components/ui/toast'
import { useFeuille } from '~/components/ui/feuille'
import { type NomIcone } from '~/lib/icones'
import { journaliser } from '~/demo/store'
import { usePage } from '@inertiajs/react'

const STATS: Array<[string, string, NomIcone]> = [
  ['Niveaux', '7', 'layer-group'],
  ['Classes', '18', 'door-open'],
  ['Matières', '12', 'book'],
  ['Comptes actifs', '214', 'users'],
]
const ANNEES: Array<[string, string, Etat, string]> = [
  ['2026-2027', 'Active', 'succes', 'Trimestres · 18 classes'],
  ['2027-2028', 'En préparation', 'info', 'Non créée'],
  ['2025-2026', 'Clôturée', 'verrou', 'Lecture seule'],
]
const PERIODES: Array<[string, string, string, Etat]> = [
  ['1er trimestre', '01/09 → 15/12/2026', 'Saisie ouverte', 'succes'],
  ['2e trimestre', '05/01 → 27/03/2027', 'À venir', 'brouillon'],
  ['3e trimestre', '06/04 → 26/06/2027', 'À venir', 'brouillon'],
]

export default function AccueilAdmin() {
  const { props } = usePage()
  const [feuille, ouvrir] = useFeuille()

  return (
    <Coque espace="admin" titre="Tableau de bord">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3">
          {STATS.map(([l, v, i]) => (
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
              <button
                type="button"
                onClick={() =>
                  ouvrir({
                    titre: 'Dupliquer 2026-2027 vers 2027-2028 ?',
                    texte:
                      'Niveaux, matières, coefficients, classes et affectations seront repris sur la nouvelle année, à corriger ensuite au cas par cas.',
                    lignes: [
                      ['Classes', '18'],
                      ['Affectations', '146'],
                    ],
                    libelleConfirmer: 'Dupliquer',
                    onConfirmer: () => {
                      journaliser(
                        props.user?.fullName ?? '',
                        'Duplication d’année',
                        '2026-2027 → 2027-2028',
                        '',
                        'En préparation'
                      )
                      notifier('Année 2027-2028 créée en préparation')
                    },
                  })
                }
                className="h-9 rounded-champ border border-accent bg-white px-3 text-meta font-bold text-accent"
              >
                <Icone nom="reg-copy" className="mr-1.5" />
                Dupliquer
              </button>
            </div>
            {ANNEES.map(([a, s, e, sous]) => (
              <div key={a} className="flex items-center gap-3 border-t border-separateur py-2.5">
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-corps font-bold">{a}</span>
                  <span className="text-leg text-encre-3">{sous}</span>
                </div>
                <Pastille etat={e} taille="moyenne">
                  {s}
                </Pastille>
              </div>
            ))}
            <span className="text-leg text-encre-3">
              Une seule année active à la fois · une année clôturée est en lecture seule définitive.
            </span>
          </div>
          <div className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-[18px]">
            <span className="text-moyen font-bold">Périodes 2026-2027 · fenêtres de saisie</span>
            {PERIODES.map(([l, d, s, e]) => (
              <div key={l} className="flex items-center gap-3 border-t border-separateur py-2.5">
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-corps font-bold">{l}</span>
                  <span className="text-leg text-encre-3">{d}</span>
                </div>
                <Pastille etat={e} taille="moyenne">
                  {s}
                </Pastille>
              </div>
            ))}
          </div>
        </div>
      </div>
      {feuille}
    </Coque>
  )
}

import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import SelecteurEnfant from '~/components/portail/selecteur_enfant'
import { useDemo } from '~/demo/store'
import { donneesPortail } from '~/demo/portail'

const TUTEURS = [
  { nom: 'Fatoumata Diallo', lien: 'Mère · tutrice principale', tel: '+224 622 14 87 30' },
  { nom: 'Mamadou Diallo', lien: 'Père', tel: '+224 664 02 55 19' },
]

export default function DossierPortail() {
  const st = useDemo()
  const { enfant, estAminata } = donneesPortail(st)
  const s = enfant.s
  const identite: Array<[string, string]> = [
    ['Nom', s.nom],
    ['Prénoms', s.prenom],
    ['Matricule', s.matricule],
    ['Date de naissance', s.naissance],
    ['Lieu de naissance', 'Conakry'],
    ['Classe 2026-2027', enfant.classe],
    ['Statut', s.statut],
    ['Redoublant', s.redoublant ? 'Oui' : 'Non'],
  ]
  const parcours = estAminata
    ? [
        ['2026-2027', '3e A', 'Validée'],
        ['2025-2026', '4e A', 'Validée'],
        ['2024-2025', '5e B', 'Validée'],
      ]
    : [['2026-2027', '6e B', 'Validée']]

  return (
    <Coque espace="portail" titre="Informations du dossier">
      <div className="flex flex-col gap-3.5">
        <SelecteurEnfant />
        <div className="flex items-center gap-2.5 rounded-bouton bg-neutre px-3.5 py-3 text-meta text-encre-2">
          <Icone nom="reg-eye" />
          Lecture seule — pour toute correction, contactez le secrétariat.
        </div>
        <div className="flex flex-col gap-3.5 rounded-carte border border-bordure bg-white p-[18px]">
          <span className="text-moyen font-bold">Identité et scolarité</span>
          <dl className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-3.5">
            {identite.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-[3px]">
                <dt className="text-leg text-encre-3">{k}</dt>
                <dd className="text-moyen font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-[18px]">
          <span className="text-moyen font-bold">Tuteurs</span>
          {TUTEURS.map((t) => (
            <div key={t.nom} className="flex items-center gap-3 border-t border-separateur pt-2.5">
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-corps font-bold">{t.nom}</span>
                <span className="text-leg text-encre-3">{t.lien}</span>
              </div>
              <span className="text-meta font-semibold">{t.tel}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-[18px]">
          <span className="text-moyen font-bold">Parcours</span>
          {parcours.map(([a, c, e]) => (
            <div
              key={a}
              className="flex justify-between border-t border-separateur pt-2.5 text-corps"
            >
              <span className="font-semibold">
                {a} · {c}
              </span>
              <span className="font-semibold text-succes">{e}</span>
            </div>
          ))}
        </div>
      </div>
    </Coque>
  )
}

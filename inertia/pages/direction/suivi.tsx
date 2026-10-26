import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Feuille from '~/components/ui/feuille'
import EtatVide from '~/components/ui/etat_vide'
import Champ from '~/components/ui/champ'
import { cx } from '~/lib/format'
import { router } from '@inertiajs/react'
import { useState } from 'react'

type Ligne = {
  id: number
  classe: string
  matiere: string
  enseignant: string
  brouillons: number
  soumises: number
  validees: number
  derogation: string | null
}
type Choix = {
  periodes: Array<{ id: number; libelle: string }>
  periode: { id: number; libelle: string; debut: string; fin: string } | null
  classes: Array<{ id: number; libelle: string }>
  classe: number | null
}

const filtre = 'h-9 shrink-0 rounded-champ border border-bordure-champ bg-white px-2 text-meta'
const chiffre = 'w-16 text-center text-meta font-bold'

/** Suivi des saisies par classe et matière ; dérogations à la fenêtre de saisie (RG13). */
export default function SuiviSaisies({ choix, lignes }: { choix: Choix | null; lignes: Ligne[] }) {
  const [cible, setCible] = useState<Ligne | null>(null)
  const [jusquAu, setJusquAu] = useState('')
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')

  if (!choix || !choix.periode) {
    return (
      <Coque espace="direction" titre="Suivi des saisies">
        <EtatVide icone="calendar-days" titre="Aucune année scolaire active" />
      </Coque>
    )
  }
  const periode = choix.periode
  const aller = (modif: Record<string, number | null>) =>
    router.get('/direction/suivi', {
      periode: periode.id,
      classe: choix.classe ?? undefined,
      ...modif,
    })

  return (
    <Coque espace="direction" titre="Suivi des saisies">
      <div className="flex max-w-[960px] flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Période"
            value={periode.id}
            onChange={(e) => aller({ periode: Number(e.target.value) })}
            className={filtre}
          >
            {choix.periodes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.libelle}
              </option>
            ))}
          </select>
          <select
            aria-label="Classe"
            value={choix.classe ?? ''}
            onChange={(e) => aller({ classe: e.target.value ? Number(e.target.value) : null })}
            className={filtre}
          >
            <option value="">Toutes les classes</option>
            {choix.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.libelle}
              </option>
            ))}
          </select>
          <span className="ml-auto text-leg text-encre-3">
            Fenêtre de saisie du {periode.debut} au {periode.fin}
          </span>
        </div>

        <div className="overflow-x-auto rounded-carte border border-bordure bg-white">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-entete text-leg font-semibold text-encre-3">
              <tr>
                <th className="px-3.5 py-3">Classe · matière</th>
                <th className="px-2 py-3">Enseignant</th>
                <th className="w-16 px-1 py-3 text-center">Brouillon</th>
                <th className="w-16 px-1 py-3 text-center">Soumises</th>
                <th className="w-16 px-1 py-3 text-center">Validées</th>
                <th className="px-3.5 py-3 text-right">Saisie hors fenêtre</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => {
                const aucune = l.brouillons + l.soumises + l.validees === 0
                return (
                  <tr key={l.id} className="border-t border-separateur text-meta">
                    <td className="px-3.5 py-2.5">
                      <strong>{l.classe}</strong> · {l.matiere}
                      {aucune && (
                        <span className="ml-2 text-leg font-semibold text-attention">
                          aucune évaluation
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-encre-2">{l.enseignant}</td>
                    <td className={chiffre}>{l.brouillons}</td>
                    <td className={cx(chiffre, l.soumises > 0 && 'text-attention')}>
                      {l.soumises}
                    </td>
                    <td className={cx(chiffre, l.validees > 0 && 'text-succes')}>{l.validees}</td>
                    <td className="px-3.5 py-2.5 text-right">
                      {l.derogation ? (
                        <span className="text-leg font-semibold text-info">
                          Dérogation jusqu’au {l.derogation}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCible(l)
                            setJusquAu('')
                            setMotif('')
                            setErreur('')
                          }}
                          className="h-8 rounded-[8px] border border-bordure-champ bg-white px-2.5 text-leg font-semibold text-encre-2"
                        >
                          <Icone nom="unlock" className="mr-1.5" />
                          Dérogation
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {lignes.length === 0 && (
            <p className="p-5 text-center text-meta text-encre-3">
              Aucune affectation pour cette sélection.
            </p>
          )}
        </div>
      </div>

      <Feuille
        ouverte={cible !== null}
        titre="Accorder une dérogation de saisie"
        texte={
          cible
            ? `${cible.enseignant} pourra saisir en ${cible.classe} · ${cible.matiere} pour le ${periode.libelle} jusqu’à la date choisie. L’action est journalisée.`
            : undefined
        }
        libelleConfirmer="Accorder"
        onFermer={() => setCible(null)}
        onConfirmer={() => {
          if (!cible) return
          if (!jusquAu) return setErreur('Choisissez la date de fin.')
          if (motif.trim().length < 5) return setErreur('Indiquez un motif (5 caractères minimum).')
          router.post(
            '/direction/derogations',
            { affectationId: cible.id, periodeId: periode.id, jusquAu, motif: motif.trim() },
            { preserveScroll: true, onSuccess: () => setCible(null) }
          )
        }}
      >
        <Champ
          libelle="Jusqu’au *"
          type="date"
          value={jusquAu}
          onChange={(e) => setJusquAu(e.target.value)}
        />
        <Champ
          libelle="Motif * (journalisé)"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          maxLength={250}
        />
        {erreur && (
          <span role="alert" className="text-leg text-erreur">
            {erreur}
          </span>
        )}
      </Feuille>
    </Coque>
  )
}

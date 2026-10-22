import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import { Selection } from '~/components/ui/champ'
import EtatVide from '~/components/ui/etat_vide'
import { useFeuille } from '~/components/ui/feuille'
import SelecteurAnnee from '~/components/admin/selecteur_annee'
import { type EtatAnnee } from '~/lib/structure'
import { Form } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { useState } from 'react'

type Annee = { id: number; libelle: string; etat: EtatAnnee }
type Affectation = {
  id: number
  enseignantId: number
  enseignant: string
  classe: string
  matiere: string
  matiereCode: string
}

export default function Affectations({
  annee,
  annees,
  enseignants,
  classes,
  matieres,
  programme,
  affectations,
}: {
  annee: Annee | null
  annees: Annee[]
  enseignants: Array<{ id: number; nom: string; sousTitre: string | null }>
  classes: Array<{ id: number; libelle: string; niveauId: number }>
  matieres: Array<{ id: number; code: string; libelle: string }>
  programme: Array<{ niveauId: number; matiereId: number }>
  affectations: Affectation[]
}) {
  const [classeId, setClasseId] = useState<number | undefined>(classes[0]?.id)
  const [feuille, ouvrir] = useFeuille()

  if (!annee) {
    return (
      <Coque espace="admin" titre="Affectations">
        <EtatVide icone="calendar-days" titre="Aucune année scolaire" />
      </Coque>
    )
  }

  const modifiable = annee.etat !== 'cloturee'
  // Seules les matières au programme du niveau de la classe sont proposées
  // (confort d'affichage : le serveur le vérifie aussi, RG3).
  const niveauId = classes.find((c) => c.id === classeId)?.niveauId
  const matieresClasse = matieres.filter((m) =>
    programme.some((p) => p.niveauId === niveauId && p.matiereId === m.id)
  )
  const parEnseignant = enseignants
    .map((e) => ({ e, liste: affectations.filter((a) => a.enseignantId === e.id) }))
    .filter((g) => g.liste.length > 0)

  return (
    <Coque espace="admin" titre="Affectations">
      <div className="flex max-w-[880px] flex-col gap-3.5">
        <SelecteurAnnee url="/admin/affectations" annees={annees} courante={annee} />

        <div className="flex gap-2.5 rounded-bouton bg-info-fond px-3.5 py-3 text-meta leading-[1.45] text-info-fort">
          <Icone nom="circle-info" className="mt-0.5" />
          Une affectation (enseignant + classe + matière) ouvre la saisie des notes sur ce seul
          périmètre, pour l’année {annee.libelle}.
        </div>

        {modifiable && classes.length > 0 && (
          <Form
            route="admin.affectations.store"
            routeParams={{ anneeId: annee.id }}
            options={{ preserveScroll: true }}
            transform={(d) => ({
              enseignantId: Number(d.enseignantId),
              classeId: Number(d.classeId),
              matiereId: Number(d.matiereId),
            })}
            className="flex flex-col gap-3.5 rounded-carte border border-bordure bg-white p-5"
          >
            {({ processing }) => (
              <>
                <span className="text-titre-carte font-extrabold">Nouvelle affectation</span>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
                  <Selection libelle="Enseignant" name="enseignantId">
                    {enseignants.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nom}
                        {e.sousTitre ? ` · ${e.sousTitre}` : ''}
                      </option>
                    ))}
                  </Selection>
                  <Selection
                    libelle="Classe"
                    name="classeId"
                    value={classeId}
                    onChange={(e) => setClasseId(Number(e.target.value))}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.libelle}
                      </option>
                    ))}
                  </Selection>
                  <Selection
                    libelle="Matière"
                    name="matiereId"
                    aide={
                      matieresClasse.length === 0
                        ? 'Aucune matière au programme de ce niveau.'
                        : undefined
                    }
                  >
                    {matieresClasse.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.libelle}
                      </option>
                    ))}
                  </Selection>
                </div>
                <button
                  type="submit"
                  disabled={processing || matieresClasse.length === 0 || enseignants.length === 0}
                  className="h-[46px] self-start rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-50"
                >
                  Affecter
                </button>
              </>
            )}
          </Form>
        )}

        {parEnseignant.map(({ e, liste }) => (
          <section
            key={e.id}
            aria-label={e.nom}
            className="overflow-hidden rounded-carte border border-bordure bg-white"
          >
            <div className="flex items-baseline justify-between gap-3 bg-entete px-4 py-2.5">
              <span className="text-corps font-bold">{e.nom}</span>
              <span className="text-leg text-encre-3">
                {liste.length} affectation{liste.length > 1 ? 's' : ''}
              </span>
            </div>
            {liste.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 border-t border-separateur px-4 py-2.5"
              >
                <span className="w-[52px] text-corps font-extrabold">{a.classe}</span>
                <span className="flex-1 text-meta text-encre-2">
                  {a.matiere} <span className="text-encre-4">· {a.matiereCode}</span>
                </span>
                {modifiable && (
                  <button
                    type="button"
                    aria-label={`Retirer l’affectation ${a.classe} · ${a.matiere} de ${a.enseignant}`}
                    onClick={() =>
                      ouvrir({
                        titre: 'Retirer cette affectation ?',
                        texte: `${a.enseignant} ne pourra plus saisir de notes en ${a.matiere} pour la ${a.classe}. L’action est journalisée.`,
                        danger: true,
                        libelleConfirmer: 'Retirer',
                        onConfirmer: () =>
                          router.delete(`/admin/affectations/${a.id}`, { preserveScroll: true }),
                      })
                    }
                    className="flex size-9 items-center justify-center rounded-champ text-encre-3 hover:bg-erreur-fond hover:text-erreur"
                  >
                    <Icone nom="trash-can" />
                  </button>
                )}
              </div>
            ))}
          </section>
        ))}

        {affectations.length === 0 && (
          <EtatVide
            icone="chalkboard-user"
            titre={`Aucune affectation en ${annee.libelle}`}
            texte={classes.length === 0 ? 'Créez d’abord les classes de l’année.' : undefined}
          />
        )}
      </div>
      {feuille}
    </Coque>
  )
}

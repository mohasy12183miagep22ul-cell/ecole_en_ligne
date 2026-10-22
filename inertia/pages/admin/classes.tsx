import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Champ, { Selection } from '~/components/ui/champ'
import EtatVide from '~/components/ui/etat_vide'
import SelecteurAnnee from '~/components/admin/selecteur_annee'
import { type EtatAnnee } from '~/lib/structure'
import { Form } from '@adonisjs/inertia/react'
import { useState } from 'react'

type Annee = { id: number; libelle: string; etat: EtatAnnee }
type Classe = {
  id: number
  libelle: string
  niveauId: number
  niveau: string
  capacite: number
  salle: string | null
  professeurPrincipalId: number | null
  professeurPrincipal: string | null
}
type Choix = { id: number; libelle?: string; nom?: string }

/** Champs d'une classe, communs à la création et à la modification. */
function ChampsClasse({
  errors,
  niveaux,
  enseignants,
  classe,
}: {
  errors: Record<string, string>
  niveaux: Choix[]
  enseignants: Choix[]
  classe?: Classe
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-3.5">
      <Champ
        libelle="Libellé *"
        name="libelle"
        placeholder="6e C"
        defaultValue={classe?.libelle}
        erreur={errors.libelle && 'Libellé obligatoire.'}
      />
      <Selection
        libelle="Niveau *"
        name="niveauId"
        defaultValue={classe?.niveauId ?? niveaux[0]?.id}
        erreur={errors.niveauId && 'Choisissez un niveau.'}
      >
        {niveaux.map((n) => (
          <option key={n.id} value={n.id}>
            {n.libelle}
          </option>
        ))}
      </Selection>
      <Champ
        libelle="Capacité *"
        name="capacite"
        type="number"
        min={1}
        defaultValue={classe?.capacite ?? 40}
        erreur={errors.capacite && 'Nombre entre 1 et 200.'}
      />
      <Champ libelle="Salle" name="salle" defaultValue={classe?.salle ?? ''} />
      <Selection
        libelle="Professeur principal"
        name="professeurPrincipalId"
        defaultValue={classe?.professeurPrincipalId ?? ''}
      >
        <option value="">— Aucun —</option>
        {enseignants.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nom}
          </option>
        ))}
      </Selection>
    </div>
  )
}

/** Valeurs brutes du formulaire (les sélecteurs envoient des chaînes). */
type SaisieClasse = {
  libelle: string
  niveauId: string | number
  capacite: string | number
  salle?: string | null
  professeurPrincipalId?: string | number | null
}

/** Conversion avant envoi : vide → pas de professeur principal ni de salle. */
const nettoyer = (data: SaisieClasse) => ({
  libelle: data.libelle,
  niveauId: Number(data.niveauId),
  capacite: Number(data.capacite),
  salle: data.salle ? data.salle : null,
  professeurPrincipalId: data.professeurPrincipalId ? Number(data.professeurPrincipalId) : null,
})

function LigneClasse({
  c,
  modifiable,
  niveaux,
  enseignants,
}: {
  c: Classe
  modifiable: boolean
  niveaux: Choix[]
  enseignants: Choix[]
}) {
  const [edition, setEdition] = useState(false)
  return (
    <div className="border-t border-separateur px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex size-[46px] items-center justify-center rounded-bouton bg-accent-doux text-moyen font-extrabold text-accent">
          {c.libelle}
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-0.5">
          <span className="text-corps font-bold">Classe de {c.libelle}</span>
          <span className="text-leg text-encre-3">
            Capacité {c.capacite}
            {c.salle && ` · ${c.salle}`} · PP : {c.professeurPrincipal ?? 'non désigné'}
          </span>
        </div>
        {modifiable && (
          <button
            type="button"
            aria-expanded={edition}
            onClick={() => setEdition((v) => !v)}
            className="h-9 rounded-champ border border-bordure-champ bg-white px-3 text-meta font-semibold text-encre-2"
          >
            {edition ? 'Fermer' : 'Modifier'}
          </button>
        )}
      </div>
      {edition && (
        <Form
          route="admin.classes.update"
          routeParams={{ id: c.id }}
          transform={nettoyer}
          options={{ preserveScroll: true }}
          onSuccess={() => setEdition(false)}
          className="mt-3 flex flex-col gap-3 rounded-bouton bg-entete p-3.5"
        >
          {({ errors, processing }) => (
            <>
              <ChampsClasse
                errors={errors}
                niveaux={niveaux}
                enseignants={enseignants}
                classe={c}
              />
              <button
                type="submit"
                disabled={processing}
                className="h-10 self-start rounded-champ bg-accent px-4 text-meta font-bold text-white disabled:opacity-60"
              >
                Enregistrer
              </button>
            </>
          )}
        </Form>
      )}
    </div>
  )
}

export default function Classes({
  annee,
  annees,
  niveaux,
  enseignants,
  classes,
}: {
  annee: Annee | null
  annees: Annee[]
  niveaux: Choix[]
  enseignants: Choix[]
  classes: Classe[]
}) {
  const [creation, setCreation] = useState(false)

  if (!annee) {
    return (
      <Coque espace="admin" titre="Classes">
        <EtatVide
          icone="calendar-days"
          titre="Aucune année scolaire"
          texte="Créez d’abord une année scolaire : les classes sont rattachées à une année."
        />
      </Coque>
    )
  }

  const modifiable = annee.etat !== 'cloturee'
  const parNiveau = niveaux
    .map((n) => ({ niveau: n, classes: classes.filter((c) => c.niveauId === n.id) }))
    .filter((g) => g.classes.length > 0)

  return (
    <Coque espace="admin" titre="Classes">
      <div className="flex max-w-[880px] flex-col gap-3.5">
        <SelecteurAnnee url="/admin/classes" annees={annees} courante={annee} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-leg text-encre-3">
            {classes.length} classe{classes.length > 1 ? 's' : ''} en {annee.libelle} · les niveaux
            sont permanents, les classes sont recréées chaque année.
          </span>
          {modifiable && (
            <button
              type="button"
              aria-expanded={creation}
              onClick={() => setCreation((v) => !v)}
              className="h-[42px] rounded-champ border border-accent bg-white px-4 text-corps font-bold text-accent"
            >
              <Icone nom={creation ? 'xmark' : 'plus'} className="mr-2" />
              {creation ? 'Fermer' : 'Nouvelle classe'}
            </button>
          )}
        </div>

        {creation && (
          <Form
            route="admin.classes.store"
            routeParams={{ anneeId: annee.id }}
            transform={nettoyer}
            onSuccess={() => setCreation(false)}
            className="flex flex-col gap-4 rounded-carte border border-bordure bg-white p-5"
          >
            {({ errors, processing }) => (
              <>
                <span className="text-titre-carte font-extrabold">
                  Nouvelle classe · {annee.libelle}
                </span>
                <ChampsClasse errors={errors} niveaux={niveaux} enseignants={enseignants} />
                <button
                  type="submit"
                  disabled={processing}
                  className="h-[46px] self-start rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-60"
                >
                  Créer la classe
                </button>
              </>
            )}
          </Form>
        )}

        {parNiveau.map(({ niveau, classes: liste }) => (
          <section
            key={niveau.id}
            aria-label={`Niveau ${niveau.libelle}`}
            className="overflow-hidden rounded-carte border border-bordure bg-white"
          >
            <div className="bg-entete px-4 py-2.5 text-micro font-bold tracking-[0.06em] text-encre-3 uppercase">
              Niveau {niveau.libelle} · {liste.length} classe{liste.length > 1 ? 's' : ''}
            </div>
            {liste.map((c) => (
              <LigneClasse
                key={c.id}
                c={c}
                modifiable={modifiable}
                niveaux={niveaux}
                enseignants={enseignants}
              />
            ))}
          </section>
        ))}

        {classes.length === 0 && (
          <EtatVide
            icone="door-open"
            titre={`Aucune classe en ${annee.libelle}`}
            texte={
              modifiable
                ? 'Créez les classes une à une, ou dupliquez l’année précédente depuis l’écran Années.'
                : undefined
            }
          />
        )}
      </div>
    </Coque>
  )
}

import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Champ, { Selection } from '~/components/ui/champ'
import Pastille from '~/components/ui/pastille'
import EtatVide from '~/components/ui/etat_vide'
import { useFeuille } from '~/components/ui/feuille'
import { dateFr, ETATS_ANNEE, ETATS_SAISIE, type EtatAnnee, type EtatSaisie } from '~/lib/structure'
import { Form } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { useState } from 'react'

type Periode = {
  id: number
  libelle: string
  ordre: number
  debutSaisie: string
  finSaisie: string
  etatSaisie: EtatSaisie
}
type Annee = {
  id: number
  libelle: string
  etat: EtatAnnee
  decoupage: 'trimestres' | 'semestres'
  dateDebut: string
  dateFin: string
  classes: number
  periodes: Periode[]
}

/** Libellé de l'année suivante : « 2026-2027 » → « 2027-2028 ». */
const suivante = (libelle: string) => {
  const [a, b] = libelle.split('-').map(Number)
  return `${a + 1}-${b + 1}`
}
const decalerAn = (iso: string) => `${Number(iso.slice(0, 4)) + 1}${iso.slice(4)}`

/** Champs d'une nouvelle année ; `base` pré-remplit pour une duplication. */
function ChampsAnnee({ errors, base }: { errors: Record<string, string>; base?: Annee }) {
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3.5">
        <Champ
          libelle="Libellé *"
          name="libelle"
          placeholder="2027-2028"
          defaultValue={base ? suivante(base.libelle) : ''}
          erreur={
            errors.libelle &&
            (errors.libelle.includes('taken') || errors.libelle.includes('already')
              ? 'Cette année existe déjà.'
              : 'Format attendu : 2027-2028.')
          }
        />
        <Champ
          libelle="Début *"
          name="dateDebut"
          type="date"
          defaultValue={base ? decalerAn(base.dateDebut) : ''}
          erreur={errors.dateDebut && 'Date invalide.'}
        />
        <Champ
          libelle="Fin *"
          name="dateFin"
          type="date"
          defaultValue={base ? decalerAn(base.dateFin) : ''}
          erreur={errors.dateFin && 'Date invalide.'}
        />
        <Selection
          libelle="Découpage"
          name="decoupage"
          defaultValue={base?.decoupage ?? 'trimestres'}
        >
          <option value="trimestres">Trimestres</option>
          <option value="semestres">Semestres</option>
        </Selection>
      </div>
    </>
  )
}

function LignePeriode({ p, modifiable }: { p: Periode; modifiable: boolean }) {
  return (
    <Form
      route="admin.periodes.update"
      routeParams={{ id: p.id }}
      options={{ preserveScroll: true }}
      className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] items-end gap-2.5 border-t border-separateur py-3"
    >
      {({ errors, processing }) => (
        <>
          <Champ
            libelle="Période"
            name="libelle"
            defaultValue={p.libelle}
            disabled={!modifiable}
            erreur={errors.libelle && 'Libellé obligatoire.'}
          />
          <Champ
            libelle="Début de saisie"
            name="debutSaisie"
            type="date"
            defaultValue={p.debutSaisie}
            disabled={!modifiable}
          />
          <Champ
            libelle="Fin de saisie"
            name="finSaisie"
            type="date"
            defaultValue={p.finSaisie}
            disabled={!modifiable}
          />
          <div className="flex h-12 items-center gap-2">
            <Pastille etat={ETATS_SAISIE[p.etatSaisie].etat} taille="moyenne">
              {ETATS_SAISIE[p.etatSaisie].libelle}
            </Pastille>
            {modifiable && (
              <button
                type="submit"
                disabled={processing}
                className="ml-auto h-10 rounded-champ border border-accent bg-white px-3 text-meta font-bold text-accent disabled:opacity-50"
              >
                Enregistrer
              </button>
            )}
          </div>
        </>
      )}
    </Form>
  )
}

function CarteAnnee({ a, ouvrir }: { a: Annee; ouvrir: ReturnType<typeof useFeuille>[1] }) {
  const [duplication, setDuplication] = useState(false)
  const modifiable = a.etat !== 'cloturee'

  return (
    <div className="flex flex-col gap-3 rounded-carte border border-bordure bg-white p-[18px]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[180px] flex-1 flex-col gap-0.5">
          <span className="text-section font-extrabold">{a.libelle}</span>
          <span className="text-leg text-encre-3">
            {dateFr(a.dateDebut)} → {dateFr(a.dateFin)} ·{' '}
            {a.decoupage === 'trimestres' ? 'Trimestres' : 'Semestres'} · {a.classes} classe
            {a.classes > 1 ? 's' : ''}
          </span>
        </div>
        <Pastille
          etat={ETATS_ANNEE[a.etat].etat}
          icone={a.etat === 'cloturee' ? 'lock' : undefined}
        >
          {ETATS_ANNEE[a.etat].libelle}
        </Pastille>
      </div>

      <div className="flex flex-wrap gap-2">
        {a.etat === 'preparation' && (
          <button
            type="button"
            onClick={() =>
              ouvrir({
                titre: `Activer l’année ${a.libelle} ?`,
                texte:
                  'Elle devient l’année de travail : inscriptions, notes et bulletins porteront sur elle (RG1 : une seule année active).',
                libelleConfirmer: 'Activer',
                onConfirmer: () =>
                  router.post(`/admin/annees/${a.id}/activer`, {}, { preserveScroll: true }),
              })
            }
            className="h-10 rounded-champ bg-accent px-4 text-meta font-bold text-white"
          >
            <Icone nom="circle-check" className="mr-1.5" />
            Activer
          </button>
        )}
        {a.etat === 'active' && (
          <button
            type="button"
            onClick={() =>
              ouvrir({
                titre: `Clôturer l’année ${a.libelle} ?`,
                texte:
                  'La clôture est définitive : plus aucune note, inscription ou bulletin de cette année ne pourra être modifié (RG2).',
                lignes: [
                  ['Année', a.libelle],
                  ['Classes', String(a.classes)],
                ],
                danger: true,
                libelleConfirmer: 'Clôturer définitivement',
                onConfirmer: () =>
                  router.post(`/admin/annees/${a.id}/cloturer`, {}, { preserveScroll: true }),
              })
            }
            className="h-10 rounded-champ border border-bordure-danger bg-white px-4 text-meta font-bold text-erreur"
          >
            <Icone nom="lock" className="mr-1.5" />
            Clôturer
          </button>
        )}
        <button
          type="button"
          aria-expanded={duplication}
          onClick={() => setDuplication((v) => !v)}
          className="h-10 rounded-champ border border-bordure-champ bg-white px-4 text-meta font-semibold text-encre-2"
        >
          <Icone nom="reg-copy" className="mr-1.5" />
          Dupliquer vers une nouvelle année
        </button>
      </div>

      {duplication && (
        <Form
          route="admin.annees.dupliquer"
          routeParams={{ id: a.id }}
          onSuccess={() => setDuplication(false)}
          className="flex flex-col gap-3 rounded-bouton bg-entete p-3.5"
        >
          {({ errors, processing }) => (
            <>
              <span className="text-meta text-encre-2">
                Classes ({a.classes}), professeurs principaux et affectations seront repris sur la
                nouvelle année, en préparation, à corriger ensuite au cas par cas. Niveaux, matières
                et coefficients sont communs à toutes les années.
              </span>
              <ChampsAnnee errors={errors} base={a} />
              <button
                type="submit"
                disabled={processing}
                className="h-11 self-start rounded-bouton bg-accent px-4 text-corps font-bold text-white disabled:opacity-60"
              >
                Dupliquer {a.libelle}
              </button>
            </>
          )}
        </Form>
      )}

      <div className="flex flex-col">
        <span className="text-leg font-bold tracking-[0.06em] text-encre-3 uppercase">
          Périodes et fenêtres de saisie
        </span>
        {a.periodes.map((p) => (
          <LignePeriode key={p.id} p={p} modifiable={modifiable} />
        ))}
      </div>
    </div>
  )
}

export default function Annees({ annees }: { annees: Annee[] }) {
  const [creation, setCreation] = useState(false)
  const [feuille, ouvrir] = useFeuille()

  return (
    <Coque espace="admin" titre="Années scolaires">
      <div className="flex max-w-[960px] flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-leg text-encre-3">
            Une seule année active à la fois · une année clôturée est en lecture seule définitive.
          </span>
          <button
            type="button"
            aria-expanded={creation}
            onClick={() => setCreation((v) => !v)}
            className="h-[42px] rounded-champ border border-accent bg-white px-4 text-corps font-bold text-accent"
          >
            <Icone nom={creation ? 'xmark' : 'plus'} className="mr-2" />
            {creation ? 'Fermer' : 'Nouvelle année'}
          </button>
        </div>

        {creation && (
          <Form
            route="admin.annees.store"
            onSuccess={() => setCreation(false)}
            className="flex flex-col gap-4 rounded-carte border border-bordure bg-white p-5"
          >
            {({ errors, processing }) => (
              <>
                <span className="text-titre-carte font-extrabold">Nouvelle année scolaire</span>
                <ChampsAnnee errors={errors} />
                <span className="text-leg text-encre-3">
                  L’année est créée en préparation, avec ses périodes ; ajustez ensuite les fenêtres
                  de saisie.
                </span>
                <button
                  type="submit"
                  disabled={processing}
                  className="h-[46px] self-start rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-60"
                >
                  Créer l’année
                </button>
              </>
            )}
          </Form>
        )}

        {annees.map((a) => (
          <CarteAnnee key={a.id} a={a} ouvrir={ouvrir} />
        ))}
        {annees.length === 0 && (
          <EtatVide
            icone="calendar-days"
            titre="Aucune année scolaire"
            texte="Créez la première année pour paramétrer classes et affectations."
          />
        )}
      </div>
      {feuille}
    </Coque>
  )
}

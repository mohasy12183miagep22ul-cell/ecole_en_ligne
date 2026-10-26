import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Avatar from '~/components/ui/avatar'
import Onglets from '~/components/ui/onglets'
import Pastille from '~/components/ui/pastille'
import EtatVide from '~/components/ui/etat_vide'
import Champ, { Selection, ZoneTexte } from '~/components/ui/champ'
import { notifier } from '~/components/ui/toast'
import { useFeuille } from '~/components/ui/feuille'
import { cx, fmt, fmtv, rang } from '~/lib/format'
import { sansVides } from '~/lib/formulaire'
import {
  LIBELLES_ETAT,
  dateFr,
  etatDossier,
  etatStatut,
  libelleStatut,
  taille,
  type EtatDossier,
  type StatutEleve,
} from '~/lib/scolarite'
import { Form, Link } from '@adonisjs/inertia/react'
import { router, usePage } from '@inertiajs/react'
import { useRef, useState } from 'react'

type Eleve = {
  id: number
  matricule: string
  nom: string
  prenoms: string
  sexe: 'F' | 'M'
  dateNaissance: string
  lieuNaissance: string
  nationalite: string | null
  numeroActe: string | null
  aPhoto: boolean
  statut: StatutEleve
  statutMotif: string | null
  statutDate: string | null
  sorti: boolean
}
type Tuteur = {
  id: number
  nom: string
  lienParente: string
  lien: string
  telephone: string
  profession: string | null
  adresse: string | null
  email: string | null
  principal: boolean
  accesPortail: boolean
}
type Piece = {
  type: string
  libelle: string
  obligatoire: boolean
  documentId: number | null
  nomOrigine: string | null
  taille: number | null
}
type Inscription = {
  id: number
  annee: string
  anneeEtat: string
  niveau: string
  classe: string | null
  etat: EtatDossier
  redoublant: boolean
  etablissementOrigine: string | null
  motif: string | null
  motifDepassement: string | null
  date: string
  manquantes: string[]
  pieces: Piece[]
}
type Valeurs = Record<string, string | number | boolean | null>
type Trace = {
  id: number
  action: string
  avant: Valeurs | null
  apres: Valeurs | null
  auteur: string
  date: string
}

type Onglet = 'identite' | 'tuteurs' | 'scolarite' | 'notes' | 'bulletins' | 'documents' | 'journal'
const ONGLETS: Array<{ id: Onglet; libelle: string }> = [
  { id: 'identite', libelle: 'Identité' },
  { id: 'tuteurs', libelle: 'Tuteurs' },
  { id: 'scolarite', libelle: 'Scolarité' },
  { id: 'notes', libelle: 'Notes' },
  { id: 'bulletins', libelle: 'Bulletins' },
  { id: 'documents', libelle: 'Documents' },
  { id: 'journal', libelle: 'Journal' },
]
/** Anciens identifiants d'onglet (liens du prototype). */
const ALIAS: Record<string, Onglet> = {
  id: 'identite',
  tut: 'tuteurs',
  sco: 'scolarite',
  inscriptions: 'scolarite',
  bul: 'bulletins',
  docs: 'documents',
  log: 'journal',
}
const LIENS = [
  ['mere', 'Mère'],
  ['pere', 'Père'],
  ['tante', 'Tante'],
  ['oncle', 'Oncle'],
  ['grand_parent', 'Grand-parent'],
  ['autre', 'Autre tuteur légal'],
]
const contour =
  'flex h-[42px] items-center rounded-champ border border-bordure-champ bg-white px-3.5 text-meta font-semibold text-encre-2 hover:no-underline'
const petit =
  'h-9 rounded-[9px] border border-bordure-champ bg-white px-3 text-meta font-semibold text-encre-2'
const principal =
  'h-[42px] rounded-champ bg-accent px-[18px] text-meta font-bold text-white disabled:opacity-60'

/** Valeur lisible d'une trace du journal (avant / après). */
const resume = (v: Valeurs | null) =>
  v
    ? Object.entries(v)
        .filter(([k]) => k !== 'inscription')
        .map(([k, x]) => `${k} : ${x === null ? '—' : String(x)}`)
        .join(' · ')
    : ''

function ChampsTuteur({ errors, t }: { errors: Record<string, string>; t?: Tuteur }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
      <Champ libelle="Nom complet *" name="nom" defaultValue={t?.nom} erreur={errors.nom} />
      <Selection
        libelle="Lien de parenté *"
        name="lienParente"
        defaultValue={t?.lienParente ?? 'mere'}
      >
        {LIENS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Selection>
      <Champ
        libelle="Téléphone *"
        name="telephone"
        type="tel"
        defaultValue={t?.telephone}
        erreur={errors.telephone && 'Numéro de téléphone invalide.'}
      />
      <Champ libelle="Profession" name="profession" defaultValue={t?.profession ?? ''} />
      <Champ libelle="Adresse" name="adresse" defaultValue={t?.adresse ?? ''} />
      <Champ
        libelle="E-mail"
        name="email"
        type="email"
        defaultValue={t?.email ?? ''}
        erreur={errors.email && 'Adresse e-mail invalide.'}
      />
    </div>
  )
}

function CarteTuteur({ eleveId, t, seul }: { eleveId: number; t: Tuteur; seul: boolean }) {
  const [mode, setMode] = useState<'lecture' | 'edition' | 'acces'>('lecture')
  const [feuille, ouvrir] = useFeuille()
  return (
    <div className="flex flex-col gap-1.5 rounded-bouton border border-bordure p-3.5">
      <div className="flex items-start gap-2">
        <span className="flex-1 text-moyen font-bold">{t.nom}</span>
        {t.accesPortail && (
          <Pastille etat="info" taille="petite" icone="id-card">
            Portail
          </Pastille>
        )}
      </div>
      <span className="text-leg font-semibold text-accent">
        {t.lien}
        {t.principal && ' · tuteur principal'}
      </span>
      <span className="text-meta">
        <Icone nom="phone" className="w-[18px] text-encre-3" />
        {t.telephone}
      </span>
      {t.profession && (
        <span className="text-meta">
          <Icone nom="briefcase" className="w-[18px] text-encre-3" />
          {t.profession}
        </span>
      )}
      {t.adresse && (
        <span className="text-meta">
          <Icone nom="location-dot" className="w-[18px] text-encre-3" />
          {t.adresse}
        </span>
      )}
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          className={petit}
          onClick={() => setMode(mode === 'edition' ? 'lecture' : 'edition')}
        >
          Modifier
        </button>
        {!t.principal && (
          <button
            type="button"
            className={petit}
            onClick={() =>
              router.put(
                `/scolarite/eleves/${eleveId}/tuteurs/${t.id}/principal`,
                {},
                { preserveScroll: true }
              )
            }
          >
            Principal
          </button>
        )}
        {!t.accesPortail && (
          <button
            type="button"
            className={petit}
            onClick={() => setMode(mode === 'acces' ? 'lecture' : 'acces')}
          >
            Accès portail
          </button>
        )}
        {!seul && (
          <button
            type="button"
            className={cx(petit, 'text-erreur')}
            onClick={() =>
              ouvrir({
                titre: 'Détacher ce tuteur ?',
                texte: `${t.nom} ne sera plus rattaché à l’élève. Le lien reste conservé dans l’historique.`,
                libelleConfirmer: 'Détacher',
                danger: true,
                onConfirmer: () =>
                  router.delete(`/scolarite/eleves/${eleveId}/tuteurs/${t.id}`, {
                    preserveScroll: true,
                  }),
              })
            }
          >
            Détacher
          </button>
        )}
      </div>
      {mode === 'edition' && (
        <Form
          route="scolarite.tuteurs.update"
          routeParams={{ id: eleveId, tuteurId: t.id }}
          transform={sansVides}
          options={{ preserveScroll: true }}
          onSuccess={() => setMode('lecture')}
          className="mt-2 flex flex-col gap-3 rounded-bouton bg-entete p-3"
        >
          {({ errors, processing }) => (
            <>
              <ChampsTuteur errors={errors} t={t} />
              <button type="submit" disabled={processing} className={cx(principal, 'self-start')}>
                Enregistrer
              </button>
            </>
          )}
        </Form>
      )}
      {mode === 'acces' && (
        <Form
          route="scolarite.tuteurs.acces"
          routeParams={{ id: eleveId, tuteurId: t.id }}
          options={{ preserveScroll: true }}
          onSuccess={() => setMode('lecture')}
          className="mt-2 flex flex-col gap-3 rounded-bouton bg-entete p-3"
        >
          {({ errors, processing }) => (
            <>
              <Champ
                libelle="E-mail de connexion *"
                name="email"
                type="email"
                defaultValue={t.email ?? ''}
                erreur={errors.email && 'Adresse e-mail invalide.'}
                aide="Un mot de passe provisoire est créé, à remettre au tuteur ; il le changera à sa première connexion."
              />
              <button type="submit" disabled={processing} className={cx(principal, 'self-start')}>
                Créer l’accès
              </button>
            </>
          )}
        </Form>
      )}
      {feuille}
    </div>
  )
}

function LignePiece({
  inscriptionId,
  p,
  ouvert,
}: {
  inscriptionId: number
  p: Piece
  ouvert: boolean
}) {
  const champ = useRef<HTMLInputElement>(null)
  const [envoi, setEnvoi] = useState(false)
  const fourni = p.documentId !== null
  const manque = !fourni && p.obligatoire
  const deposer = (fichier: File) => {
    if (fichier.size > 5 * 1024 * 1024) {
      notifier('Fichier trop volumineux : 5 Mo au maximum.')
      return
    }
    router.post(
      `/scolarite/inscriptions/${inscriptionId}/pieces/${p.type}`,
      { fichier },
      {
        forceFormData: true,
        preserveScroll: true,
        onStart: () => setEnvoi(true),
        onFinish: () => setEnvoi(false),
      }
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-bouton border border-bordure p-3">
      <Icone
        nom={manque ? 'file-circle-exclamation' : 'file-circle-check'}
        className={cx(
          'text-[18px]',
          manque ? 'text-erreur' : fourni ? 'text-succes' : 'text-encre-4'
        )}
      />
      <div className="flex min-w-[160px] flex-1 flex-col gap-0.5">
        <span className="text-corps font-semibold">{p.libelle}</span>
        <span className="text-leg text-encre-3">
          {fourni
            ? `${p.nomOrigine ?? 'fichier'} · ${taille(p.taille)}`
            : p.obligatoire
              ? `${p.type === 'photo' ? 'JPG ou PNG' : 'PDF ou image'} · 5 Mo max.`
              : 'Non exigée pour ce dossier'}
        </span>
      </div>
      <Pastille etat={fourni ? 'succes' : manque ? 'erreur' : 'neutre'} taille="moyenne">
        {fourni ? 'Fourni' : manque ? 'Manquant' : 'Facultatif'}
      </Pastille>
      {fourni && (
        <a
          href={`/scolarite/pieces/${p.documentId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center rounded-[9px] border border-bordure-champ bg-white px-3 text-meta font-semibold text-encre-2 hover:no-underline"
        >
          <Icone nom="reg-eye" className="mr-1.5" />
          Voir
        </a>
      )}
      {ouvert && (
        <>
          <input
            ref={champ}
            type="file"
            hidden
            accept={
              p.type === 'photo' ? 'image/jpeg,image/png' : 'application/pdf,image/jpeg,image/png'
            }
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) deposer(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={envoi}
            onClick={() => champ.current?.click()}
            className="h-9 rounded-[9px] border border-accent bg-white px-3 text-meta font-bold text-accent disabled:opacity-60"
          >
            <Icone
              nom={envoi ? 'spinner' : 'paperclip'}
              className={cx('mr-1.5', envoi && 'animate-spin')}
            />
            {fourni ? 'Remplacer' : 'Joindre'}
          </button>
        </>
      )}
    </div>
  )
}

export default function FicheEleve({
  onglet,
  droits,
  resultats,
  eleve,
  tuteurs,
  inscriptions,
  journal,
}: {
  onglet: string
  droits: { valider: boolean; reactiver: boolean }
  resultats: Array<{
    periode: string
    matieres: Array<{
      libelle: string
      coefficient: number
      moyenne: number | null
      moyenneClasse: number | null
    }>
    generale: number | null
    rang: number | null
    effectif: number
  }>
  eleve: Eleve
  tuteurs: Tuteur[]
  inscriptions: Inscription[]
  journal: Trace[]
}) {
  const { flash } = usePage()
  const initial =
    ALIAS[onglet] ?? (ONGLETS.some((o) => o.id === onglet) ? (onglet as Onglet) : 'identite')
  const [actif, setActif] = useState<Onglet>(initial)
  const [edition, setEdition] = useState(false)
  const [statut, setStatut] = useState(false)
  const [ajoutTuteur, setAjoutTuteur] = useState(false)
  const [feuille, ouvrir] = useFeuille()
  const cree = flash.compteCree
  const retour = { href: '/scolarite/eleves', libelle: 'Liste des élèves' }

  const courante = inscriptions.find(
    (i) => i.anneeEtat === 'active' && i.etat !== 'annule' && i.etat !== 'refuse'
  )
  const nom = `${eleve.prenoms} ${eleve.nom.toUpperCase()}`
  const identite: Array<[string, string]> = [
    ['Nom', eleve.nom],
    ['Prénoms', eleve.prenoms],
    ['Sexe', eleve.sexe === 'F' ? 'Féminin' : 'Masculin'],
    ['Date de naissance', dateFr(eleve.dateNaissance)],
    ['Lieu de naissance', eleve.lieuNaissance],
    ['Nationalité', eleve.nationalite ?? '—'],
    ['N° acte de naissance', eleve.numeroActe ?? '—'],
    ['Matricule', eleve.matricule],
  ]

  return (
    <Coque espace="scolarite" titre="Fiche élève" retour={retour}>
      <div className="flex max-w-[960px] flex-col gap-3.5">
        {cree && (
          <div
            role="status"
            className="flex flex-col gap-2 rounded-bouton bg-succes-fond px-4 py-3 text-meta text-succes"
          >
            <span className="font-bold">
              <Icone nom="circle-check" className="mr-1.5" />
              Accès au portail créé pour {cree.email}
            </span>
            <span>
              Mot de passe provisoire, affiché une seule fois — à remettre au tuteur, qui le
              changera à sa première connexion :
            </span>
            <code className="self-start rounded-champ bg-white px-3 py-1.5 text-moyen font-bold tracking-wider text-encre">
              {cree.motDePasse}
            </code>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 rounded-carte border border-bordure bg-white p-[18px]">
          {eleve.aPhoto ? (
            <img
              src={`/scolarite/eleves/${eleve.id}/photo`}
              alt={`Photo de ${nom}`}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <Avatar nom={`${eleve.prenoms} ${eleve.nom}`} taille={64} />
          )}
          <div className="flex min-w-[180px] flex-1 flex-col gap-1">
            <span className="text-section-lg font-extrabold">{nom}</span>
            <span className="text-meta text-encre-3">
              Matricule {eleve.matricule}
              {courante && ` · ${courante.classe ?? `${courante.niveau}, classe à affecter`}`}
            </span>
            <Pastille etat={etatStatut(eleve.statut)} taille="moyenne" className="self-start">
              {libelleStatut(eleve.statut)}
            </Pastille>
          </div>
          <div className="flex flex-wrap gap-2">
            {courante && (
              <a
                href={`/scolarite/inscriptions/${courante.id}/fiche`}
                target="_blank"
                rel="noopener noreferrer"
                className={contour}
              >
                <Icone nom="print" className="mr-1.5" />
                Fiche d’inscription
              </a>
            )}
            {courante?.etat === 'valide' && (
              <button
                type="button"
                className={contour}
                onClick={() =>
                  router.post(
                    '/scolarite/documents',
                    { type: 'certificats', format: 'pdf', inscriptionIds: [courante.id] },
                    { preserveScroll: true }
                  )
                }
              >
                Certificat
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setActif('identite')
                setEdition((v) => !v)
              }}
              className={principal}
            >
              {edition ? 'Fermer' : 'Modifier'}
            </button>
          </div>
        </div>

        {eleve.sorti && (
          <div className="flex flex-wrap items-center gap-2.5 rounded-bouton bg-attention-fond px-3.5 py-3 text-meta text-attention">
            <Icone nom="triangle-exclamation" />
            <span className="flex-1">
              Élève sorti ({libelleStatut(eleve.statut).toLowerCase()}
              {eleve.statutDate && ` le ${dateFr(eleve.statutDate)}`}
              {eleve.statutMotif && ` · ${eleve.statutMotif}`}). Sa réinscription demande une
              réactivation par la direction (RG8).
            </span>
            {droits.reactiver && (
              <button
                type="button"
                className={petit}
                onClick={() =>
                  ouvrir({
                    titre: 'Réactiver l’élève',
                    texte: 'L’élève pourra de nouveau être inscrit. L’action est journalisée.',
                    libelleConfirmer: 'Réactiver',
                    motif: true,
                    onConfirmer: (motif) =>
                      router.post(
                        `/scolarite/eleves/${eleve.id}/reactiver`,
                        { motif },
                        { preserveScroll: true }
                      ),
                  })
                }
              >
                Réactiver
              </button>
            )}
          </div>
        )}

        <Onglets
          aria-label="Sections de la fiche"
          variante="souligne"
          actif={actif}
          onChange={setActif}
          onglets={ONGLETS}
        />

        <div className="rounded-carte border border-bordure bg-white p-[18px]">
          {actif === 'identite' &&
            (edition ? (
              <Form
                route="scolarite.eleves.update"
                routeParams={{ id: eleve.id }}
                transform={sansVides}
                options={{ preserveScroll: true }}
                onSuccess={() => setEdition(false)}
                className="flex flex-col gap-4"
              >
                {({ errors, processing }) => (
                  <>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
                      <Champ
                        libelle="Nom *"
                        name="nom"
                        defaultValue={eleve.nom}
                        erreur={errors.nom}
                      />
                      <Champ
                        libelle="Prénoms *"
                        name="prenoms"
                        defaultValue={eleve.prenoms}
                        erreur={errors.prenoms}
                      />
                      <Selection libelle="Sexe *" name="sexe" defaultValue={eleve.sexe}>
                        <option value="F">Féminin</option>
                        <option value="M">Masculin</option>
                      </Selection>
                      <Champ
                        libelle="Date de naissance *"
                        name="dateNaissance"
                        type="date"
                        defaultValue={eleve.dateNaissance}
                        erreur={errors.dateNaissance && 'Date invalide ou future.'}
                      />
                      <Champ
                        libelle="Lieu de naissance *"
                        name="lieuNaissance"
                        defaultValue={eleve.lieuNaissance}
                        erreur={errors.lieuNaissance}
                      />
                      <Champ
                        libelle="Nationalité"
                        name="nationalite"
                        defaultValue={eleve.nationalite ?? ''}
                      />
                      <Champ
                        libelle="N° acte de naissance"
                        name="numeroActe"
                        defaultValue={eleve.numeroActe ?? ''}
                      />
                      <Champ
                        libelle="Matricule"
                        value={eleve.matricule}
                        disabled
                        aide="Unique et immuable (RG4)."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={processing}
                      className={cx(principal, 'self-start')}
                    >
                      Enregistrer
                    </button>
                  </>
                )}
              </Form>
            ) : (
              <div className="flex flex-col gap-5">
                <dl className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                  {identite.map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-[3px]">
                      <dt className="text-leg text-encre-3">{k}</dt>
                      <dd className="text-moyen font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                {eleve.statut === 'inscrit' && (
                  <div className="flex flex-col gap-3 border-t border-separateur pt-4">
                    <button
                      type="button"
                      className={cx(petit, 'self-start')}
                      onClick={() => setStatut((v) => !v)}
                    >
                      {statut ? 'Fermer' : 'Changer le statut (transfert, abandon…)'}
                    </button>
                    {statut && (
                      <Form
                        route="scolarite.eleves.statut"
                        routeParams={{ id: eleve.id }}
                        transform={sansVides}
                        options={{ preserveScroll: true }}
                        onSuccess={() => setStatut(false)}
                        className="flex flex-col gap-3 rounded-bouton bg-entete p-3.5"
                      >
                        {({ errors, processing }) => (
                          <>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
                              <Selection
                                libelle="Nouveau statut *"
                                name="statut"
                                defaultValue="transfere"
                              >
                                <option value="transfere">Transféré</option>
                                <option value="abandon">Abandon</option>
                                {droits.valider && <option value="diplome">Diplômé</option>}
                                {droits.valider && <option value="exclu">Exclu</option>}
                              </Selection>
                              <Champ
                                libelle="Date d’effet *"
                                name="date"
                                type="date"
                                required
                                erreur={errors.date}
                              />
                            </div>
                            <ZoneTexte
                              libelle="Motif * (journalisé)"
                              name="motif"
                              rows={2}
                              minLength={5}
                              maxLength={250}
                              required
                              erreur={errors.motif}
                            />
                            <span className="text-leg text-encre-3">
                              À compter de cette date, l’élève quitte les listes de classe et les
                              grilles de saisie ; ses notes sont conservées.
                            </span>
                            <button
                              type="submit"
                              disabled={processing}
                              className={cx(principal, 'self-start')}
                            >
                              Enregistrer le statut
                            </button>
                          </>
                        )}
                      </Form>
                    )}
                  </div>
                )}
              </div>
            ))}

          {actif === 'tuteurs' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3">
                {tuteurs.map((t) => (
                  <CarteTuteur key={t.id} eleveId={eleve.id} t={t} seul={tuteurs.length === 1} />
                ))}
              </div>
              {tuteurs.length === 0 && (
                <span className="text-meta text-erreur">
                  Aucun tuteur : un élève doit en avoir au moins un.
                </span>
              )}
              <button
                type="button"
                className={cx(petit, 'self-start')}
                onClick={() => setAjoutTuteur((v) => !v)}
              >
                <Icone nom={ajoutTuteur ? 'xmark' : 'plus'} className="mr-1.5" />
                {ajoutTuteur ? 'Fermer' : 'Ajouter un tuteur'}
              </button>
              {ajoutTuteur && (
                <Form
                  route="scolarite.tuteurs.store"
                  routeParams={{ id: eleve.id }}
                  transform={sansVides}
                  options={{ preserveScroll: true }}
                  onSuccess={() => setAjoutTuteur(false)}
                  className="flex flex-col gap-3 rounded-bouton bg-entete p-3.5"
                >
                  {({ errors, processing }) => (
                    <>
                      <ChampsTuteur errors={errors} />
                      <button
                        type="submit"
                        disabled={processing}
                        className={cx(principal, 'self-start')}
                      >
                        Rattacher
                      </button>
                    </>
                  )}
                </Form>
              )}
            </div>
          )}

          {actif === 'scolarite' &&
            (inscriptions.length === 0 ? (
              <span className="text-corps text-encre-3">Aucune inscription.</span>
            ) : (
              inscriptions.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-col gap-1.5 border-b border-separateur py-3 last:border-b-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2.5 text-corps">
                    <span className="font-bold">
                      {i.annee} · {i.classe ?? `${i.niveau}, classe à affecter`}{' '}
                      {i.redoublant && (
                        <span className="text-leg font-medium text-attention">Redoublant</span>
                      )}
                    </span>
                    <Pastille etat={etatDossier(i.etat)} taille="moyenne">
                      {LIBELLES_ETAT[i.etat]}
                    </Pastille>
                  </div>
                  <span className="text-leg text-encre-3">
                    Dossier du {dateFr(i.date)}
                    {i.etablissementOrigine && ` · venant de ${i.etablissementOrigine}`}
                    {i.motif && ` · motif : ${i.motif}`}
                    {i.motifDepassement && ` · capacité dépassée : ${i.motifDepassement}`}
                  </span>
                  {i.manquantes.length > 0 &&
                    ['brouillon', 'soumis', 'valide'].includes(i.etat) && (
                      <span className="text-leg font-semibold text-erreur">
                        Pièces manquantes : {i.manquantes.join(', ')}
                      </span>
                    )}
                  {i.anneeEtat === 'active' && ['brouillon', 'soumis'].includes(i.etat) && (
                    <div className="flex flex-wrap gap-1.5">
                      {i.etat === 'brouillon' && (
                        <button
                          type="button"
                          className={petit}
                          onClick={() =>
                            router.post(
                              `/scolarite/inscriptions/${i.id}/soumettre`,
                              {},
                              { preserveScroll: true }
                            )
                          }
                        >
                          Soumettre à la direction
                        </button>
                      )}
                      {i.etat === 'soumis' && droits.valider && (
                        <Link
                          route="direction.inscriptions"
                          className={cx(petit, 'flex items-center hover:no-underline')}
                        >
                          Valider ou refuser
                        </Link>
                      )}
                      <button
                        type="button"
                        className={cx(petit, 'text-erreur')}
                        onClick={() =>
                          ouvrir({
                            titre: 'Annuler ce dossier ?',
                            texte: 'Le dossier est conservé mais ne pourra plus être validé.',
                            libelleConfirmer: 'Annuler le dossier',
                            danger: true,
                            motif: true,
                            onConfirmer: (motif) =>
                              router.post(
                                `/scolarite/inscriptions/${i.id}/annuler`,
                                { motif },
                                { preserveScroll: true }
                              ),
                          })
                        }
                      >
                        Annuler le dossier
                      </button>
                    </div>
                  )}
                </div>
              ))
            ))}

          {actif === 'notes' &&
            (resultats.every((r) => r.generale === null) ? (
              <EtatVide
                cadre={false}
                icone="chart-simple"
                titre="Aucune note pour l’instant"
                texte="Les moyennes apparaîtront ici dès que les enseignants auront saisi leurs évaluations."
              />
            ) : (
              <div className="flex flex-col gap-4">
                <span className="text-leg text-encre-3">
                  Moyennes provisoires sur 20 : les évaluations non encore validées par la direction
                  comptent. Rien de ceci n’est visible par la famille avant publication du bulletin.
                </span>
                {resultats
                  .filter((r) => r.generale !== null)
                  .map((r) => (
                    <section key={r.periode} aria-label={r.periode} className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-moyen font-bold">{r.periode}</span>
                        <span className="text-meta">
                          Moyenne générale{' '}
                          <strong className="text-titre-carte">{fmt(r.generale)}</strong>
                          {r.rang !== null && ` · ${rang(r.rang)} / ${r.effectif}`}
                        </span>
                      </div>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-2.5">
                        {r.matieres.map((m) => (
                          <div
                            key={m.libelle}
                            className="flex items-center gap-2.5 rounded-champ bg-entete px-3 py-2.5"
                          >
                            <span className="flex-1 text-meta">
                              {m.libelle}{' '}
                              <span className="text-encre-3">· coef {fmtv(m.coefficient)}</span>
                            </span>
                            <span className="text-leg text-encre-3">
                              classe {fmt(m.moyenneClasse)}
                            </span>
                            <strong>{fmt(m.moyenne)}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
              </div>
            ))}

          {actif === 'bulletins' && (
            <EtatVide
              cadre={false}
              illustration="vide"
              dimensions={[150, 110]}
              titre="Aucun bulletin"
              texte="Les bulletins publiés par la direction seront archivés ici."
            />
          )}

          {actif === 'documents' &&
            (courante ? (
              <div className="flex flex-col gap-2.5">
                <span className="text-leg text-encre-3">
                  Dossier {courante.annee} · PDF, JPG ou PNG, 5 Mo maximum. Les pièces ne sont
                  lisibles que par le secrétariat et la direction.
                </span>
                {courante.pieces.map((p) => (
                  <LignePiece key={p.type} inscriptionId={courante.id} p={p} ouvert />
                ))}
              </div>
            ) : (
              <span className="text-corps text-encre-3">
                Aucun dossier en cours sur l’année active.
              </span>
            ))}

          {actif === 'journal' &&
            (journal.length === 0 ? (
              <span className="text-corps text-encre-3">Aucune action enregistrée.</span>
            ) : (
              <ol className="flex flex-col">
                {journal.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-col gap-0.5 border-b border-separateur py-3 last:border-b-0"
                  >
                    <span className="text-corps font-bold">{l.action}</span>
                    {(l.avant || l.apres) && (
                      <span className="text-meta break-words text-encre-2">
                        {l.avant && (
                          <span className="text-encre-3 line-through">{resume(l.avant)}</span>
                        )}
                        {l.avant && l.apres && ' → '}
                        {resume(l.apres)}
                      </span>
                    )}
                    <span className="text-leg text-encre-4">
                      {l.auteur} · {l.date}
                    </span>
                  </li>
                ))}
              </ol>
            ))}
        </div>
      </div>
      {feuille}
    </Coque>
  )
}

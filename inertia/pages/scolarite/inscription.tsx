import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Pastille from '~/components/ui/pastille'
import Interrupteur from '~/components/ui/interrupteur'
import EtatVide from '~/components/ui/etat_vide'
import { cx } from '~/lib/format'
import {
  dateFr,
  estPleine,
  libelleStatut,
  occupation,
  taille,
  type ClasseEffectif,
  type StatutEleve,
} from '~/lib/scolarite'
import { router, usePage } from '@inertiajs/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

type EleveConnu = {
  id: number
  matricule: string
  nom: string
  prenoms: string
  sexe: string
  dateNaissance: string
  lieuNaissance: string
  statut: StatutEleve
  sorti: boolean
}
type TuteurConnu = { id: number; nom: string; lien: string; telephone: string }
type TypePiece = 'photo' | 'acte_naissance' | 'bulletin_precedent' | 'certificat_transfert'

const INITIAL = {
  nom: '',
  prenoms: '',
  sexe: '',
  dateNaissance: '',
  lieuNaissance: '',
  nationalite: 'Guinéenne',
  numeroActe: '',
  tuteurNom: '',
  tuteurLien: 'mere',
  tuteurTelephone: '',
  tuteurProfession: '',
  tuteurAdresse: '',
  niveauId: '',
  classeId: '',
  etablissementOrigine: '',
}
type Saisie = typeof INITIAL
type Cle = keyof Saisie

const ETAPE_DU_CHAMP: Partial<Record<string, number>> = {
  nom: 1,
  prenoms: 1,
  sexe: 1,
  dateNaissance: 1,
  lieuNaissance: 1,
  photo: 1,
  eleveId: 1,
  tuteurNom: 2,
  tuteurLien: 2,
  tuteurTelephone: 2,
  tuteurId: 2,
}
const champ =
  'h-12 w-full min-w-0 rounded-bouton border bg-champ px-3.5 text-moyen text-encre outline-none focus:border-accent focus:bg-white'
const ETAPES = ['Identité', 'Tuteurs', 'Scolarité']
const lienAction = 'text-meta font-bold text-accent'

function Ligne({
  libelle,
  erreur,
  children,
}: {
  libelle: string
  erreur?: string
  children: ReactNode
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-meta font-semibold">{libelle}</span>
      {children}
      {erreur && (
        <span role="alert" className="text-leg text-erreur">
          {erreur}
        </span>
      )}
    </label>
  )
}

/** Recherche serveur (rechargement partiel de la seule liste concernée). */
function useRecherche(param: 'qEleve' | 'qTuteur', prop: 'elevesConnus' | 'tuteursConnus') {
  const [texte, setTexte] = useState('')
  const premier = useRef(true)
  useEffect(() => {
    if (premier.current) {
      premier.current = false
      return
    }
    const t = setTimeout(
      () => router.reload({ only: [prop], data: { [param]: texte.trim() }, replace: true }),
      300
    )
    return () => clearTimeout(t)
  }, [texte, param, prop])
  return [texte, setTexte] as const
}

export default function NouvelleInscription({
  annee,
  niveaux,
  classes,
  liens,
  elevesConnus,
  tuteursConnus,
}: {
  annee: { id: number; libelle: string } | null
  niveaux: Array<{ id: number; libelle: string }>
  classes: ClasseEffectif[]
  liens: Array<{ cle: string; libelle: string }>
  elevesConnus: EleveConnu[]
  tuteursConnus: TuteurConnu[]
}) {
  const { props } = usePage()
  const [etape, setEtape] = useState(1)
  const [f, setF] = useState<Saisie>({ ...INITIAL, niveauId: String(niveaux[0]?.id ?? '') })
  const [redoublant, setRedoublant] = useState(false)
  const [fichiers, setFichiers] = useState<Partial<Record<TypePiece, File>>>({})
  const [err, setErr] = useState<Record<string, string | undefined>>({})
  const [connu, setConnu] = useState<EleveConnu | null>(null)
  const [tuteur, setTuteur] = useState<TuteurConnu | null>(null)
  const [chercheEleve, setChercheEleve] = useState(false)
  const [chercheTuteur, setChercheTuteur] = useState(false)
  const [qEleve, setQEleve] = useRecherche('qEleve', 'elevesConnus')
  const [qTuteur, setQTuteur] = useRecherche('qTuteur', 'tuteursConnus')
  const [envoi, setEnvoi] = useState(false)
  const [apercu, setApercu] = useState<string | null>(null)
  const choixFichier = useRef<HTMLInputElement>(null)
  const typeEnCours = useRef<TypePiece>('photo')

  // Erreurs renvoyées par le serveur : on revient à l'étape du premier champ fautif.
  const serveur = props.errors as Record<string, string> | undefined
  const [erreursVues, setErreursVues] = useState(serveur)
  if (serveur !== erreursVues) {
    setErreursVues(serveur)
    if (serveur && Object.keys(serveur).length > 0) {
      setErr(serveur)
      setEtape(Math.min(...Object.keys(serveur).map((k) => ETAPE_DU_CHAMP[k] ?? 3)))
    }
  }

  if (!annee) {
    return (
      <Coque espace="scolarite" titre="Nouvelle inscription">
        <EtatVide
          icone="calendar-days"
          titre="Aucune année scolaire active"
          texte="Les inscriptions se font sur l’année active : l’administrateur doit d’abord l’activer."
        />
      </Coque>
    )
  }

  const entree = (k: Cle, extra: Record<string, unknown> = {}) => ({
    value: f[k],
    onChange: (e: { target: { value: string } }) => {
      setF({ ...f, [k]: e.target.value })
      setErr({ ...err, [k]: undefined })
    },
    className: cx(champ, err[k] ? 'border-danger' : 'border-bordure-champ'),
    ...extra,
  })

  const classesNiveau = classes.filter((c) => String(c.niveauId) === f.niveauId)
  const classe = classes.find((c) => String(c.id) === f.classeId)
  const pieces: Array<[TypePiece, string, boolean]> = [
    ['acte_naissance', 'Acte de naissance', true],
    ['bulletin_precedent', 'Bulletin ou certificat de l’année précédente', true],
    ['certificat_transfert', 'Certificat de transfert', Boolean(f.etablissementOrigine.trim())],
  ]

  const valider = (n: number) => {
    const e: Record<string, string> = {}
    if (n === 1 && !connu) {
      if (!f.nom.trim()) e.nom = 'Le nom est obligatoire.'
      if (!f.prenoms.trim()) e.prenoms = 'Les prénoms sont obligatoires.'
      if (!f.sexe) e.sexe = 'Indiquez le sexe.'
      if (!f.dateNaissance) e.dateNaissance = 'La date de naissance est obligatoire.'
      if (!f.lieuNaissance.trim()) e.lieuNaissance = 'Le lieu de naissance est obligatoire.'
    }
    if (n === 1 && connu?.sorti) {
      e.eleveId =
        'Élève sorti de l’établissement : la direction doit le réactiver avant sa réinscription (RG8).'
    }
    if (n === 2 && !tuteur) {
      if (!f.tuteurNom.trim()) e.tuteurNom = 'Au moins un tuteur est requis.'
      if (!/^[+\d][\d ]{7,}$/.test(f.tuteurTelephone.trim()))
        e.tuteurTelephone = 'Numéro invalide, ex. +224 622 00 00 00.'
    }
    if (n === 3 && classe && estPleine(classe))
      e.classeId = `Classe complète (${occupation(classe)}). Laissez la classe à affecter : seule la direction peut forcer, avec motif (RG7).`
    return e
  }

  const haut = () => document.getElementById('defilement')?.scrollTo({ top: 0 })
  const suivant = () => {
    const e = valider(etape)
    if (Object.keys(e).length) return setErr(e)
    setErr({})
    setEtape(etape + 1)
    haut()
  }

  const joindre = (type: TypePiece) => {
    typeEnCours.current = type
    if (choixFichier.current) {
      choixFichier.current.accept =
        type === 'photo' ? 'image/jpeg,image/png' : 'application/pdf,image/jpeg,image/png'
      choixFichier.current.click()
    }
  }

  const envoyer = (soumettre: boolean) => {
    for (const n of [1, 2, 3]) {
      const e = valider(n)
      if (Object.keys(e).length) {
        setErr(e)
        setEtape(n)
        return
      }
    }
    const donnees: Record<string, unknown> = {
      niveauId: f.niveauId,
      redoublant,
      soumettre,
      ...fichiers,
    }
    if (connu) donnees.eleveId = connu.id
    else
      for (const k of [
        'nom',
        'prenoms',
        'sexe',
        'dateNaissance',
        'lieuNaissance',
        'nationalite',
        'numeroActe',
      ] as const)
        if (f[k].trim()) donnees[k] = f[k].trim()
    if (tuteur) donnees.tuteurId = tuteur.id
    else
      for (const k of [
        'tuteurNom',
        'tuteurLien',
        'tuteurTelephone',
        'tuteurProfession',
        'tuteurAdresse',
      ] as const)
        if (f[k].trim()) donnees[k] = f[k].trim()
    if (f.classeId) donnees.classeId = f.classeId
    if (f.etablissementOrigine.trim()) donnees.etablissementOrigine = f.etablissementOrigine.trim()

    router.post('/scolarite/inscriptions', donnees as Record<string, string | File | boolean>, {
      forceFormData: true,
      onStart: () => setEnvoi(true),
      onFinish: () => setEnvoi(false),
    })
  }

  return (
    <Coque espace="scolarite" titre="Nouvelle inscription">
      <div className="flex max-w-[720px] flex-col gap-3.5">
        <input
          ref={choixFichier}
          type="file"
          hidden
          onChange={(e) => {
            const fichier = e.target.files?.[0]
            e.target.value = ''
            if (!fichier) return
            const type = typeEnCours.current
            if (fichier.size > 5 * 1024 * 1024) {
              setErr({ ...err, [type]: 'Fichier trop volumineux : 5 Mo au maximum.' })
              return
            }
            setErr({ ...err, [type]: undefined })
            setFichiers((x) => ({ ...x, [type]: fichier }))
            if (type === 'photo') {
              if (apercu) URL.revokeObjectURL(apercu)
              setApercu(URL.createObjectURL(fichier))
            }
          }}
        />

        <ol className="flex items-center gap-2">
          {ETAPES.map((l, i) => {
            const n = i + 1
            const on = etape === n
            const fait = etape > n
            return (
              <li
                key={l}
                aria-current={on ? 'step' : undefined}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <span
                  className={cx(
                    'flex size-[30px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-meta font-extrabold',
                    fait
                      ? 'border-accent bg-accent text-white'
                      : on
                        ? 'border-accent bg-accent-doux text-accent'
                        : 'border-bordure-moyenne bg-white text-encre-4'
                  )}
                >
                  {fait ? <Icone nom="check" /> : n}
                </span>
                <span
                  className={cx('truncate text-meta font-bold', on ? 'text-encre' : 'text-encre-4')}
                >
                  {l}
                </span>
                <div className="h-0.5 min-w-2 flex-1 bg-bordure-champ" />
              </li>
            )
          })}
        </ol>

        {etape === 1 && (
          <div className="flex flex-col gap-4 rounded-carte border border-bordure bg-white p-5">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-titre-carte font-extrabold">Identité de l’élève</span>
              <button
                type="button"
                aria-expanded={chercheEleve}
                onClick={() => setChercheEleve((v) => !v)}
                className={lienAction}
              >
                <Icone nom="magnifying-glass" className="mr-1.5" />
                Élève déjà connu
              </button>
            </div>

            {chercheEleve && !connu && (
              <div className="flex flex-col gap-2 rounded-bouton bg-entete p-3">
                <input
                  type="search"
                  value={qEleve}
                  onChange={(e) => setQEleve(e.target.value)}
                  placeholder="Nom, prénom ou matricule (ancien élève)"
                  aria-label="Rechercher un élève connu"
                  className={cx(champ, 'border-bordure-champ bg-white')}
                />
                {elevesConnus.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setConnu(e)
                      setErr({})
                    }}
                    className="flex items-center justify-between gap-2 rounded-champ bg-white px-3 py-2.5 text-left text-meta"
                  >
                    <span>
                      <strong>
                        {e.nom.toUpperCase()} {e.prenoms}
                      </strong>{' '}
                      · {e.matricule} · né(e) le {dateFr(e.dateNaissance)}
                    </span>
                    <Pastille etat={e.sorti ? 'erreur' : 'neutre'} taille="petite">
                      {libelleStatut(e.statut)}
                    </Pastille>
                  </button>
                ))}
                {qEleve.trim().length >= 2 && elevesConnus.length === 0 && (
                  <span className="text-leg text-encre-3">Aucun élève connu ne correspond.</span>
                )}
              </div>
            )}

            {connu ? (
              <div className="flex flex-col gap-2 rounded-bouton border border-accent bg-accent-doux p-3.5 text-meta">
                <span className="text-corps font-bold">
                  {connu.nom.toUpperCase()} {connu.prenoms} · matricule {connu.matricule}
                </span>
                <span className="text-encre-2">
                  Né(e) le {dateFr(connu.dateNaissance)} à {connu.lieuNaissance}. Le matricule est
                  conservé (RG4).
                </span>
                {err.eleveId && (
                  <span role="alert" className="text-erreur">
                    {err.eleveId}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setConnu(null)}
                  className={cx(lienAction, 'self-start')}
                >
                  Saisir un nouvel élève
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => joindre('photo')}
                    aria-label="Joindre la photo d’identité"
                    className="flex size-[72px] items-center justify-center overflow-hidden rounded-full border-[1.5px] border-dashed border-bordure-forte text-section-lg text-encre-4"
                  >
                    {fichiers.photo && apercu ? (
                      <img src={apercu} alt="" className="size-full object-cover" />
                    ) : (
                      <Icone nom="camera" />
                    )}
                  </button>
                  <span className="text-leg leading-[1.45] text-encre-3">
                    Photo d’identité {fichiers.photo && `· ${taille(fichiers.photo.size)}`}
                    <br />
                    JPG ou PNG · 5 Mo max.
                    {err.photo && (
                      <span role="alert" className="block text-erreur">
                        {err.photo}
                      </span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
                  <Ligne libelle="Nom *" erreur={err.nom}>
                    <input {...entree('nom')} autoComplete="off" />
                  </Ligne>
                  <Ligne libelle="Prénoms *" erreur={err.prenoms}>
                    <input {...entree('prenoms')} autoComplete="off" />
                  </Ligne>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-meta font-semibold" id="libelle-sexe">
                    Sexe *
                  </span>
                  <div role="radiogroup" aria-labelledby="libelle-sexe" className="flex gap-2">
                    {[
                      ['F', 'Féminin'],
                      ['M', 'Masculin'],
                    ].map(([k, l]) => {
                      const on = f.sexe === k
                      return (
                        <button
                          key={k}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => {
                            setF({ ...f, sexe: k })
                            setErr({ ...err, sexe: undefined })
                          }}
                          className={cx(
                            'h-[46px] flex-1 rounded-bouton border text-corps font-semibold',
                            on
                              ? 'border-accent bg-accent-doux text-accent'
                              : cx(
                                  'bg-white text-encre-2',
                                  err.sexe ? 'border-danger' : 'border-bordure-champ'
                                )
                          )}
                        >
                          {l}
                        </button>
                      )
                    })}
                  </div>
                  {err.sexe && (
                    <span role="alert" className="text-leg text-erreur">
                      {err.sexe}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
                  <Ligne libelle="Date de naissance *" erreur={err.dateNaissance}>
                    <input type="date" {...entree('dateNaissance')} />
                  </Ligne>
                  <Ligne libelle="Lieu de naissance *" erreur={err.lieuNaissance}>
                    <input {...entree('lieuNaissance')} />
                  </Ligne>
                  <Ligne libelle="Nationalité">
                    <input {...entree('nationalite')} />
                  </Ligne>
                  <Ligne libelle="N° d’acte de naissance">
                    <input {...entree('numeroActe')} />
                  </Ligne>
                </div>
              </>
            )}
          </div>
        )}

        {etape === 2 && (
          <div className="flex flex-col gap-4 rounded-carte border border-bordure bg-white p-5">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-titre-carte font-extrabold">Tuteur principal</span>
              <button
                type="button"
                aria-expanded={chercheTuteur}
                onClick={() => setChercheTuteur((v) => !v)}
                className={lienAction}
              >
                <Icone nom="link" className="mr-1.5" />
                Tuteur existant (fratrie)
              </button>
            </div>
            {connu && (
              <span className="text-leg text-encre-3">
                Les tuteurs déjà rattachés à l’élève sont conservés ; vous pouvez en ajouter un.
              </span>
            )}

            {chercheTuteur && !tuteur && (
              <div className="flex flex-col gap-2 rounded-bouton bg-entete p-3">
                <input
                  type="search"
                  value={qTuteur}
                  onChange={(e) => setQTuteur(e.target.value)}
                  placeholder="Nom ou téléphone du tuteur"
                  aria-label="Rechercher un tuteur existant"
                  className={cx(champ, 'border-bordure-champ bg-white')}
                />
                {tuteursConnus.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTuteur(t)
                      setErr({})
                    }}
                    className="flex items-center justify-between gap-2 rounded-champ bg-white px-3 py-2.5 text-left text-meta"
                  >
                    <strong>{t.nom}</strong>
                    <span className="text-encre-3">
                      {t.lien} · {t.telephone}
                    </span>
                  </button>
                ))}
                {qTuteur.trim().length >= 2 && tuteursConnus.length === 0 && (
                  <span className="text-leg text-encre-3">Aucun tuteur ne correspond.</span>
                )}
              </div>
            )}

            {tuteur ? (
              <div className="flex flex-col gap-1.5 rounded-bouton border border-accent bg-accent-doux p-3.5 text-meta">
                <span className="text-corps font-bold">{tuteur.nom}</span>
                <span className="text-encre-2">
                  {tuteur.lien} · {tuteur.telephone} — déjà tuteur d’un autre élève, il sera
                  rattaché à celui-ci.
                </span>
                <button
                  type="button"
                  onClick={() => setTuteur(null)}
                  className={cx(lienAction, 'self-start')}
                >
                  Saisir un autre tuteur
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
                  <Ligne libelle="Nom complet *" erreur={err.tuteurNom}>
                    <input {...entree('tuteurNom')} />
                  </Ligne>
                  <Ligne libelle="Lien de parenté">
                    <select {...entree('tuteurLien')}>
                      {liens.map((l) => (
                        <option key={l.cle} value={l.cle}>
                          {l.libelle}
                        </option>
                      ))}
                    </select>
                  </Ligne>
                  <Ligne libelle="Téléphone *" erreur={err.tuteurTelephone}>
                    <input
                      type="tel"
                      placeholder="+224 622 00 00 00"
                      {...entree('tuteurTelephone')}
                    />
                  </Ligne>
                  <Ligne libelle="Profession">
                    <input {...entree('tuteurProfession')} />
                  </Ligne>
                </div>
                <Ligne libelle="Adresse">
                  <input {...entree('tuteurAdresse')} />
                </Ligne>
              </>
            )}
          </div>
        )}

        {etape === 3 && (
          <div className="flex flex-col gap-4 rounded-carte border border-bordure bg-white p-5">
            <span className="text-titre-carte font-extrabold">
              Scolarité demandée · {annee.libelle}
            </span>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
              <Ligne libelle="Niveau *" erreur={err.niveauId}>
                <select
                  value={f.niveauId}
                  onChange={(e) => {
                    setF({ ...f, niveauId: e.target.value, classeId: '' })
                    setErr({ ...err, classeId: undefined, niveauId: undefined })
                  }}
                  className={cx(champ, 'border-bordure-champ')}
                >
                  {niveaux.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.libelle}
                    </option>
                  ))}
                </select>
              </Ligne>
              <Ligne libelle="Classe souhaitée" erreur={err.classeId}>
                <select {...entree('classeId')}>
                  <option value="">À affecter par la direction</option>
                  {classesNiveau.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.libelle} · {occupation(c)}
                      {estPleine(c) ? ' — complète' : ''}
                    </option>
                  ))}
                </select>
              </Ligne>
            </div>
            {classe && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-leg text-encre-3">
                  <span>Capacité de la classe</span>
                  <span className="font-bold">Effectif {occupation(classe)}</span>
                </div>
                <div className="h-1.5 rounded-[3px] bg-neutre">
                  <div
                    className={cx(
                      'h-full rounded-[3px]',
                      estPleine(classe) ? 'bg-danger' : 'bg-accent'
                    )}
                    style={{
                      width: `${Math.min(100, (classe.effectif / classe.capacite) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <Ligne libelle="Établissement d’origine">
              <input
                placeholder="Laisser vide si déjà scolarisé ici"
                {...entree('etablissementOrigine')}
              />
            </Ligne>
            <div className="flex items-center justify-between gap-3">
              <span className="text-corps font-semibold text-encre">Redoublant</span>
              <Interrupteur libelle="Redoublant" actif={redoublant} onChange={setRedoublant} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-meta font-semibold">Pièces justificatives</span>
              {[
                ...pieces,
                ['photo', 'Photo d’identité', !connu] as [TypePiece, string, boolean],
              ].map(([k, l, requis]) => {
                const fichier = fichiers[k]
                return (
                  <div key={k} className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 rounded-bouton border border-bordure px-3 py-2.5">
                      <Icone
                        nom={fichier ? 'file-circle-check' : 'paperclip'}
                        className={
                          fichier ? 'text-succes' : requis ? 'text-erreur' : 'text-encre-4'
                        }
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-meta font-semibold">{l}</span>
                        <span className="truncate text-micro text-encre-3">
                          {fichier
                            ? `${fichier.name} · ${taille(fichier.size)}`
                            : `${requis ? 'Obligatoire' : k === 'certificat_transfert' ? 'Si autre établissement' : 'Facultatif'} · ${k === 'photo' ? 'JPG ou PNG' : 'PDF ou image'}, 5 Mo max.`}
                        </span>
                      </div>
                      <Pastille
                        etat={fichier ? 'succes' : requis ? 'erreur' : 'neutre'}
                        taille="petite"
                      >
                        {fichier ? 'Fourni' : requis ? 'Manquant' : 'Facultatif'}
                      </Pastille>
                      <button
                        type="button"
                        onClick={() =>
                          fichier ? setFichiers((x) => ({ ...x, [k]: undefined })) : joindre(k)
                        }
                        className="h-[34px] rounded-[9px] border border-bordure-champ bg-white px-2.5 text-leg font-semibold text-encre-2"
                      >
                        {fichier ? 'Retirer' : 'Joindre'}
                      </button>
                    </div>
                    {err[k] && (
                      <span role="alert" className="text-leg text-erreur">
                        {err[k]}
                      </span>
                    )}
                  </div>
                )
              })}
              <span className="text-leg text-encre-3">
                Un dossier peut être soumis avec des pièces manquantes, mais il ne pourra pas être
                validé (RG6).
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          {etape > 1 && (
            <button
              type="button"
              onClick={() => {
                setEtape(etape - 1)
                setErr({})
              }}
              className="h-12 rounded-bouton border border-bordure-champ bg-white px-4 text-corps font-semibold text-encre-2"
            >
              <Icone nom="arrow-left" className="mr-2" />
              Précédent
            </button>
          )}
          <div className="flex-1" />
          {etape === 3 && (
            <button
              type="button"
              disabled={envoi}
              onClick={() => envoyer(false)}
              className="h-12 rounded-bouton border border-bordure-champ bg-white px-4 text-corps font-semibold text-encre-2 disabled:opacity-60"
            >
              Brouillon
            </button>
          )}
          {etape < 3 ? (
            <button
              type="button"
              onClick={suivant}
              className="h-12 rounded-bouton bg-accent px-5 text-corps font-bold text-white"
            >
              Continuer
              <Icone nom="arrow-right" className="ml-2" />
            </button>
          ) : (
            <button
              type="button"
              disabled={envoi}
              onClick={() => envoyer(true)}
              className="h-12 rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-60"
            >
              {envoi ? 'Envoi…' : 'Soumettre le dossier'}
            </button>
          )}
        </div>
      </div>
    </Coque>
  )
}

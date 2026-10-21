/**
 * Jeu de démonstration — portage fidèle du script du prototype
 * (docs/prototype/Ecole en ligne.dc.html). Mêmes élèves, matricules, notes et
 * archives : les écrans affichent exactement les valeurs du prototype.
 *
 * À remplacer par les données serveur quand les services métier existeront.
 */
import { type NomIcone } from '~/lib/icones'
import { fmtv } from '~/lib/format'

export const ECOLE = 'Groupe scolaire Les Flamboyants'
export const ANNEE = '2026-2027'

/** Générateur pseudo-aléatoire déterministe du prototype. */
export const rnd = (s: number) => {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const half = (v: number) => Math.round(v * 2) / 2

export type CodeMatiere = 'FR' | 'MA' | 'AN' | 'HG' | 'SVT' | 'PC' | 'EPS'
export type Matiere = {
  code: CodeMatiere
  nom: string
  coef: number
  icone: NomIcone
  famille: string
}

export const MATIERES: Matiere[] = [
  { code: 'FR', nom: 'Français', coef: 4, icone: 'book-open', famille: 'Littéraire' },
  {
    code: 'MA',
    nom: 'Mathématiques',
    coef: 4,
    icone: 'square-root-variable',
    famille: 'Scientifique',
  },
  { code: 'AN', nom: 'Anglais', coef: 2, icone: 'language', famille: 'Langue' },
  { code: 'HG', nom: 'Histoire-Géographie', coef: 3, icone: 'earth-africa', famille: 'Littéraire' },
  { code: 'SVT', nom: 'SVT', coef: 2, icone: 'leaf', famille: 'Scientifique' },
  { code: 'PC', nom: 'Physique-Chimie', coef: 2, icone: 'flask', famille: 'Scientifique' },
  { code: 'EPS', nom: 'EPS', coef: 1, icone: 'person-running', famille: 'Sportive' },
]
export const MATIERE = Object.fromEntries(MATIERES.map((m) => [m.code, m])) as Record<
  CodeMatiere,
  Matiere
>

/** Paires de couleurs d'avatar du prototype : classes du thème. */
export const AVATARS = [
  'bg-av1-fond text-av1',
  'bg-av2-fond text-av2',
  'bg-av3-fond text-av3',
  'bg-av4-fond text-av4',
  'bg-av5-fond text-av5',
]

const NOMS: Array<[string, string, 'F' | 'M']> = [
  ['Bah', 'Mariama', 'F'],
  ['Barry', 'Alpha', 'M'],
  ['Camara', 'Fatoumata', 'F'],
  ['Condé', 'Sékou', 'M'],
  ['Diallo', 'Aminata', 'F'],
  ['Diallo', 'Ousmane', 'M'],
  ['Doumbouya', 'Kadiatou', 'F'],
  ['Fofana', 'Ibrahim', 'M'],
  ['Keïta', 'Aïssatou', 'F'],
  ['Kourouma', 'Mamadou', 'M'],
  ['Konaté', 'Hawa', 'F'],
  ['Kaba', 'Lansana', 'M'],
  ['Sylla', 'Mariame', 'F'],
  ['Soumah', 'Abdoulaye', 'M'],
  ['Sow', 'Djénabou', 'F'],
  ['Touré', 'Moussa', 'M'],
  ['Traoré', 'Nènè', 'F'],
  ['Cissé', 'Thierno', 'M'],
  ['Bangoura', 'Saran', 'F'],
  ['Baldé', 'Elhadj', 'M'],
  ['Haïdara', 'Oumou', 'F'],
  ['Kanté', 'Sidiki', 'M'],
  ['Millimono', 'Rose', 'F'],
  ['Yansané', 'Karim', 'M'],
]
const mix = (k: number) =>
  NOMS.map((_, i): [string, string, 'F' | 'M'] => [
    NOMS[(i + k) % 24][0],
    NOMS[(i * 7 + k) % 24][1],
    NOMS[(i * 7 + k) % 24][2],
  ])

export const PIECES_MANQUANTES = [
  'Certificat de transfert',
  'Photo d’identité',
  'Bulletin de l’année précédente',
]

export type Eleve = {
  id: string
  nom: string
  prenom: string
  sexe: 'F' | 'M'
  classe: string
  i: number
  base: number
  /** Moyenne par matière (hors mathématiques, recalculées depuis la grille). */
  moy: Record<CodeMatiere, number | null>
  matricule: string
  initiales: string
  avatar: string
  redoublant: boolean
  statut: 'Inscrit' | 'Transféré'
  complet: string
  nomU: string
  manquantes: string[]
  naissance: string
}

const fabriquer = (liste: Array<[string, string, 'F' | 'M']>, classe: string, graine: number) =>
  liste
    .map(([nom, prenom, sexe]) => ({ nom, prenom, sexe }))
    .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'))
    .map((s, i): Eleve => {
      const base =
        s.prenom === 'Aminata' && classe === '3e A' ? 14.3 : 6.5 + rnd(i * 3 + graine) * 11
      const moy = {} as Record<CodeMatiere, number | null>
      MATIERES.forEach((m, k) => {
        moy[m.code] =
          m.code === 'EPS'
            ? null
            : half(clamp(base + (rnd(i * 31 + k * 17 + graine) - 0.5) * 6, 2.5, 19.5))
      })
      const incomplet = (i + graine) % 7 === 2
      const an = classe[0] === '3' ? 2011 : classe[0] === '4' ? 2012 : 2014
      return {
        ...s,
        id: `${classe.replace(' ', '')}-${i}`,
        classe,
        i,
        base,
        moy,
        matricule: `${2021 + ((i + graine) % 4)}-${String(1040 + i * 37 + graine * 3).padStart(5, '0')}`,
        initiales: (s.prenom[0] + s.nom[0]).toUpperCase(),
        avatar: AVATARS[(i + graine) % 5],
        redoublant: (i + graine) % 9 === 4,
        statut: 'Inscrit',
        complet: `${s.prenom} ${s.nom}`,
        nomU: s.nom.toUpperCase(),
        manquantes: incomplet ? [PIECES_MANQUANTES[(i + graine) % 3]] : [],
        naissance: `${String(1 + ((i * 5) % 28)).padStart(2, '0')}/${String(1 + ((i * 3) % 12)).padStart(2, '0')}/${an}`,
      }
    })

const R3A = fabriquer(NOMS, '3e A', 1)
R3A[21].statut = 'Transféré'
const R3B = fabriquer(mix(5).slice(0, 20), '3e B', 5)
const R4A = fabriquer(mix(9).slice(0, 20), '4e A', 9)
const R6B = fabriquer(
  [
    ['Diallo', 'Moussa', 'M'],
    ['Camara', 'Ibrahima', 'M'],
    ['Bah', 'Kadiatou', 'F'],
    ['Sylla', 'Fodé', 'M'],
    ['Touré', 'Mariam', 'F'],
    ['Keïta', 'Yaya', 'M'],
  ],
  '6e B',
  13
)

export const EFFECTIFS: Record<string, Eleve[]> = {
  '3e A': R3A,
  '3e B': R3B,
  '4e A': R4A,
  '6e B': R6B,
}
export const inscrits = (classe: string) =>
  (EFFECTIFS[classe] ?? []).filter((s) => s.statut === 'Inscrit')
/** Élèves visibles par le secrétariat dans le prototype. */
export const TOUS = [...R3A, ...R4A.slice(0, 6), ...R6B]
export const eleve = (id: string) => TOUS.find((s) => s.id === id)
export const AMINATA = R3A.find((s) => s.prenom === 'Aminata')!
export const MOUSSA = R6B.find((s) => s.prenom === 'Moussa')!

export const TYPES: Array<[string, NomIcone]> = [
  ['Interrogation', 'pen'],
  ['Devoir surveillé', 'file-pen'],
  ['Composition', 'file-signature'],
  ['Travaux pratiques', 'flask-vial'],
  ['Oral', 'microphone'],
]
export const ICONE_TYPE = Object.fromEntries(TYPES) as Record<string, NomIcone>

export type EtatEval = 'brouillon' | 'soumise' | 'validée' | 'verrouillée'
export type Evaluation = {
  id: string
  classe: string
  matiere: CodeMatiere
  titre: string
  type: string
  date: string
  max: number
  poids: number
  etat: EtatEval
  mine: boolean
  enseignant: string
}

export const EVALUATIONS: Evaluation[] = [
  [
    'ev1',
    '3e A',
    'MA',
    'Interrogation n°1',
    'Interrogation',
    '18/09/2026',
    10,
    1,
    'validée',
    true,
    'I. Sow',
  ],
  [
    'ev2',
    '3e A',
    'MA',
    'Devoir surveillé n°1',
    'Devoir surveillé',
    '02/10/2026',
    20,
    2,
    'validée',
    true,
    'I. Sow',
  ],
  [
    'ev3',
    '3e A',
    'MA',
    'Devoir surveillé n°2',
    'Devoir surveillé',
    '16/10/2026',
    20,
    2,
    'brouillon',
    true,
    'I. Sow',
  ],
  [
    'ev4',
    '3e B',
    'MA',
    'Devoir surveillé n°1',
    'Devoir surveillé',
    '05/10/2026',
    20,
    2,
    'soumise',
    true,
    'I. Sow',
  ],
  [
    'ev5',
    '4e A',
    'MA',
    'Interrogation n°1',
    'Interrogation',
    '21/09/2026',
    10,
    1,
    'verrouillée',
    true,
    'I. Sow',
  ],
  [
    'ev6',
    '3e A',
    'FR',
    'Composition de français',
    'Composition',
    '09/10/2026',
    20,
    3,
    'soumise',
    false,
    'A. Keïta',
  ],
  [
    'ev7',
    '4e A',
    'AN',
    'Oral — présentation',
    'Oral',
    '12/10/2026',
    20,
    1,
    'soumise',
    false,
    'L. Kaba',
  ],
  [
    'ev8',
    '3e A',
    'HG',
    'Devoir surveillé n°1',
    'Devoir surveillé',
    '01/10/2026',
    20,
    2,
    'validée',
    false,
    'S. Condé',
  ],
  [
    'ev9',
    '3e A',
    'SVT',
    'Travaux pratiques n°1',
    'Travaux pratiques',
    '25/09/2026',
    20,
    1,
    'validée',
    false,
    'H. Touré',
  ],
  [
    'ev10',
    '3e A',
    'PC',
    'Devoir surveillé n°1',
    'Devoir surveillé',
    '29/09/2026',
    20,
    2,
    'validée',
    false,
    'M. Fofana',
  ],
  [
    'ev11',
    '3e A',
    'AN',
    'Interrogation écrite',
    'Interrogation',
    '24/09/2026',
    20,
    1,
    'validée',
    false,
    'L. Kaba',
  ],
].map(([id, classe, matiere, titre, type, date, max, poids, etat, mine, enseignant]) => ({
  id,
  classe,
  matiere,
  titre,
  type,
  date,
  max,
  poids,
  etat,
  mine,
  enseignant,
})) as Evaluation[]

export type Cellule = { v: string; abs: boolean; obs: string }
export type Grilles = Record<string, Record<string, Cellule>>

const remplir = (g: Grilles, ev: string, liste: Eleve[], f: (s: Eleve, i: number) => Cellule) => {
  g[ev] = {}
  liste
    .filter((s) => s.statut === 'Inscrit')
    .forEach((s, i) => {
      g[ev][s.id] = f(s, i)
    })
}

export const grillesInitiales = (): Grilles => {
  const g: Grilles = {}
  const c = (v: number): Cellule => ({ v: fmtv(v), abs: false, obs: '' })
  remplir(g, 'ev1', R3A, (s, i) => c(half(clamp(s.base / 2 + (rnd(i * 7 + 1) - 0.5) * 3, 0, 10))))
  remplir(g, 'ev2', R3A, (s, i) =>
    i === 6
      ? { v: '', abs: true, obs: 'Malade, justificatif fourni' }
      : c(half(clamp(s.base + (rnd(i * 9 + 2) - 0.5) * 6, 0, 20)))
  )
  remplir(g, 'ev3', R3A, (s, i) =>
    i < 14
      ? c(half(clamp(s.base + (rnd(i * 11 + 5) - 0.5) * 6, 0, 20)))
      : { v: '', abs: false, obs: '' }
  )
  remplir(g, 'ev4', R3B, (s, i) => c(half(clamp(s.base + (rnd(i * 5 + 3) - 0.5) * 6, 0, 20))))
  remplir(g, 'ev5', R4A, (s, i) => c(half(clamp(s.base / 2 + (rnd(i * 5 + 4) - 0.5) * 3, 0, 10))))
  return g
}

export type LigneBulletin = {
  code: CodeMatiere
  v: number | null
  moyenne: number | null
  min: number | null
  max: number | null
  rang: number | null
  appr?: string | null
}
export type Bulletin = {
  id: string
  libelle: string
  annee: string
  classe: string
  mg: number
  rang: string
  effectif: number
  publie: string
  decision: string
  appr: string
  lignes: LigneBulletin[]
  rectif?: number
}

/** Bulletins archivés d'Aminata (année 2025-2026, 4e A). */
export const ARCHIVES: Bulletin[] = (
  [
    [
      'a3',
      '3e trimestre',
      14.0,
      '5e',
      '03/07/2026',
      'Tableau d’honneur',
      'Très bon trimestre, élève sérieuse et régulière.',
    ],
    [
      'a2',
      '2e trimestre',
      13.4,
      '7e',
      '08/04/2026',
      'Encouragements',
      'Progrès nets, poursuivre les efforts en sciences.',
    ],
    [
      'a1',
      '1er trimestre',
      12.8,
      '9e',
      '19/12/2025',
      'Encouragements',
      'Bon début d’année, doit gagner en confiance à l’oral.',
    ],
  ] as const
).map(([id, libelle, t, rg, publie, decision, appr], j) => {
  const lignes = MATIERES.map((m, k): LigneBulletin => {
    const v = half(clamp(t + (rnd(k * 5 + j * 11 + 2) - 0.5) * 5, 4, 19.5))
    return {
      code: m.code,
      v,
      moyenne: v - 1.2 - rnd(k + j) * 1.5,
      min: clamp(v - 6 - rnd(k * 2 + j) * 2, 1, 20),
      max: clamp(v + 2 + rnd(k * 3 + j) * 2, 0, 20),
      rang: 1 + Math.floor(rnd(k * 7 + j) * 12),
    }
  })
  let n = 0
  let d = 0
  lignes.forEach((l) => {
    n += (l.v ?? 0) * MATIERE[l.code].coef
    d += MATIERE[l.code].coef
  })
  return {
    id,
    libelle,
    annee: '2025-2026',
    classe: '4e A',
    mg: n / d,
    rang: rg,
    effectif: 31,
    publie,
    decision,
    appr,
    lignes,
  }
})

export const PASTILLE_EVAL: Record<
  EtatEval,
  { etat: 'neutre' | 'attention' | 'succes' | 'verrou'; libelle: string; icone: NomIcone }
> = {
  brouillon: { etat: 'neutre', libelle: 'Brouillon', icone: 'pen-to-square' },
  soumise: { etat: 'attention', libelle: 'Soumise', icone: 'paper-plane' },
  validée: { etat: 'succes', libelle: 'Validée', icone: 'circle-check' },
  verrouillée: { etat: 'verrou', libelle: 'Verrouillée', icone: 'lock' },
}

export const DECISIONS = [
  '—',
  'Félicitations',
  'Encouragements',
  'Tableau d’honneur',
  'Avertissement de travail',
  'Avertissement de conduite',
]
export const suggerer = (m: number | null) =>
  m === null
    ? '—'
    : m >= 16
      ? 'Félicitations'
      : m >= 14
        ? 'Tableau d’honneur'
        : m >= 12
          ? 'Encouragements'
          : m < 8
            ? 'Avertissement de travail'
            : '—'
export const apprAuto = (m: number | null) =>
  m === null
    ? 'Non évalué sur la période.'
    : m >= 16
      ? 'Excellent travail, continuez ainsi.'
      : m >= 14
        ? 'Très bon trimestre, travail régulier.'
        : m >= 12
          ? 'Bon ensemble, efforts réguliers.'
          : m >= 10
            ? 'Résultats justes, doit approfondir.'
            : 'Insuffisant, travail personnel à renforcer.'

export const NIVEAUX = ['6e', '5e', '4e', '3e']
export const COEFS_INITIAUX: Record<CodeMatiere, number[]> = {
  FR: [4, 4, 4, 4],
  MA: [4, 4, 4, 4],
  AN: [2, 2, 2, 2],
  HG: [2, 2, 3, 3],
  SVT: [2, 2, 2, 2],
  PC: [1, 1, 2, 2],
  EPS: [1, 1, 1, 1],
}
/** Classes par niveau : [nom, effectif, capacité]. */
export const CLASSES: Record<string, Array<[string, number, number]>> = {
  '6e': [
    ['6e A', 38, 40],
    ['6e B', 40, 40],
  ],
  '5e': [
    ['5e A', 35, 40],
    ['5e B', 33, 40],
  ],
  '4e': [['4e A', 31, 40]],
  '3e': [
    ['3e A', 23, 40],
    ['3e B', 40, 40],
  ],
}

export type EntreeJournal = {
  auteur: string
  action: string
  objet: string
  avant: string
  apres: string
  date: string
}
export const JOURNAL_INITIAL: EntreeJournal[] = [
  {
    auteur: 'Ibrahima Sow',
    action: 'Modification de note',
    objet: 'Interrogation n°1 · 3e A · BAH Mariama',
    avant: '6,5',
    apres: '7',
    date: '18/10/2026 à 17:42',
  },
  {
    auteur: 'Mariama Camara',
    action: 'Validation',
    objet: 'Devoir surveillé n°1 · Mathématiques · 3e A',
    avant: 'Soumise',
    apres: 'Validée',
    date: '17/10/2026 à 10:15',
  },
  {
    auteur: 'Kadiatou Barry',
    action: 'Changement de rôle',
    objet: 'Compte i.sow · Professeur principal 3e A',
    avant: 'Enseignant',
    apres: 'Enseignant + PP',
    date: '14/10/2026 à 08:03',
  },
  {
    auteur: 'Système',
    action: 'Connexion échouée',
    objet: 'Compte a.kaba (3/5 essais)',
    avant: '',
    apres: '',
    date: '13/10/2026 à 22:51',
  },
]

export type Compte = { nom: string; email: string; roles: string[]; actif: boolean }
export const COMPTES_INITIAUX: Compte[] = [
  {
    nom: 'Mariama Camara',
    email: 'm.camara@flamboyants.edu.gn',
    roles: ['Direction'],
    actif: true,
  },
  {
    nom: 'Ibrahima Sow',
    email: 'i.sow@flamboyants.edu.gn',
    roles: ['Enseignant', 'Professeur principal'],
    actif: true,
  },
  {
    nom: 'Aïssatou Keïta',
    email: 'a.keita@flamboyants.edu.gn',
    roles: ['Enseignant'],
    actif: true,
  },
  {
    nom: 'Alseny Bangoura',
    email: 'a.bangoura@flamboyants.edu.gn',
    roles: ['Secrétariat'],
    actif: true,
  },
  { nom: 'Fatoumata Diallo', email: 'f.diallo@mail.gn', roles: ['Tuteur légal'], actif: true },
  { nom: 'Lansana Kaba', email: 'l.kaba@flamboyants.edu.gn', roles: ['Enseignant'], actif: false },
  {
    nom: 'Kadiatou Barry',
    email: 'k.barry@flamboyants.edu.gn',
    roles: ['Administrateur'],
    actif: true,
  },
]

export const NOM_MATIERE_COURT: Record<CodeMatiere, string> = {
  FR: 'Français',
  MA: 'Mathématiques',
  AN: 'Anglais',
  HG: 'Histoire-Géo.',
  SVT: 'SVT',
  PC: 'Physique-Chimie',
  EPS: 'EPS',
}

export const maintenant = () =>
  new Date()
    .toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(' ', ' à ')
export const heure = () =>
  new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

import vine from '@vinejs/vine'

const date = () => vine.date({ formats: ['YYYY-MM-DD'] })
/** Date passée ou du jour, ramenée à minuit. */
const datePassee = () => date().beforeOrEqual('today')
const texte = (max: number) => vine.string().trim().maxLength(max)
const facultatif = (max: number) => texte(max).nullable().optional()
const telephone = () =>
  vine
    .string()
    .trim()
    .regex(/^[+\d][\d ]{7,}$/)
    .maxLength(30)
const lien = () => vine.enum(['mere', 'pere', 'tante', 'oncle', 'grand_parent', 'autre'] as const)
/** Pièce jointe : PDF ou image, 5 Mo au plus (§ 3) ; le contenu réel est revérifié par le service. */
const piece = () => vine.file({ size: '5mb', extnames: ['pdf', 'jpg', 'jpeg', 'png'] })
const photo = () => vine.file({ size: '5mb', extnames: ['jpg', 'jpeg', 'png'] })

const champsIdentite = {
  nom: texte(80).minLength(1),
  prenoms: texte(120).minLength(1),
  sexe: vine.enum(['F', 'M'] as const),
  dateNaissance: datePassee(),
  lieuNaissance: texte(80).minLength(1),
  nationalite: facultatif(60),
  numeroActe: facultatif(40),
}

/** Identité de l'élève (fiche, onglet identité). */
export const identiteValidator = vine.create(champsIdentite)

/** Tuteur (ajout ou modification). */
export const tuteurValidator = vine.create({
  nom: texte(120).minLength(2),
  lienParente: lien(),
  telephone: telephone(),
  profession: facultatif(80),
  adresse: facultatif(200),
  email: vine.string().trim().email().maxLength(254).nullable().optional(),
})

/**
 * Nouveau dossier d'inscription (formulaire en trois étapes, § 3). Élève et
 * tuteur sont soit existants (identifiant), soit saisis.
 */
export const dossierValidator = vine.create({
  eleveId: vine.number().withoutDecimals().positive().optional(),
  nom: texte(80).minLength(1).optional().requiredIfMissing('eleveId'),
  prenoms: texte(120).minLength(1).optional().requiredIfMissing('eleveId'),
  sexe: vine
    .enum(['F', 'M'] as const)
    .optional()
    .requiredIfMissing('eleveId'),
  dateNaissance: datePassee().optional().requiredIfMissing('eleveId'),
  lieuNaissance: texte(80).minLength(1).optional().requiredIfMissing('eleveId'),
  nationalite: facultatif(60),
  numeroActe: facultatif(40),

  tuteurId: vine.number().withoutDecimals().positive().optional(),
  tuteurNom: texte(120).minLength(2).optional(),
  tuteurLien: lien().optional().requiredIfExists('tuteurNom'),
  tuteurTelephone: telephone().optional().requiredIfExists('tuteurNom'),
  tuteurProfession: facultatif(80),
  tuteurAdresse: facultatif(200),

  niveauId: vine.number().withoutDecimals().positive(),
  classeId: vine.number().withoutDecimals().positive().optional(),
  redoublant: vine.boolean(),
  etablissementOrigine: facultatif(120),
  soumettre: vine.boolean(),

  photo: photo().optional(),
  acte_naissance: piece().optional(),
  bulletin_precedent: piece().optional(),
  certificat_transfert: piece().optional(),
})

/** Dépôt d'une pièce sur un dossier existant. */
export const pieceValidator = vine.create({ fichier: piece() })

/** Motif d'un refus, d'une annulation ou d'une réactivation. */
export const motifValidator = vine.create({ motif: texte(250).minLength(5) })

/** Validation d'une inscription par la direction (RG6, RG7). */
export const validerInscriptionValidator = vine.create({
  classeId: vine.number().withoutDecimals().positive(),
  forcer: vine.boolean().optional(),
  motifDepassement: facultatif(250),
})

/** Changement de statut d'un élève (§ 4). */
export const statutValidator = vine.create({
  statut: vine.enum(['transfere', 'abandon', 'diplome', 'exclu'] as const),
  motif: facultatif(250),
  date: date().optional(),
})

/** Changement de classe d'une sélection (§ 4). */
export const changerClasseValidator = vine.create({
  inscriptionIds: vine
    .array(vine.number().withoutDecimals().positive())
    .minLength(1)
    .maxLength(500),
  classeId: vine.number().withoutDecimals().positive(),
  forcer: vine.boolean().optional(),
  motifDepassement: facultatif(250),
})

const filtres = vine.object({
  anneeId: vine.number().withoutDecimals().positive(),
  q: facultatif(80),
  niveauId: vine.number().withoutDecimals().positive().optional(),
  classeId: vine.number().withoutDecimals().positive().optional(),
  sexe: vine.enum(['F', 'M'] as const).optional(),
  statut: vine
    .enum(['inscrit', 'transfere', 'abandon', 'diplome', 'exclu', 'non_inscrit'] as const)
    .optional(),
  redoublant: vine.boolean().optional(),
  incomplet: vine.boolean().optional(),
})

/** Liste des élèves : filtres cumulables (§ 4). */
export const listeElevesValidator = vine.create({
  annee: vine.number().withoutDecimals().positive().optional(),
  q: facultatif(80),
  niveau: vine.number().withoutDecimals().positive().optional(),
  classe: vine.number().withoutDecimals().positive().optional(),
  sexe: vine.enum(['F', 'M'] as const).optional(),
  statut: vine
    .enum(['inscrit', 'transfere', 'abandon', 'diplome', 'exclu', 'non_inscrit'] as const)
    .optional(),
  redoublant: vine.boolean().optional(),
  incomplet: vine.boolean().optional(),
  page: vine.number().withoutDecimals().positive().optional(),
})

/** Demande d'un document en file d'attente. */
export const demandeDocumentValidator = vine.create({
  type: vine.enum(['certificats', 'liste_eleves', 'registre'] as const),
  format: vine.enum(['pdf', 'xlsx'] as const),
  inscriptionIds: vine.array(vine.number().withoutDecimals().positive()).maxLength(500).optional(),
  filtres: filtres.optional(),
  colonnes: vine
    .array(
      vine.enum([
        'eleve',
        'matricule',
        'classe',
        'niveau',
        'sexe',
        'naissance',
        'statut',
        'dossier',
        'etat',
        'redoublant',
      ] as const)
    )
    .minLength(1)
    .optional(),
  anneeId: vine.number().withoutDecimals().positive().optional(),
})

/** Fichier d'import initial (modèle Excel fourni). */
export const importValidator = vine.create({
  fichier: vine.file({ size: '5mb', extnames: ['xlsx'] }),
})

/** Accès au portail famille d'un tuteur. */
export const accesPortailValidator = vine.create({
  email: vine.string().trim().toLowerCase().email().maxLength(254),
})

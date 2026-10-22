import vine from '@vinejs/vine'

/** Date « AAAA-MM-JJ », livrée par VineJS en DateTime Luxon (début de journée). */
const date = () => vine.date({ formats: ['YYYY-MM-DD'] }).transform((d) => d.startOf('day'))

const libelleAnnee = () =>
  vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/)

/** Création d'une année scolaire (libellé « 2027-2028 »). */
export const creerAnneeValidator = vine.create({
  libelle: libelleAnnee().unique(async (requete, valeur) => {
    const existe = await requete
      .from('annees_scolaires')
      .where('libelle', valeur)
      .whereNull('deleted_at')
      .first()
    return !existe
  }),
  dateDebut: date(),
  dateFin: date(),
  decoupage: vine.enum(['trimestres', 'semestres'] as const),
})

/** Fenêtre de saisie d'une période. */
export const periodeValidator = vine.create({
  libelle: vine.string().trim().minLength(2).maxLength(40),
  debutSaisie: date(),
  finSaisie: date(),
})

/** Création d'un niveau. */
export const niveauValidator = vine.create({
  code: vine
    .string()
    .trim()
    .maxLength(20)
    .unique(async (requete, valeur) => {
      const existe = await requete
        .from('niveaux')
        .whereILike('code', valeur)
        .whereNull('deleted_at')
        .first()
      return !existe
    }),
  libelle: vine.string().trim().minLength(1).maxLength(60),
  ordre: vine.number().withoutDecimals().min(1).max(99),
  cycle: vine.enum(['primaire', 'college', 'lycee'] as const),
})

/** Création d'une matière. */
export const matiereValidator = vine.create({
  code: vine
    .string()
    .trim()
    .toUpperCase()
    .maxLength(10)
    .unique(async (requete, valeur) => {
      const existe = await requete
        .from('matieres')
        .where('code', valeur)
        .whereNull('deleted_at')
        .first()
      return !existe
    }),
  libelle: vine.string().trim().minLength(2).maxLength(60),
  famille: vine.enum(['litteraire', 'scientifique', 'langue', 'artistique', 'sportive'] as const),
  noteMaxDefaut: vine.number().withoutDecimals().min(1).max(100),
})

/** Coefficient d'un couple niveau + matière ; `null` retire la matière (RG3). */
export const coefficientValidator = vine.create({
  niveauId: vine.number().withoutDecimals().positive(),
  matiereId: vine.number().withoutDecimals().positive(),
  coefficient: vine.number().positive().max(20).decimal([0, 2]).nullable(),
})

/** Création ou modification d'une classe. */
export const classeValidator = vine.create({
  niveauId: vine.number().withoutDecimals().positive(),
  libelle: vine.string().trim().minLength(1).maxLength(30),
  capacite: vine.number().withoutDecimals().min(1).max(200),
  salle: vine.string().trim().maxLength(30).nullable().optional(),
  professeurPrincipalId: vine.number().withoutDecimals().positive().nullable().optional(),
})

/** Affectation d'un enseignant. */
export const affectationValidator = vine.create({
  enseignantId: vine.number().withoutDecimals().positive(),
  classeId: vine.number().withoutDecimals().positive(),
  matiereId: vine.number().withoutDecimals().positive(),
})

/** Duplication d'une année : la nouvelle année cible. */
export const dupliquerAnneeValidator = creerAnneeValidator

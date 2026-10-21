import vine from '@vinejs/vine'

const email = () => vine.string().trim().toLowerCase().email().maxLength(254)

/** Longueur minimale d'un mot de passe (cahier des charges § 12). */
export const LONGUEUR_MIN_MOT_DE_PASSE = 10

/**
 * Validateur utilisé avant la vérification des identifiants à la connexion.
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

/**
 * Code de vérification en deux étapes : exactement 6 chiffres.
 */
export const codeValidator = vine.create({
  code: vine
    .string()
    .trim()
    .regex(/^\d{6}$/),
})

/**
 * Demande de lien de réinitialisation du mot de passe.
 */
export const motDePasseOublieValidator = vine.create({
  email: email(),
})

/**
 * Changement de mot de passe par l'utilisateur connecté.
 */
export const changerMotDePasseValidator = vine.create({
  actuel: vine.string(),
  nouveau: vine.string().minLength(LONGUEUR_MIN_MOT_DE_PASSE).maxLength(128).confirmed({
    confirmationField: 'confirmation',
  }),
})

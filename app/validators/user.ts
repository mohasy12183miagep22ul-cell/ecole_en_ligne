import vine from '@vinejs/vine'
import { ROLES } from '#models/role_utilisateur'

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
 * Nouveau mot de passe choisi depuis un lien de réinitialisation.
 */
export const reinitialiserValidator = vine.create({
  nouveau: vine.string().minLength(LONGUEUR_MIN_MOT_DE_PASSE).maxLength(128).confirmed({
    confirmationField: 'confirmation',
  }),
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

const roles = () => vine.array(vine.enum(ROLES)).minLength(1).distinct()

/**
 * Création d'un compte par l'administrateur.
 */
export const creerCompteValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(120),
  // Unicité sur tous les comptes, y compris supprimés logiquement : c'est la
  // contrainte de la table, un e-mail ne sert qu'une fois.
  email: email().unique({ table: 'users', column: 'email' }),
  sousTitre: vine.string().trim().maxLength(120).optional(),
  roles: roles(),
})

/**
 * Rôles d'un compte existant.
 */
export const rolesCompteValidator = vine.create({ roles: roles() })

/**
 * Activation ou désactivation d'un compte.
 */
export const activationCompteValidator = vine.create({ actif: vine.boolean() })

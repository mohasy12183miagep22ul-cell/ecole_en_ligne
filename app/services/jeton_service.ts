import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import type { AccessToken } from '@adonisjs/auth/access_tokens'

const TABLE = 'auth_access_tokens'

/**
 * Jetons d'accès de l'application mobile. Le jeton en clair n'est remis
 * qu'une fois, à la connexion ; la base n'en garde que l'empreinte. Une
 * révocation ne supprime aucune ligne (RG21) : elle ramène l'expiration à
 * l'instant présent, ce qui suffit à faire refuser le jeton.
 */
export default class JetonService {
  static async emettre(user: User, appareil?: string | null) {
    const jeton = await User.accessTokens.create(user, ['*'], {
      name: appareil?.trim().slice(0, 120) || 'Application mobile',
    })
    return {
      type: 'bearer' as const,
      jeton: jeton.value!.release(),
      expireLe: jeton.expiresAt?.toISOString() ?? null,
    }
  }

  /** Révoque le jeton qui porte la requête en cours (déconnexion). */
  static async revoquer(jeton: AccessToken) {
    await db
      .from(TABLE)
      .where('id', String(jeton.identifier))
      .update({ expires_at: DateTime.now().toSQL(), updated_at: DateTime.now().toSQL() })
  }

  /** Révoque tous les jetons encore valables d'un compte. */
  static async revoquerTous(user: User) {
    const maintenant = DateTime.now().toSQL()
    await db
      .from(TABLE)
      .where('tokenable_id', user.id)
      .where((q) => q.whereNull('expires_at').orWhere('expires_at', '>', maintenant))
      .update({ expires_at: maintenant, updated_at: maintenant })
  }
}

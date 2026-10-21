import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Compte affiché dans l'écran « Comptes et rôles ». Rôles préchargés requis.
 */
export default class CompteTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'fullName', 'email', 'sousTitre', 'initials', 'actif']),
      roles: this.resource.roles,
      verrouille: Boolean(
        this.resource.verrouilleJusquA && this.resource.verrouilleJusquA.toMillis() > Date.now()
      ),
      doitChangerMotDePasse: this.resource.doitChangerMotDePasse,
    }
  }
}

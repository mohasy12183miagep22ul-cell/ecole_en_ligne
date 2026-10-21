import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Utilisateur partagé avec toutes les pages. Les rôles doivent être chargés
 * (`load('rolesUtilisateur')`) avant la transformation.
 */
export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'fullName', 'email', 'sousTitre', 'initials']),
      roles: this.resource.roles,
      doitChangerMotDePasse: this.resource.doitChangerMotDePasse,
    }
  }
}

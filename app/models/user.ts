import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import RoleUtilisateur, { type Role } from '#models/role_utilisateur'

/**
 * Espace d'arrivée de chaque rôle, par ordre de priorité quand un compte en
 * cumule plusieurs.
 */
const ACCUEILS: Array<[Role, string]> = [
  ['admin', '/admin'],
  ['direction', '/direction'],
  ['secretariat', '/scolarite/eleves'],
  ['enseignant', '/enseignant/classes'],
  ['professeur_principal', '/enseignant/classes'],
  ['tuteur', '/portail'],
  ['eleve', '/portail'],
]

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  /** Jetons de l'application mobile (garde `api`), valables 30 jours. */
  static accessTokens = DbAccessTokensProvider.forModel(User, {
    prefix: 'eel_',
    expiresIn: '30 days',
  })

  @hasMany(() => RoleUtilisateur, {
    onQuery: (q) => q.whereNull('deleted_at'),
  })
  declare rolesUtilisateur: HasMany<typeof RoleUtilisateur>

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }

  /** Rôles actifs du compte. Nécessite `load('rolesUtilisateur')`. */
  get roles(): Role[] {
    return (this.rolesUtilisateur ?? []).map((r) => r.role)
  }

  aLeRole(...roles: Role[]) {
    return this.roles.some((r) => roles.includes(r))
  }

  get accueil() {
    return ACCUEILS.find(([r]) => this.roles.includes(r))?.[1] ?? '/login'
  }

  /**
   * Espaces ouverts dans l'application mobile, par ordre de priorité. Le
   * paramétrage (administrateur) et la scolarité restent sur le web.
   */
  get espacesMobiles() {
    const espaces: Array<'direction' | 'enseignant' | 'portail'> = []
    if (this.aLeRole('direction')) espaces.push('direction')
    if (this.aLeRole('enseignant', 'professeur_principal')) espaces.push('enseignant')
    if (this.aLeRole('tuteur')) espaces.push('portail')
    return espaces
  }
}

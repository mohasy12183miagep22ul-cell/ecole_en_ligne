import type User from '#models/user'
import type Inscription from '#models/inscription'
import { BasePolicy } from '@adonisjs/bouncer'

/**
 * Droits sur les dossiers d'inscription (§ 2) : le secrétariat crée et
 * complète les dossiers ; la direction valide, refuse et seule peut forcer
 * une classe pleine (RG7).
 */
export default class InscriptionPolicy extends BasePolicy {
  async #aLeRole(user: User, ...roles: Parameters<User['aLeRole']>) {
    await user.load('rolesUtilisateur')
    return user.aLeRole(...roles)
  }

  /** Créer, compléter, soumettre, annuler, changer de classe, importer. */
  async gerer(user: User, _inscription?: Inscription) {
    return this.#aLeRole(user, 'secretariat', 'direction')
  }

  /** Lire une pièce du dossier (route authentifiée, jamais d'URL publique). */
  async lirePiece(user: User, _inscription?: Inscription) {
    return this.#aLeRole(user, 'secretariat', 'direction')
  }

  async valider(user: User, _inscription?: Inscription) {
    return this.#aLeRole(user, 'direction')
  }

  /** RG7 : forcer une affectation au-delà de la capacité. */
  async forcerCapacite(user: User) {
    return this.#aLeRole(user, 'direction')
  }
}

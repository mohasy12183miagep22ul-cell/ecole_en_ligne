import type User from '#models/user'
import type Eleve from '#models/eleve'
import type { StatutEleve } from '#models/eleve'
import { BasePolicy } from '@adonisjs/bouncer'

/**
 * Droits sur la fiche élève (§ 2). Secrétariat et direction gèrent les
 * dossiers ; l'exclusion, le diplôme et la réactivation (RG8) relèvent de la
 * direction. Le portail famille (RG20) viendra avec le lot 4.
 */
export default class ElevePolicy extends BasePolicy {
  async #roles(user: User) {
    await user.load('rolesUtilisateur')
    return user
  }

  async voir(user: User, _eleve?: Eleve) {
    const u = await this.#roles(user)
    return u.aLeRole('secretariat', 'direction')
  }

  async modifier(user: User, _eleve?: Eleve) {
    const u = await this.#roles(user)
    return u.aLeRole('secretariat', 'direction')
  }

  async changerStatut(user: User, _eleve: Eleve, statut: Exclude<StatutEleve, 'inscrit'>) {
    const u = await this.#roles(user)
    if (statut === 'transfere' || statut === 'abandon') return u.aLeRole('secretariat', 'direction')
    return u.aLeRole('direction')
  }

  async reactiver(user: User, _eleve?: Eleve) {
    const u = await this.#roles(user)
    return u.aLeRole('direction')
  }
}

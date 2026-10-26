import type User from '#models/user'
import type Affectation from '#models/affectation'
import type Evaluation from '#models/evaluation'
import AnneeScolaire from '#models/annee_scolaire'
import { BasePolicy } from '@adonisjs/bouncer'

/**
 * Droits sur les évaluations et les notes (§ 12).
 * RG9 : un enseignant n'agit que sur ses affectations de l'année active ;
 * un identifiant manipulé dans l'URL se heurte à un refus.
 * RG12 : la validation et le déverrouillage relèvent de la direction (chef
 * d'établissement, réponse par défaut du cahier).
 */
export default class EvaluationPolicy extends BasePolicy {
  async #roles(user: User) {
    await user.load('rolesUtilisateur')
    return user
  }

  /** L'affectation appartient à l'enseignant et porte sur l'année active. */
  async utiliserAffectation(user: User, affectation: Affectation) {
    const u = await this.#roles(user)
    if (!u.aLeRole('enseignant', 'professeur_principal')) return false
    if (affectation.enseignantId !== user.id || affectation.deletedAt) return false
    const active = await AnneeScolaire.active()
    return active?.id === affectation.anneeId
  }

  /** Saisir les notes et modifier l'évaluation (affectation préchargée). */
  async saisir(user: User, evaluation: Evaluation) {
    return this.utiliserAffectation(user, evaluation.affectation)
  }

  /** Consulter : l'enseignant de l'affectation, ou la direction. */
  async voir(user: User, evaluation: Evaluation) {
    const u = await this.#roles(user)
    if (u.aLeRole('direction')) return true
    return this.utiliserAffectation(user, evaluation.affectation)
  }

  async valider(user: User) {
    const u = await this.#roles(user)
    return u.aLeRole('direction')
  }

  async deverrouiller(user: User) {
    const u = await this.#roles(user)
    return u.aLeRole('direction')
  }
}

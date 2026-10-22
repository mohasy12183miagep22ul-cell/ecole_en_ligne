import User from '#models/user'
import AnneeScolaire from '#models/annee_scolaire'

/**
 * Listes de choix partagées par les écrans de structure.
 */
export default class ChoixService {
  /** Enseignants actifs (professeur principal, affectations). */
  static async enseignantsActifs() {
    const users = await User.query()
      .whereNull('deleted_at')
      .where('actif', true)
      .whereHas('rolesUtilisateur', (q) => q.where('role', 'enseignant'))
      .orderBy('full_name')
    return users.map((u) => ({ id: u.id, nom: u.fullName ?? u.email, sousTitre: u.sousTitre }))
  }

  /** Années pour le sélecteur d'année, de la plus récente à la plus ancienne. */
  static async annees() {
    const annees = await AnneeScolaire.query().whereNull('deleted_at').orderBy('date_debut', 'desc')
    return annees.map((a) => ({ id: a.id, libelle: a.libelle, etat: a.etat }))
  }
}

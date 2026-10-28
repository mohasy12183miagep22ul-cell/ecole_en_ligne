import db from '@adonisjs/lucid/services/db'
import encryption from '@adonisjs/core/services/encryption'
import Eleve from '#models/eleve'
import { LIENS_PARENTE } from '#models/tuteur'
import type User from '#models/user'
import type AnneeScolaire from '#models/annee_scolaire'

const BUT = 'portail_eleve'

/**
 * Portail famille de l'application mobile (RG20) : un tuteur ne voit que les
 * élèves qui lui sont rattachés, en lecture seule. Aucune note ni aucun
 * bulletin ne passe par ici : ils ne seront visibles qu'après publication
 * par la direction (RG18), avec le lot des bulletins.
 *
 * Les élèves sont désignés par un identifiant opaque, jamais par leur
 * identifiant séquentiel.
 */
export default class PortailService {
  static masquer(eleveId: number) {
    return encryption.encrypt(String(eleveId), undefined, BUT)
  }

  static demasquer(opaque: string) {
    const id = Number(encryption.decrypt<string>(opaque, BUT))
    return Number.isInteger(id) && id > 0 ? id : null
  }

  /** Identifiants des élèves rattachés au compte (tuteur et lien actifs). */
  static async #rattaches(user: User) {
    const lignes = await db
      .from('eleve_tuteur as et')
      .join('tuteurs as t', 't.id', 'et.tuteur_id')
      .join('eleves as e', 'e.id', 'et.eleve_id')
      .where('t.user_id', user.id)
      .whereNull('t.deleted_at')
      .whereNull('et.deleted_at')
      .whereNull('e.deleted_at')
      .distinct('e.id')
    return lignes.map((l) => l.id as number)
  }

  static async estRattache(user: User, eleveId: number) {
    const rattaches = await this.#rattaches(user)
    return rattaches.includes(eleveId)
  }

  /** Inscription validée de l'année active, avec classe et niveau. */
  static #inscriptionsActives(eleveIds: number[], annee: AnneeScolaire | null) {
    if (!annee || eleveIds.length === 0) return Promise.resolve([])
    return db
      .from('inscriptions as i')
      .join('niveaux as n', 'n.id', 'i.niveau_id')
      .leftJoin('classes as c', 'c.id', 'i.classe_id')
      .whereIn('i.eleve_id', eleveIds)
      .where('i.annee_id', annee.id)
      .where('i.etat', 'valide')
      .whereNull('i.deleted_at')
      .select('i.eleve_id', 'n.libelle as niveau', 'c.libelle as classe')
  }

  static async enfants(user: User, annee: AnneeScolaire | null) {
    const ids = await this.#rattaches(user)
    if (ids.length === 0) return []
    const eleves = await Eleve.query().whereIn('id', ids).orderBy('nom').orderBy('prenoms')
    const actives = await this.#inscriptionsActives(ids, annee)
    const inscriptions = new Map(actives.map((i) => [i.eleve_id as number, i]))
    return eleves.map((e) => {
      const i = inscriptions.get(e.id)
      return {
        id: this.masquer(e.id),
        matricule: e.matricule,
        nom: e.nom,
        prenoms: e.prenoms,
        sexe: e.sexe,
        classe: (i?.classe as string | undefined) ?? null,
        niveau: (i?.niveau as string | undefined) ?? null,
      }
    })
  }

  /** Dossier de l'élève tel que la famille le consulte (pas de pièce, pas de journal). */
  static async dossier(eleve: Eleve, annee: AnneeScolaire | null) {
    await eleve.load('tuteurs')
    const [inscription] = await this.#inscriptionsActives([eleve.id], annee)
    return {
      id: this.masquer(eleve.id),
      matricule: eleve.matricule,
      nom: eleve.nom,
      prenoms: eleve.prenoms,
      sexe: eleve.sexe,
      dateNaissance: eleve.dateNaissance.toISODate(),
      lieuNaissance: eleve.lieuNaissance,
      nationalite: eleve.nationalite,
      statut: eleve.statut ?? 'inscrit',
      scolarite: annee
        ? {
            annee: annee.libelle,
            niveau: (inscription?.niveau as string | undefined) ?? null,
            classe: (inscription?.classe as string | undefined) ?? null,
          }
        : null,
      tuteurs: eleve.tuteurs.map((t) => ({
        nom: t.nom,
        lienParente: LIENS_PARENTE[t.lienParente],
        principal: Boolean(t.$extras.pivot_principal),
      })),
    }
  }
}

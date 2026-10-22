import type User from '#models/user'
import type FichierGenere from '#models/fichier_genere'
import { BasePolicy } from '@adonisjs/bouncer'

/** Un document généré ne se télécharge que par la personne qui l'a demandé. */
export default class FichierGenerePolicy extends BasePolicy {
  telecharger(user: User, fichier: FichierGenere) {
    return fichier.userId === user.id
  }
}

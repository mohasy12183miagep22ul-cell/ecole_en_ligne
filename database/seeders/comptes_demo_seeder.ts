import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import RoleUtilisateur, { type Role } from '#models/role_utilisateur'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

/**
 * Les cinq profils de démonstration du prototype. Mot de passe commun :
 * « Flamboyant2026 ». Réservé au développement et aux tests.
 */
export const COMPTES_DEMO: Array<{
  fullName: string
  email: string
  sousTitre: string
  doubleFacteur: boolean
  roles: Role[]
}> = [
  {
    fullName: 'Fatoumata Diallo',
    email: 'f.diallo@mail.gn',
    sousTitre: 'Tutrice · 2 enfants',
    doubleFacteur: false,
    roles: ['tuteur'],
  },
  {
    fullName: 'Ibrahima Sow',
    email: 'i.sow@flamboyants.edu.gn',
    sousTitre: 'Mathématiques · PP 3e A',
    doubleFacteur: false,
    roles: ['enseignant', 'professeur_principal'],
  },
  {
    fullName: 'Mariama Camara',
    email: 'm.camara@flamboyants.edu.gn',
    sousTitre: 'Cheffe d’établissement',
    doubleFacteur: true,
    roles: ['direction'],
  },
  {
    fullName: 'Alseny Bangoura',
    email: 'a.bangoura@flamboyants.edu.gn',
    sousTitre: 'Agent de scolarité',
    doubleFacteur: false,
    roles: ['secretariat'],
  },
  {
    fullName: 'Kadiatou Barry',
    email: 'k.barry@flamboyants.edu.gn',
    sousTitre: 'Responsable informatique',
    doubleFacteur: true,
    roles: ['admin'],
  },
]
export const MOT_DE_PASSE_DEMO = 'Flamboyant2026'

export default class extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    await db.transaction(async (trx) => {
      for (const { roles, ...compte } of COMPTES_DEMO) {
        const user = await User.updateOrCreate(
          { email: compte.email },
          {
            ...compte,
            password: MOT_DE_PASSE_DEMO,
            actif: true,
            // Comptes de démonstration : pas de changement imposé.
            doitChangerMotDePasse: false,
            echecsConnexion: 0,
            verrouilleJusquA: null,
          },
          { client: trx }
        )
        for (const role of roles) {
          await RoleUtilisateur.firstOrCreate(
            { userId: user.id, role },
            { userId: user.id, role },
            { client: trx }
          )
        }
      }
    })
  }
}

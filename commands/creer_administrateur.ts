import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Création du premier compte administrateur à l'installation. Les comptes
 * suivants se créent depuis l'écran Comptes. Le mot de passe provisoire est
 * affiché une seule fois et devra être changé à la première connexion.
 */
export default class CreerAdministrateur extends BaseCommand {
  static commandName = 'compte:administrateur'
  static description = 'Crée un compte administrateur (installation)'
  static options: CommandOptions = { startApp: true }

  @flags.string({ description: 'Nom complet', required: true })
  declare nom: string

  @flags.string({ description: 'Adresse e-mail de connexion', required: true })
  declare email: string

  async run() {
    const { default: User } = await import('#models/user')
    const { default: CompteService } = await import('#services/compte_service')

    const email = this.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.logger.error('Adresse e-mail invalide.')
      this.exitCode = 1
      return
    }
    if (await User.findBy('email', email)) {
      this.logger.error('Un compte existe déjà avec cette adresse.')
      this.exitCode = 1
      return
    }
    const { motDePasse } = await CompteService.creer(
      { fullName: this.nom.trim(), email, roles: ['admin'] },
      null
    )
    this.logger.success(`Compte administrateur créé pour ${email}`)
    this.logger.info(`Mot de passe provisoire (affiché une seule fois) : ${motDePasse}`)
  }
}

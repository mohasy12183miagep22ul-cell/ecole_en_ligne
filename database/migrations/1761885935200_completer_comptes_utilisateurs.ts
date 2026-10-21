import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Comptes : activation, verrouillage après échecs, changement de mot de passe
 * imposé, second facteur et suppression logique (RG21).
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('sous_titre').nullable()
      table.boolean('actif').notNullable().defaultTo(true)
      table.boolean('double_facteur').notNullable().defaultTo(false)
      table.boolean('doit_changer_mot_de_passe').notNullable().defaultTo(true)
      table.integer('echecs_connexion').notNullable().defaultTo(0)
      table.timestamp('verrouille_jusqu_a').nullable()
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns(
        'sous_titre',
        'actif',
        'double_facteur',
        'doit_changer_mot_de_passe',
        'echecs_connexion',
        'verrouille_jusqu_a',
        'deleted_at'
      )
    })
  }
}

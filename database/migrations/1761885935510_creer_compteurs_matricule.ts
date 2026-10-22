import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Compteur des matricules par année de première inscription (RG4 :
 * AAAA-NNNNN). Une ligne par année, verrouillée pendant l'attribution pour
 * que deux inscriptions simultanées n'obtiennent jamais le même numéro.
 */
export default class extends BaseSchema {
  protected tableName = 'compteurs_matricule'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.smallint('annee').primary()
      table.integer('dernier').notNullable().defaultTo(0)
      table.check('dernier BETWEEN 0 AND 99999', [], 'compteurs_matricule_borne')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

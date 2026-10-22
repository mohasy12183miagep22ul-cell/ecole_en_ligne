import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Paramètres de l'établissement (cahier des charges § 11, écran
 * « paramètres de l'établissement »). Une seule ligne : mono-établissement,
 * hypothèse de travail tant que l'atelier de cadrage n'a pas tranché.
 * Repris sur les documents édités (certificats, fiches, bulletins).
 */
export default class extends BaseSchema {
  protected tableName = 'parametres_etablissement'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('nom', 120).notNullable()
      table.string('adresse', 200).nullable()
      table.string('ville', 80).nullable()
      table.string('pays', 80).nullable()
      table.string('telephone', 30).nullable()
      table.string('email', 254).nullable()
      table.string('chef_etablissement', 120).nullable()
      table.string('titre_chef', 80).notNullable().defaultTo('Chef d’établissement')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

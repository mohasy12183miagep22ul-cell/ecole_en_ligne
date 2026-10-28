import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Second facteur de l'application mobile : sans session, le code en attente
 * est porté par un défi à identifiant opaque. Seule l'empreinte du code est
 * stockée ; 10 minutes de validité et 5 essais au plus, comme sur le web.
 */
export default class extends BaseSchema {
  protected tableName = 'defis_connexion'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.string('empreinte', 64).notNullable()
      table.timestamp('expire_le').notNullable()
      table.integer('essais').notNullable().defaultTo(0)
      table.timestamp('utilise_le').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

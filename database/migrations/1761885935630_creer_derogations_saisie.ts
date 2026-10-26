import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Dérogation à la fenêtre de saisie (RG13) : accordée par la direction pour
 * une affectation et une période, jusqu'à une date, avec un motif.
 */
export default class extends BaseSchema {
  protected tableName = 'derogations_saisie'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('affectation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('affectations')
        .onDelete('RESTRICT')
      table
        .integer('periode_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('periodes')
        .onDelete('RESTRICT')
      table.date('jusqu_au').notNullable()
      table.string('motif', 250).notNullable()
      table
        .integer('accordee_par')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.index(['affectation_id', 'periode_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

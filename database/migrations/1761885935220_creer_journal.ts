import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Journal des opérations sensibles (RG22). Table en ajout seul : pas de
 * updated_at ni de deleted_at, et deux règles PostgreSQL neutralisent toute
 * modification ou suppression, y compris par une requête écrite à la main.
 */
export default class extends BaseSchema {
  protected tableName = 'journal'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.string('action', 80).notNullable()
      table.string('entite', 60).notNullable()
      table.string('entite_id', 60).nullable()
      table.jsonb('avant').nullable()
      table.jsonb('apres').nullable()
      table.string('ip', 45).nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.index(['entite', 'created_at'])
    })

    this.schema.raw(
      'CREATE RULE journal_sans_modification AS ON UPDATE TO journal DO INSTEAD NOTHING'
    )
    this.schema.raw(
      'CREATE RULE journal_sans_suppression AS ON DELETE TO journal DO INSTEAD NOTHING'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

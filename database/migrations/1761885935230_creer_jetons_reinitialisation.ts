import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Jetons de réinitialisation du mot de passe : seule l'empreinte SHA-256 du
 * jeton est stockée, le jeton en clair ne vit que dans le lien envoyé.
 * Valables 30 minutes, à usage unique.
 */
export default class extends BaseSchema {
  protected tableName = 'jetons_reinitialisation'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.string('empreinte', 64).notNullable().unique()
      table.timestamp('expire_le').notNullable()
      table.timestamp('utilise_le').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Jetons d'accès de l'application mobile (garde `api`). Seule l'empreinte du
 * jeton est stockée. Un jeton révoqué (déconnexion, compte désactivé) n'est
 * pas effacé : sa date d'expiration est ramenée à l'instant de la révocation
 * (RG21).
 */
export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('tokenable_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable()
      table.text('abilities').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()
      table.index(['tokenable_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

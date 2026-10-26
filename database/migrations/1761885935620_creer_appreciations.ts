import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Appréciation d'un enseignant par élève, matière et période (§ 6),
 * 250 caractères au plus.
 */
export default class extends BaseSchema {
  protected tableName = 'appreciations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('eleve_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('eleves')
        .onDelete('RESTRICT')
      table
        .integer('matiere_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('matieres')
        .onDelete('RESTRICT')
      table
        .integer('periode_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('periodes')
        .onDelete('RESTRICT')
      table.string('texte', 250).notNullable()
      table
        .integer('auteur_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
    })
    this.schema.raw(
      `CREATE UNIQUE INDEX appreciations_unique ON appreciations (eleve_id, matiere_id, periode_id)
       WHERE deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

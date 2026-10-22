import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Affectation d'un enseignant : classe + matière + année. Elle ouvre le droit
 * de saisir des notes sur ce périmètre, et rien d'autre (RG9).
 */
export default class extends BaseSchema {
  protected tableName = 'affectations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('enseignant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table
        .integer('classe_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('classes')
        .onDelete('RESTRICT')
      table
        .integer('matiere_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('matieres')
        .onDelete('RESTRICT')
      table
        .integer('annee_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('annees_scolaires')
        .onDelete('RESTRICT')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.index(['annee_id', 'enseignant_id'])
      table.index(['classe_id'])
    })
    this.schema.raw(
      `CREATE UNIQUE INDEX affectations_unique
       ON affectations (enseignant_id, classe_id, matiere_id, annee_id)
       WHERE deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

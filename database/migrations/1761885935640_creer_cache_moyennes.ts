import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Cache daté des résultats d'une classe sur une période (RG14). Ce n'est
 * jamais une donnée de référence : le résultat est recalculé dès que
 * l'empreinte des notes, des évaluations ou des coefficients change.
 */
export default class extends BaseSchema {
  protected tableName = 'cache_moyennes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('classe_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('classes')
        .onDelete('RESTRICT')
      table
        .integer('periode_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('periodes')
        .onDelete('RESTRICT')
      table.string('empreinte', 200).notNullable()
      table.jsonb('resultat').notNullable()
      table.timestamp('calcule_le').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
    })
    this.schema.raw(
      `CREATE UNIQUE INDEX cache_moyennes_unique ON cache_moyennes (classe_id, periode_id)
       WHERE deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

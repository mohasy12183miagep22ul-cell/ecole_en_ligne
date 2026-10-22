import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Classes : recréées chaque année, rattachées à un niveau permanent.
 */
export default class extends BaseSchema {
  protected tableName = 'classes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('annee_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('annees_scolaires')
        .onDelete('RESTRICT')
      table
        .integer('niveau_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('niveaux')
        .onDelete('RESTRICT')
      table.string('libelle', 30).notNullable()
      table.smallint('capacite').notNullable()
      table.string('salle', 30).nullable()
      table
        .integer('professeur_principal_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.check('capacite > 0', [], 'classes_capacite')
      table.index(['annee_id', 'niveau_id'])
    })
    this.schema.raw(
      `CREATE UNIQUE INDEX classes_annee_libelle ON classes (annee_id, libelle)
       WHERE deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

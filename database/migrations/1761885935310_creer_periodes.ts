import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Périodes d'une année (trimestres ou semestres), avec leur fenêtre de
 * saisie des notes (RG13).
 */
export default class extends BaseSchema {
  protected tableName = 'periodes'

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
      table.string('libelle', 40).notNullable()
      table.smallint('ordre').notNullable()
      table.date('debut_saisie').notNullable()
      table.date('fin_saisie').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.unique(['annee_id', 'ordre'])
      table.check('fin_saisie >= debut_saisie', [], 'periodes_dates')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

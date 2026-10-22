import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Import initial des élèves depuis Excel (§ 4) : le fichier est analysé et
 * son rapport d'erreurs ligne par ligne conservé ici ; rien n'est enregistré
 * dans les tables métier tant que le rapport n'est pas accepté.
 */
export default class extends BaseSchema {
  protected tableName = 'imports'

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
      table
        .integer('annee_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('annees_scolaires')
        .onDelete('RESTRICT')
      table.string('nom_fichier', 200).notNullable()
      /** Lignes analysées, prêtes à enregistrer, et rapport d'erreurs. */
      table.jsonb('lignes').notNullable()
      table.jsonb('erreurs').notNullable()
      table
        .enum('etat', ['analyse', 'accepte', 'abandonne'], {
          useNative: true,
          enumName: 'etat_import',
          existingType: false,
        })
        .notNullable()
        .defaultTo('analyse')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS etat_import')
  }
}

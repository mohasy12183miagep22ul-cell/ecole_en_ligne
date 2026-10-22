import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Documents produits en file d'attente (§ 9 : PDF et exports ne bloquent
 * jamais une requête web) : certificats, listes, registre. Chaque fichier
 * appartient à l'utilisateur qui l'a demandé et ne se télécharge que par lui.
 */
export default class extends BaseSchema {
  protected tableName = 'fichiers_generes'

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
      table.string('type', 40).notNullable()
      table.string('libelle', 200).notNullable()
      table
        .enum('format', ['pdf', 'xlsx'], {
          useNative: true,
          enumName: 'format_fichier',
          existingType: false,
        })
        .notNullable()
      table.jsonb('parametres').notNullable()
      table
        .enum('etat', ['en_attente', 'pret', 'echec'], {
          useNative: true,
          enumName: 'etat_fichier',
          existingType: false,
        })
        .notNullable()
        .defaultTo('en_attente')
      table.string('fichier', 200).nullable()
      table.string('erreur', 500).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.index(['user_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS format_fichier')
    this.schema.raw('DROP TYPE IF EXISTS etat_fichier')
  }
}

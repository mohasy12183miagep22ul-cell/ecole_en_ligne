import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Programme d'un niveau : matières enseignées et leur coefficient (RG3 : le
 * coefficient appartient au couple niveau + matière, jamais à la matière).
 */
export default class extends BaseSchema {
  protected tableName = 'niveau_matiere'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('niveau_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('niveaux')
        .onDelete('RESTRICT')
      table
        .integer('matiere_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('matieres')
        .onDelete('RESTRICT')
      table.decimal('coefficient', 4, 2).notNullable()
      table.boolean('obligatoire').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.check('coefficient > 0', [], 'niveau_matiere_coefficient')
    })
    this.schema.raw(
      `CREATE UNIQUE INDEX niveau_matiere_unique ON niveau_matiere (niveau_id, matiere_id)
       WHERE deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

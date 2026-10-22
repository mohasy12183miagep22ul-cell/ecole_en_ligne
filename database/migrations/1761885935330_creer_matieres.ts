import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Matières. Le coefficient n'est pas ici : il appartient au couple
 * niveau + matière (RG3, table niveau_matiere).
 */
export default class extends BaseSchema {
  protected tableName = 'matieres'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('code', 10).notNullable()
      table.string('libelle', 60).notNullable()
      table
        .enum('famille', ['litteraire', 'scientifique', 'langue', 'artistique', 'sportive'], {
          useNative: true,
          enumName: 'famille_matiere',
          existingType: false,
        })
        .notNullable()
      table.smallint('note_max_defaut').notNullable().defaultTo(20)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.check('note_max_defaut > 0', [], 'matieres_note_max')
    })
    this.schema.raw('CREATE UNIQUE INDEX matieres_code ON matieres (code) WHERE deleted_at IS NULL')
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS famille_matiere')
  }
}

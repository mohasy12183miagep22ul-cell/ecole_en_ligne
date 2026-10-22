import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Niveaux (6e, 5e, Terminale A…) : permanents d'une année sur l'autre.
 * Le cycle reste ouvert (primaire, collège, lycée) tant que le cycle visé par
 * l'établissement n'est pas tranché.
 */
export default class extends BaseSchema {
  protected tableName = 'niveaux'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('code', 20).notNullable()
      table.string('libelle', 60).notNullable()
      table.smallint('ordre').notNullable()
      table
        .enum('cycle', ['primaire', 'college', 'lycee'], {
          useNative: true,
          enumName: 'cycle_niveau',
          existingType: false,
        })
        .notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
    })
    this.schema.raw('CREATE UNIQUE INDEX niveaux_code ON niveaux (code) WHERE deleted_at IS NULL')
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS cycle_niveau')
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Tuteurs (§ 10) et rattachement aux élèves. Un tuteur peut être réutilisé
 * pour une fratrie (§ 3) ; son compte du portail famille est `user_id`.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('tuteurs', (table) => {
      table.increments('id')
      table.string('nom', 120).notNullable()
      table
        .enum('lien_parente', ['mere', 'pere', 'tante', 'oncle', 'grand_parent', 'autre'], {
          useNative: true,
          enumName: 'lien_parente',
          existingType: false,
        })
        .notNullable()
      table.string('telephone', 30).notNullable()
      table.string('profession', 80).nullable()
      table.string('adresse', 200).nullable()
      table.string('email', 254).nullable()
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.index(['telephone'])
    })

    this.schema.createTable('eleve_tuteur', (table) => {
      table.increments('id')
      table
        .integer('eleve_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('eleves')
        .onDelete('RESTRICT')
      table
        .integer('tuteur_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tuteurs')
        .onDelete('RESTRICT')
      table.boolean('principal').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
    })
    this.schema.raw(
      `CREATE UNIQUE INDEX eleve_tuteur_unique ON eleve_tuteur (eleve_id, tuteur_id)
       WHERE deleted_at IS NULL`
    )
    // Un seul tuteur principal par élève.
    this.schema.raw(
      `CREATE UNIQUE INDEX eleve_tuteur_un_principal ON eleve_tuteur (eleve_id)
       WHERE principal AND deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.dropTable('eleve_tuteur')
    this.schema.dropTable('tuteurs')
    this.schema.raw('DROP TYPE IF EXISTS lien_parente')
  }
}

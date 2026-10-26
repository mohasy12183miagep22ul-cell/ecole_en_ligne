import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Évaluation (§ 6) : elle appartient à une affectation (enseignant + classe +
 * matière, RG9) et à une période. État : brouillon → soumise → validée →
 * verrouillée ; retour au brouillon par la direction seulement (RG12).
 */
export default class extends BaseSchema {
  protected tableName = 'evaluations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('affectation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('affectations')
        .onDelete('RESTRICT')
      table
        .integer('periode_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('periodes')
        .onDelete('RESTRICT')
      table
        .enum('type', ['interrogation', 'devoir', 'composition', 'tp', 'oral'], {
          useNative: true,
          enumName: 'type_evaluation',
          existingType: false,
        })
        .notNullable()
      table.string('titre', 120).notNullable()
      table.date('date').notNullable()
      table.decimal('note_max', 5, 2).notNullable().defaultTo(20)
      table.decimal('poids', 5, 2).notNullable().defaultTo(1)
      table
        .enum('etat', ['brouillon', 'soumise', 'validee', 'verrouillee'], {
          useNative: true,
          enumName: 'etat_evaluation',
          existingType: false,
        })
        .notNullable()
        .defaultTo('brouillon')
      table.timestamp('soumise_le').nullable()
      table
        .integer('validee_par')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('validee_le').nullable()
      // Motif du dernier retour au brouillon (refus ou déverrouillage).
      table.string('motif_retour', 250).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.index(['affectation_id', 'periode_id'])
    })
    this.schema.raw(
      `ALTER TABLE evaluations
         ADD CONSTRAINT evaluations_note_max CHECK (note_max > 0 AND note_max <= 100),
         ADD CONSTRAINT evaluations_poids CHECK (poids > 0)`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS etat_evaluation')
    this.schema.raw('DROP TYPE IF EXISTS type_evaluation')
  }
}

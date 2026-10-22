import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Inscriptions (§ 3) : un dossier pour un couple élève + année scolaire, qui
 * rattache l'élève à une classe. États : brouillon, soumis, validé, refusé,
 * annulé.
 *
 * RG5 : une seule inscription validée par élève et par année (index unique
 * partiel) ; un seul dossier en cours (brouillon ou soumis) à la fois.
 * RG7 : un dépassement de capacité forcé par la direction garde son motif.
 */
export default class extends BaseSchema {
  protected tableName = 'inscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('eleve_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('eleves')
        .onDelete('RESTRICT')
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
      table
        .integer('classe_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('classes')
        .onDelete('RESTRICT')
      table.date('date_inscription').notNullable()
      table
        .enum('etat', ['brouillon', 'soumis', 'valide', 'refuse', 'annule'], {
          useNative: true,
          enumName: 'etat_inscription',
          existingType: false,
        })
        .notNullable()
        .defaultTo('brouillon')
      table.boolean('redoublant').notNullable().defaultTo(false)
      table.string('etablissement_origine', 120).nullable()
      /** Motif d'un refus ou d'une annulation. */
      table.string('motif', 250).nullable()
      /** RG7 : motif du dépassement de capacité forcé par la direction. */
      table.string('motif_depassement', 250).nullable()
      table
        .integer('valide_par')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('valide_le').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.index(['annee_id', 'classe_id'])
      table.index(['eleve_id'])
      table.check(
        `etat <> 'valide' OR (classe_id IS NOT NULL AND valide_le IS NOT NULL)`,
        [],
        'inscriptions_validee_complete'
      )
    })
    // RG5 : une seule inscription validée par élève et par année.
    this.schema.raw(
      `CREATE UNIQUE INDEX inscriptions_une_validee ON inscriptions (eleve_id, annee_id)
       WHERE etat = 'valide' AND deleted_at IS NULL`
    )
    // Un seul dossier en cours par élève et par année.
    this.schema.raw(
      `CREATE UNIQUE INDEX inscriptions_un_dossier_en_cours ON inscriptions (eleve_id, annee_id)
       WHERE etat IN ('brouillon', 'soumis') AND deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS etat_inscription')
  }
}

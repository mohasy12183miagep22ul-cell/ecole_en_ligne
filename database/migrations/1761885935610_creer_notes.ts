import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Note d'un élève à une évaluation (§ 6). Les règles tiennent en base, pas
 * seulement dans le code :
 * - une note par élève et par évaluation ;
 * - RG10 : valeur entre 0 et la note maximale de l'évaluation ;
 * - RG11 : un absent n'a pas de valeur (ce n'est pas un zéro) ;
 * - RG12 : aucune écriture sur une évaluation qui n'est plus en brouillon.
 */
export default class extends BaseSchema {
  protected tableName = 'notes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('evaluation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('evaluations')
        .onDelete('RESTRICT')
      table
        .integer('eleve_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('eleves')
        .onDelete('RESTRICT')
      table.decimal('valeur', 5, 2).nullable()
      table.boolean('absent').notNullable().defaultTo(false)
      table.string('observation', 120).nullable()
      table
        .integer('saisie_par')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.index(['eleve_id'])
    })
    this.schema.raw(
      `CREATE UNIQUE INDEX notes_evaluation_eleve ON notes (evaluation_id, eleve_id)
       WHERE deleted_at IS NULL`
    )
    this.schema.raw(
      `ALTER TABLE notes
         ADD CONSTRAINT notes_valeur_positive CHECK (valeur IS NULL OR valeur >= 0),
         ADD CONSTRAINT notes_absent_sans_valeur CHECK (NOT (absent AND valeur IS NOT NULL))`
    )
    this.schema.raw(`
      CREATE FUNCTION notes_controle() RETURNS trigger AS $$
      DECLARE e RECORD;
      BEGIN
        SELECT note_max, etat INTO e FROM evaluations WHERE id = NEW.evaluation_id;
        IF e.etat <> 'brouillon' THEN
          RAISE EXCEPTION 'Évaluation % non modifiable (état %)', NEW.evaluation_id, e.etat
            USING ERRCODE = 'check_violation';
        END IF;
        IF NEW.valeur IS NOT NULL AND NEW.valeur > e.note_max THEN
          RAISE EXCEPTION 'Note % supérieure à la note maximale %', NEW.valeur, e.note_max
            USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `)
    this.schema.raw(
      `CREATE TRIGGER notes_controle BEFORE INSERT OR UPDATE ON notes
       FOR EACH ROW EXECUTE FUNCTION notes_controle()`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP FUNCTION IF EXISTS notes_controle()')
  }
}

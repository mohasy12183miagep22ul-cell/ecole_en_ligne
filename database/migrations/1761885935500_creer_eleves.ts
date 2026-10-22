import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Élèves : une personne unique, identifiée par un matricule à vie (RG4). Son
 * appartenance à une classe est portée par l'inscription de l'année, jamais
 * par la fiche élève (cahier des charges § 4).
 *
 * Statut : null tant qu'aucune inscription n'a été validée ; puis inscrit,
 * transféré, abandon, diplômé ou exclu. Transfert et abandon portent un motif
 * et une date d'effet.
 *
 * Index : matricule (unique) et trigramme sur nom + prénoms, insensible aux
 * accents, pour la recherche plein texte (§ 10).
 */
export default class extends BaseSchema {
  protected tableName = 'eleves'

  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm')
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS unaccent')
    // unaccent() n'est pas IMMUTABLE : une enveloppe l'est, pour l'indexer.
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION sans_accent(texte text) RETURNS text
      LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
      AS $$ SELECT public.unaccent('public.unaccent', texte) $$
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('matricule', 10).notNullable()
      table.string('nom', 80).notNullable()
      table.string('prenoms', 120).notNullable()
      table
        .enum('sexe', ['F', 'M'], { useNative: true, enumName: 'sexe_eleve', existingType: false })
        .notNullable()
      table.date('date_naissance').notNullable()
      table.string('lieu_naissance', 80).notNullable()
      table.string('nationalite', 60).nullable()
      table.string('numero_acte', 40).nullable()
      /** Chemin de la photo dans le stockage privé (servie par route authentifiée). */
      table.string('photo', 200).nullable()
      table
        .enum('statut', ['inscrit', 'transfere', 'abandon', 'diplome', 'exclu'], {
          useNative: true,
          enumName: 'statut_eleve',
          existingType: false,
        })
        .nullable()
      table.string('statut_motif', 250).nullable()
      table.date('statut_date').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.check(
        `statut NOT IN ('transfere', 'abandon') OR (statut_motif IS NOT NULL AND statut_date IS NOT NULL)`,
        [],
        'eleves_statut_motif'
      )
      table.check(`matricule ~ '^[0-9]{4}-[0-9]{5}$'`, [], 'eleves_matricule_format')
    })

    // RG4 : matricule unique (y compris élèves supprimés logiquement).
    this.schema.raw('CREATE UNIQUE INDEX eleves_matricule ON eleves (matricule)')
    this.schema.raw(
      `CREATE INDEX eleves_recherche ON eleves
       USING gin (sans_accent(lower(nom || ' ' || prenoms)) gin_trgm_ops)`
    )
    // RG4 : matricule immuable, garanti par la base elle-même.
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION eleves_matricule_immuable() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.matricule IS DISTINCT FROM OLD.matricule THEN
          RAISE EXCEPTION 'RG4 : le matricule d''un élève est immuable';
        END IF;
        RETURN NEW;
      END $$
    `)
    this.schema.raw(`
      CREATE TRIGGER eleves_matricule_immuable BEFORE UPDATE ON eleves
      FOR EACH ROW EXECUTE FUNCTION eleves_matricule_immuable()
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP FUNCTION IF EXISTS eleves_matricule_immuable()')
    this.schema.raw('DROP TYPE IF EXISTS sexe_eleve')
    this.schema.raw('DROP TYPE IF EXISTS statut_eleve')
    this.schema.raw('DROP FUNCTION IF EXISTS sans_accent(text)')
  }
}

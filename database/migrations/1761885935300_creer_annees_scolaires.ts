import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Années scolaires. États : préparation → active → clôturée.
 * RG1 : une seule année active à la fois (index unique partiel).
 * RG2 : une année clôturée est en lecture seule définitive (appliqué par les
 * services ; l'état ne revient jamais en arrière).
 */
export default class extends BaseSchema {
  protected tableName = 'annees_scolaires'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('libelle', 20).notNullable()
      table.date('date_debut').notNullable()
      table.date('date_fin').notNullable()
      table
        .enum('decoupage', ['trimestres', 'semestres'], {
          useNative: true,
          enumName: 'decoupage_annee',
          existingType: false,
        })
        .notNullable()
      table
        .enum('etat', ['preparation', 'active', 'cloturee'], {
          useNative: true,
          enumName: 'etat_annee',
          existingType: false,
        })
        .notNullable()
        .defaultTo('preparation')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.check('date_fin > date_debut', [], 'annees_scolaires_dates')
    })

    this.schema.raw(
      `CREATE UNIQUE INDEX annees_scolaires_libelle ON annees_scolaires (libelle)
       WHERE deleted_at IS NULL`
    )
    // RG1 : au plus une année active.
    this.schema.raw(
      `CREATE UNIQUE INDEX annees_scolaires_une_active ON annees_scolaires ((etat))
       WHERE etat = 'active' AND deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS decoupage_annee')
    this.schema.raw('DROP TYPE IF EXISTS etat_annee')
  }
}

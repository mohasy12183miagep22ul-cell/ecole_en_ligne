import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Rôles d'un compte. Un seul compte par personne, les rôles se cumulent
 * (ex. enseignant + professeur principal).
 */
export default class extends BaseSchema {
  protected tableName = 'roles_utilisateurs'

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
      table
        .enum(
          'role',
          [
            'admin',
            'direction',
            'secretariat',
            'enseignant',
            'professeur_principal',
            'tuteur',
            'eleve',
          ],
          { useNative: true, enumName: 'role_utilisateur', existingType: false }
        )
        .notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
    })

    // Un rôle actif au plus une fois par compte ; un rôle retiré (supprimé
    // logiquement) peut être réattribué.
    this.schema.raw(
      `CREATE UNIQUE INDEX roles_utilisateurs_user_role_actif
       ON roles_utilisateurs (user_id, role) WHERE deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS role_utilisateur')
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Pièces du dossier d'inscription (§ 3, § 10) : type dans une liste fermée,
 * fichier PDF ou image de 5 Mo au plus, marqué fourni ou manquant. Le fichier
 * est rangé dans le stockage privé sous un nom généré ; seul le nom d'origine
 * est gardé pour l'affichage.
 */
export default class extends BaseSchema {
  protected tableName = 'documents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('inscription_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('inscriptions')
        .onDelete('RESTRICT')
      table
        .enum('type', ['acte_naissance', 'bulletin_precedent', 'certificat_transfert', 'photo'], {
          useNative: true,
          enumName: 'type_document',
          existingType: false,
        })
        .notNullable()
      table.string('fichier', 200).nullable()
      table.string('nom_origine', 200).nullable()
      table.string('mime', 80).nullable()
      table.integer('taille').nullable()
      table.boolean('fourni').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.check('taille IS NULL OR taille <= 5242880', [], 'documents_5_mo')
      table.check('NOT fourni OR fichier IS NOT NULL', [], 'documents_fourni_fichier')
    })
    this.schema.raw(
      `CREATE UNIQUE INDEX documents_unique ON documents (inscription_id, type)
       WHERE deleted_at IS NULL`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS type_document')
  }
}

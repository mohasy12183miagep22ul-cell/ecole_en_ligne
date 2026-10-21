import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export const ROLES = [
  'admin',
  'direction',
  'secretariat',
  'enseignant',
  'professeur_principal',
  'tuteur',
  'eleve',
] as const
export type Role = (typeof ROLES)[number]

export default class RoleUtilisateur extends BaseModel {
  static table = 'roles_utilisateurs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare role: Role

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}

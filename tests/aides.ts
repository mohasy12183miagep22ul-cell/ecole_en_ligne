import User from '#models/user'
import RoleUtilisateur, { type Role } from '#models/role_utilisateur'

export const MOT_DE_PASSE = 'MotDePasse2026'

let n = 0

/** Crée un compte de test avec ses rôles. */
export async function creerCompte(
  roles: Role[],
  options: Partial<
    Pick<User, 'doubleFacteur' | 'doitChangerMotDePasse' | 'actif' | 'email' | 'fullName'>
  > = {}
) {
  n++
  const user = await User.create({
    fullName: options.fullName ?? `Compte Test${n}`,
    email: options.email ?? `compte${n}-${Date.now()}@test.gn`,
    password: MOT_DE_PASSE,
    actif: options.actif ?? true,
    doubleFacteur: options.doubleFacteur ?? false,
    doitChangerMotDePasse: options.doitChangerMotDePasse ?? false,
    echecsConnexion: 0,
  })
  for (const role of roles) await RoleUtilisateur.create({ userId: user.id, role })
  return user
}

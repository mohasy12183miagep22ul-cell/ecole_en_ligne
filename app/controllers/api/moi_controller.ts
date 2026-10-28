import type User from '#models/user'
import AuthentificationService from '#services/authentification_service'
import { changerMotDePasseValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import type AnneeScolaire from '#models/annee_scolaire'

/** Compte connecté tel que l'application mobile le reçoit. */
export async function versUtilisateur(user: User) {
  await user.load('rolesUtilisateur')
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    initials: user.initials,
    sousTitre: user.sousTitre,
    roles: user.roles,
    espaces: user.espacesMobiles,
    doitChangerMotDePasse: user.doitChangerMotDePasse,
  }
}

export const versAnnee = (annee: AnneeScolaire | null) =>
  annee
    ? {
        id: annee.id,
        libelle: annee.libelle,
        dateDebut: annee.dateDebut.toISODate(),
        dateFin: annee.dateFin.toISODate(),
      }
    : null

/** API mobile · compte connecté. */
export default class MoiController {
  async show(ctx: HttpContext) {
    const user = ctx.auth.use('api').getUserOrFail()
    return {
      utilisateur: await versUtilisateur(user),
      anneeActive: versAnnee(ctx.anneeActive),
    }
  }

  /** Lève aussi le changement imposé à la première connexion. */
  async changerMotDePasse(ctx: HttpContext) {
    const { actuel, nouveau } = await ctx.request.validateUsing(changerMotDePasseValidator)
    const user = ctx.auth.use('api').getUserOrFail()
    const resultat = await AuthentificationService.changerMotDePasse(
      user,
      actuel,
      nouveau,
      ctx.request.ip()
    )
    if (!resultat.ok) {
      return ctx.response.unprocessableEntity({
        errors: [{ field: resultat.champ, message: resultat.message, rule: 'mot_de_passe' }],
      })
    }
    return { utilisateur: await versUtilisateur(user) }
  }
}

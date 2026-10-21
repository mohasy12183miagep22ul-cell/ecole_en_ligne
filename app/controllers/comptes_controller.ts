import User from '#models/user'
import CompteService from '#services/compte_service'
import CompteTransformer from '#transformers/compte_transformer'
import { gererComptes } from '#abilities/main'
import {
  activationCompteValidator,
  creerCompteValidator,
  rolesCompteValidator,
} from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class ComptesController {
  async index({ inertia, request, bouncer }: HttpContext) {
    await bouncer.authorize(gererComptes)
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const recherche = String(request.input('q', '')).trim().slice(0, 80)
    const resultat = await CompteService.lister(page, recherche || undefined)
    const meta = resultat.getMeta()

    return inertia.render('admin/comptes', {
      comptes: CompteTransformer.transform(resultat.all()),
      pagination: {
        page: meta.currentPage,
        dernierePage: meta.lastPage,
        total: meta.total,
      },
      recherche,
    })
  }

  async store({ request, response, session, auth, bouncer }: HttpContext) {
    await bouncer.authorize(gererComptes)
    const donnees = await request.validateUsing(creerCompteValidator)
    const { user, motDePasse } = await CompteService.creer(donnees, {
      id: auth.getUserOrFail().id,
      ip: request.ip(),
    })
    // Affiché une seule fois à l'administrateur, qui le transmet à la
    // personne ; il devra être changé à la première connexion.
    session.flash('compteCree', { email: user.email, motDePasse })
    return response.redirect().toRoute('admin.comptes')
  }

  async updateRoles({ params, request, response, session, auth, bouncer }: HttpContext) {
    await bouncer.authorize(gererComptes)
    const { roles } = await request.validateUsing(rolesCompteValidator)
    const user = await User.query().where('id', params.id).whereNull('deleted_at').firstOrFail()
    const resultat = await CompteService.changerRoles(user, roles, {
      id: auth.getUserOrFail().id,
      ip: request.ip(),
    })
    session.flash(
      resultat.ok ? 'success' : 'error',
      resultat.ok ? 'Rôles mis à jour' : resultat.message
    )
    return response.redirect().back()
  }

  async updateActivation({ params, request, response, session, auth, bouncer }: HttpContext) {
    await bouncer.authorize(gererComptes)
    const { actif } = await request.validateUsing(activationCompteValidator)
    const user = await User.query().where('id', params.id).whereNull('deleted_at').firstOrFail()
    const resultat = await CompteService.changerActivation(user, actif, {
      id: auth.getUserOrFail().id,
      ip: request.ip(),
    })
    if (!resultat.ok) session.flash('error', resultat.message)
    return response.redirect().back()
  }
}

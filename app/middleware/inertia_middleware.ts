import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import UserTransformer from '#transformers/user_transformer'
import EtablissementService from '#services/etablissement_service'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  async share(ctx: HttpContext) {
    /**
     * The share method is called everytime an Inertia page is rendered. In
     * certain cases, a page may get rendered before the session middleware
     * or the auth middleware are executed. For example: During a 404 request.
     *
     * In that case, we must always assume that HttpContext is not fully hydrated
     * with all the properties
     */
    const { auth } = ctx as Partial<HttpContext>

    if (auth?.user) await auth.user.load('rolesUtilisateur')

    /**
     * Données partagées avec toutes les pages. Toujours passer par un
     * transformer pour un modèle.
     */
    const parametres = await EtablissementService.parametres()
    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      user: ctx.inertia.always(auth?.user ? UserTransformer.transform(auth.user) : undefined),
      // Nom de l'établissement (en-têtes, écran de connexion).
      etablissement: ctx.inertia.always({ nom: parametres.nom }),
      // Année active, présente dans chaque page (null entre deux années).
      anneeActive: ctx.inertia.always(
        ctx.anneeActive ? { id: ctx.anneeActive.id, libelle: ctx.anneeActive.libelle } : null
      ),
    }
  }

  flash(ctx: HttpContext) {
    /**
     * Flash messages travel in the dedicated `flash` field of the page
     * object instead of props, and the client strips them from history
     * state so they never reappear when navigating back.
     */
    const { session } = ctx as Partial<HttpContext>

    const success: string | undefined = session?.flashMessages.get('success')
    const error: string | undefined = session?.flashMessages.get('error')
    // Mot de passe provisoire d'un compte qui vient d'être créé : affiché une
    // seule fois à l'administrateur.
    const compteCree: { email: string; motDePasse: string } | undefined =
      session?.flashMessages.get('compteCree')

    return { success, error, compteCree }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    const output = await next()
    this.dispose(ctx)

    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}

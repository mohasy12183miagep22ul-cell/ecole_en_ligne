/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Tant que les services métier n'existent pas, les écrans sont rendus sans
| données serveur : les pages lisent le jeu de démonstration du prototype
| (inertia/demo). Chaque espace est fermé aux autres rôles.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

import type { Role } from '#models/role_utilisateur'

/** Middlewares d'un espace : connecté, mot de passe à jour, rôle autorisé. */
const espace = (roles: Role[]) => [
  middleware.auth(),
  middleware.motDePasseImpose(),
  middleware.role(roles),
]

router
  .get('/', async ({ auth, response }) => {
    if (!(await auth.check())) return response.redirect().toRoute('session.create')
    const user = auth.getUserOrFail()
    await user.load('rolesUtilisateur')
    return response.redirect(user.accueil)
  })
  .as('home')

router
  .group(() => {
    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
    router
      .get('connexion/verification', [controllers.Session, 'createCode'])
      .as('double_facteur.create')
    router
      .post('connexion/verification', [controllers.Session, 'storeCode'])
      .as('double_facteur.store')
    router.get('mot-de-passe-oublie', [controllers.MotDePasseOublie, 'create'])
    router
      .post('connexion/verification/renvoyer', [controllers.Session, 'renvoyerCode'])
      .as('double_facteur.renvoyer')
    router.post('mot-de-passe-oublie', [controllers.MotDePasseOublie, 'store'])
    router
      .get('reinitialiser/:jeton', [controllers.MotDePasseOublie, 'edit'])
      .as('reinitialisation.edit')
    router
      .post('reinitialiser/:jeton', [controllers.MotDePasseOublie, 'update'])
      .as('reinitialisation.update')
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])
    router.get('profil', [controllers.Profil, 'show']).as('profil')
    router
      .post('profil/mot-de-passe', [controllers.Profil, 'changerMotDePasse'])
      .as('profil.mot_de_passe')
  })
  .use(middleware.auth())

router
  .group(() => {
    router.on('/').renderInertia('portail/accueil', {}).as('accueil')
    router.on('notes').renderInertia('portail/notes', {}).as('notes')
    router.on('bulletins').renderInertia('portail/bulletins', {}).as('bulletins')
    router
      .get('bulletins/:id', ({ inertia, params }) =>
        inertia.render('portail/bulletin', { id: String(params.id) })
      )
      .as('bulletin')
    router.on('dossier').renderInertia('portail/dossier', {}).as('dossier')
  })
  .prefix('portail')
  .as('portail')
  .use(espace(['tuteur', 'eleve']))

router
  .group(() => {
    router.on('classes').renderInertia('enseignant/classes', {}).as('classes')
    router.on('evaluations').renderInertia('enseignant/evaluations', {}).as('evaluations')
    router
      .on('evaluations/nouvelle')
      .renderInertia('enseignant/nouvelle_evaluation', {})
      .as('nouvelle_evaluation')
    router
      .get('evaluations/:id', ({ inertia, params }) =>
        inertia.render('enseignant/grille', { id: String(params.id) })
      )
      .as('grille')
    router.on('appreciations').renderInertia('enseignant/appreciations', {}).as('appreciations')
    router.on('recapitulatif').renderInertia('enseignant/recapitulatif', {}).as('recapitulatif')
  })
  .prefix('enseignant')
  .as('enseignant')
  .use(espace(['enseignant', 'professeur_principal']))

router
  .group(() => {
    router.on('/').renderInertia('direction/accueil', {}).as('accueil')
    router.on('validation').renderInertia('direction/validation', {}).as('validation')
    router.on('deliberation').renderInertia('direction/deliberation', {}).as('deliberation')
    router.on('bulletins').renderInertia('direction/bulletins', {}).as('bulletins')
  })
  .prefix('direction')
  .as('direction')
  .use(espace(['direction']))

router
  .group(() => {
    router.on('eleves').renderInertia('scolarite/eleves', {}).as('eleves')
    router
      .get('eleves/:id', ({ inertia, params, request }) =>
        inertia.render('scolarite/fiche', {
          id: String(params.id),
          onglet: String(request.qs().onglet ?? 'id'),
        })
      )
      .as('fiche')
    router.on('inscription').renderInertia('scolarite/inscription', {}).as('inscription')
    router.on('dossiers').renderInertia('scolarite/dossiers', {}).as('dossiers')
  })
  .prefix('scolarite')
  .as('scolarite')
  .use(espace(['secretariat']))

router
  .group(() => {
    router.get('/', [controllers.AdminAccueil, 'index']).as('accueil')

    router.get('annees', [controllers.Annees, 'index']).as('annees')
    router.post('annees', [controllers.Annees, 'store']).as('annees.store')
    router.post('annees/:id/activer', [controllers.Annees, 'activer']).as('annees.activer')
    router.post('annees/:id/cloturer', [controllers.Annees, 'cloturer']).as('annees.cloturer')
    router.post('annees/:id/dupliquer', [controllers.Annees, 'dupliquer']).as('annees.dupliquer')
    router.put('periodes/:id', [controllers.Annees, 'updatePeriode']).as('periodes.update')

    router.get('structure', [controllers.Structure, 'index']).as('structure')
    router.post('niveaux', [controllers.Structure, 'storeNiveau']).as('niveaux.store')
    router.post('matieres', [controllers.Structure, 'storeMatiere']).as('matieres.store')
    router.put('coefficients', [controllers.Structure, 'updateCoefficient']).as('coefficients')

    router.get('classes', [controllers.Classes, 'index']).as('classes')
    router.post('annees/:anneeId/classes', [controllers.Classes, 'store']).as('classes.store')
    router.put('classes/:id', [controllers.Classes, 'update']).as('classes.update')

    router.get('affectations', [controllers.Affectations, 'index']).as('affectations')
    router
      .post('annees/:anneeId/affectations', [controllers.Affectations, 'store'])
      .as('affectations.store')
    router
      .delete('affectations/:id', [controllers.Affectations, 'destroy'])
      .as('affectations.destroy')
    router.get('comptes', [controllers.Comptes, 'index']).as('comptes')
    router.post('comptes', [controllers.Comptes, 'store']).as('comptes.store')
    router.put('comptes/:id/roles', [controllers.Comptes, 'updateRoles']).as('comptes.roles')
    router
      .put('comptes/:id/activation', [controllers.Comptes, 'updateActivation'])
      .as('comptes.activation')
  })
  .prefix('admin')
  .as('admin')
  .use(espace(['admin']))

router
  .get('admin/journal', [controllers.Journal, 'index'])
  .as('admin.journal')
  .use(espace(['admin', 'direction']))

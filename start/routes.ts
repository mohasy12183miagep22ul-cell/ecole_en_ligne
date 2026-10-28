/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Les lots livrés (comptes, structure, scolarité) passent par leurs
| contrôleurs ; les écrans des lots suivants (notes, délibération, bulletins,
| portail) lisent encore le jeu de démonstration du prototype (inertia/demo).
| Chaque espace est fermé aux autres rôles ; la policy de chaque ressource
| autorise ensuite l'action.
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
    const user = auth.use('web').getUserOrFail()
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
    router.get('classes', [controllers.Evaluations, 'classes']).as('classes')
    router.get('evaluations', [controllers.Evaluations, 'index']).as('evaluations')
    router
      .get('evaluations/nouvelle', [controllers.Evaluations, 'create'])
      .as('nouvelle_evaluation')
    router.post('evaluations', [controllers.Evaluations, 'store']).as('evaluations.store')
    router.get('evaluations/:id', [controllers.Evaluations, 'show']).as('grille')
    router.put('evaluations/:id', [controllers.Evaluations, 'update']).as('evaluations.update')
    router.post('evaluations/:id/notes', [controllers.Evaluations, 'notes']).as('evaluations.notes')
    router
      .post('evaluations/:id/soumettre', [controllers.Evaluations, 'soumettre'])
      .as('evaluations.soumettre')
    router.get('appreciations', [controllers.Appreciations, 'index']).as('appreciations')
    router.post('appreciations', [controllers.Appreciations, 'store']).as('appreciations.store')
    router.get('recapitulatif', [controllers.Appreciations, 'recapitulatif']).as('recapitulatif')
  })
  .prefix('enseignant')
  .as('enseignant')
  .use(espace(['enseignant', 'professeur_principal']))

router
  .group(() => {
    router.on('/').renderInertia('direction/accueil', {}).as('accueil')
    router.get('validation', [controllers.ValidationEvaluations, 'index']).as('validation')
    router
      .post('evaluations/:id/valider', [controllers.ValidationEvaluations, 'valider'])
      .as('evaluations.valider')
    router
      .post('evaluations/:id/renvoyer', [controllers.ValidationEvaluations, 'renvoyer'])
      .as('evaluations.renvoyer')
    router
      .post('evaluations/:id/deverrouiller', [controllers.ValidationEvaluations, 'deverrouiller'])
      .as('evaluations.deverrouiller')
    router.get('suivi', [controllers.ValidationEvaluations, 'suivi']).as('suivi')
    router
      .post('derogations', [controllers.ValidationEvaluations, 'derogation'])
      .as('derogations.store')
    router.on('deliberation').renderInertia('direction/deliberation', {}).as('deliberation')
    router.on('bulletins').renderInertia('direction/bulletins', {}).as('bulletins')
    router.get('inscriptions', [controllers.ValidationInscriptions, 'index']).as('inscriptions')
    router
      .post('inscriptions/:id/valider', [controllers.ValidationInscriptions, 'valider'])
      .as('inscriptions.valider')
    router
      .post('inscriptions/:id/refuser', [controllers.ValidationInscriptions, 'refuser'])
      .as('inscriptions.refuser')
  })
  .prefix('direction')
  .as('direction')
  .use(espace(['direction']))

router
  .group(() => {
    router.get('eleves', [controllers.Eleves, 'index']).as('eleves')
    router.get('eleves/:id', [controllers.Eleves, 'show']).as('fiche')
    router.put('eleves/:id', [controllers.Eleves, 'update']).as('eleves.update')
    router.post('eleves/:id/statut', [controllers.Eleves, 'statut']).as('eleves.statut')
    router.post('eleves/:id/reactiver', [controllers.Eleves, 'reactiver']).as('eleves.reactiver')
    router.get('eleves/:id/photo', [controllers.Eleves, 'photo']).as('eleves.photo')

    router.post('eleves/:id/tuteurs', [controllers.Tuteurs, 'store']).as('tuteurs.store')
    router
      .post('eleves/:id/tuteurs/:tuteurId/rattacher', [controllers.Tuteurs, 'rattacher'])
      .as('tuteurs.rattacher')
    router.put('eleves/:id/tuteurs/:tuteurId', [controllers.Tuteurs, 'update']).as('tuteurs.update')
    router
      .put('eleves/:id/tuteurs/:tuteurId/principal', [controllers.Tuteurs, 'principal'])
      .as('tuteurs.principal')
    router
      .delete('eleves/:id/tuteurs/:tuteurId', [controllers.Tuteurs, 'detacher'])
      .as('tuteurs.detacher')
    router
      .post('eleves/:id/tuteurs/:tuteurId/acces', [controllers.Tuteurs, 'acces'])
      .as('tuteurs.acces')

    router.get('inscription', [controllers.Inscriptions, 'create']).as('inscription')
    router.post('inscriptions', [controllers.Inscriptions, 'store']).as('inscriptions.store')
    router
      .get('inscriptions/:id/fiche', [controllers.Inscriptions, 'fiche'])
      .as('inscriptions.fiche')
    router
      .post('inscriptions/:id/soumettre', [controllers.Inscriptions, 'soumettre'])
      .as('inscriptions.soumettre')
    router
      .post('inscriptions/:id/annuler', [controllers.Inscriptions, 'annuler'])
      .as('inscriptions.annuler')
    router
      .post('inscriptions/:id/pieces/:type', [controllers.Inscriptions, 'deposerPiece'])
      .as('inscriptions.piece')
    router
      .post('inscriptions/changer-classe', [controllers.Inscriptions, 'changerClasse'])
      .as('inscriptions.changer_classe')
    router.get('pieces/:id', [controllers.Inscriptions, 'lirePiece']).as('pieces.lire')
    router.get('dossiers', [controllers.Inscriptions, 'dossiers']).as('dossiers')

    router.get('import', [controllers.Imports, 'index']).as('import')
    router.get('import/modele', [controllers.Imports, 'modele']).as('import.modele')
    router.post('import', [controllers.Imports, 'analyser']).as('import.analyser')
    router.post('import/:id/accepter', [controllers.Imports, 'accepter']).as('import.accepter')
    router
      .post('import/:id/abandonner', [controllers.Imports, 'abandonner'])
      .as('import.abandonner')

    router.post('documents', [controllers.DocumentsGeneres, 'store']).as('documents.demander')
  })
  .prefix('scolarite')
  .as('scolarite')
  .use(espace(['secretariat', 'direction']))

router
  .group(() => {
    router.get('/', [controllers.DocumentsGeneres, 'index']).as('index')
    router.get(':id', [controllers.DocumentsGeneres, 'telecharger']).as('telecharger')
  })
  .prefix('documents')
  .as('documents')
  .use(espace(['secretariat', 'direction', 'admin']))

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
    router
      .put('programme/obligatoire', [controllers.Structure, 'updateObligatoire'])
      .as('programme.obligatoire')
    router.get('etablissement', [controllers.Etablissement, 'edit']).as('etablissement')
    router.put('etablissement', [controllers.Etablissement, 'update']).as('etablissement.update')

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

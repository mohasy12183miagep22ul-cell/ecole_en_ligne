/*
|--------------------------------------------------------------------------
| Routes de l'API mobile (/api/v1)
|--------------------------------------------------------------------------
|
| Réponses JSON uniquement, authentification par jeton (en-tête
| `Authorization: Bearer …`, garde `api`). Mêmes services, mêmes policies et
| mêmes règles de gestion que le web : seule la forme de la réponse change.
| Référence : docs/api-mobile.md.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const Auth = () => import('#controllers/api/auth_controller')
const Moi = () => import('#controllers/api/moi_controller')
const Enseignant = () => import('#controllers/api/enseignant_controller')
const Appreciations = () => import('#controllers/api/appreciations_controller')
const Direction = () => import('#controllers/api/direction_controller')
const Portail = () => import('#controllers/api/portail_controller')
const Sante = () => import('#controllers/api/sante_controller')
const Admin = () => import('#controllers/api/admin_controller')
const DocumentsGeneres = () => import('#controllers/documents_generes_controller')

router
  .group(() => {
    // Sans jeton. `health` : alias du nom usuel des outils de supervision.
    router.get('sante', [Sante, 'show']).as('sante')
    router.get('health', [Sante, 'show']).as('health')

    router
      .group(() => {
        router.post('connexion', [Auth, 'connexion']).as('connexion')
        router.post('verification', [Auth, 'verification']).as('verification')
        router.post('verification/renvoyer', [Auth, 'renvoyer']).as('verification.renvoyer')
        router.post('mot-de-passe-oublie', [Auth, 'motDePasseOublie']).as('mot_de_passe_oublie')
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.post('auth/deconnexion', [Auth, 'deconnexion']).as('auth.deconnexion')
        router.get('moi', [Moi, 'show']).as('moi')
        router.put('moi/mot-de-passe', [Moi, 'changerMotDePasse']).as('moi.mot_de_passe')
      })
      .use(middleware.api({ motDePasseLibre: true }))

    router
      .group(() => {
        router.get('affectations', [Enseignant, 'affectations']).as('affectations')
        router.get('affectations/:id/periodes', [Enseignant, 'periodes']).as('periodes')
        router.get('types-evaluation', [Enseignant, 'types']).as('types')
        router.get('evaluations', [Enseignant, 'index']).as('evaluations')
        router.post('evaluations', [Enseignant, 'store']).as('evaluations.store')
        router.get('evaluations/:id', [Enseignant, 'show']).as('evaluations.show')
        router.put('evaluations/:id', [Enseignant, 'update']).as('evaluations.update')
        router.post('evaluations/:id/notes', [Enseignant, 'notes']).as('evaluations.notes')
        router
          .post('evaluations/:id/soumettre', [Enseignant, 'soumettre'])
          .as('evaluations.soumettre')
        router.get('appreciations', [Appreciations, 'index']).as('appreciations')
        router.put('appreciations', [Appreciations, 'store']).as('appreciations.store')
        router.get('recapitulatif', [Appreciations, 'recapitulatif']).as('recapitulatif')
      })
      .prefix('enseignant')
      .as('enseignant')
      .where('id', router.matchers.number())
      .use(middleware.api({ roles: ['enseignant', 'professeur_principal'] }))

    router
      .group(() => {
        router.get('evaluations', [Direction, 'evaluations']).as('evaluations')
        router.get('evaluations/:id', [Direction, 'evaluation']).as('evaluations.show')
        router.post('evaluations/:id/valider', [Direction, 'valider']).as('evaluations.valider')
        router.post('evaluations/:id/renvoyer', [Direction, 'renvoyer']).as('evaluations.renvoyer')
        router
          .post('evaluations/:id/deverrouiller', [Direction, 'deverrouiller'])
          .as('evaluations.deverrouiller')
        router.get('suivi', [Direction, 'suivi']).as('suivi')
        router.post('derogations', [Direction, 'derogation']).as('derogations.store')
        router.get('inscriptions', [Direction, 'inscriptions']).as('inscriptions')
        router
          .post('inscriptions/:id/valider', [Direction, 'validerInscription'])
          .as('inscriptions.valider')
        router
          .post('inscriptions/:id/refuser', [Direction, 'refuserInscription'])
          .as('inscriptions.refuser')
      })
      .prefix('direction')
      .as('direction')
      .where('id', router.matchers.number())
      .use(middleware.api({ roles: ['direction'] }))

    // Administrateur : consultation seule ; le paramétrage et les comptes
    // se modifient sur le web.
    router
      .group(() => {
        router.get('accueil', [Admin, 'accueil']).as('accueil')
        router.get('annees', [Admin, 'annees']).as('annees')
        router.get('structure', [Admin, 'structure']).as('structure')
        router.get('etablissement', [Admin, 'etablissement']).as('etablissement')
        router.get('classes', [Admin, 'classes']).as('classes')
        router.get('affectations', [Admin, 'affectations']).as('affectations')
        router.get('comptes', [Admin, 'comptes']).as('comptes')
      })
      .prefix('admin')
      .as('admin')
      .use(middleware.api({ roles: ['admin'] }))

    router
      .get('admin/journal', [Admin, 'journal'])
      .as('admin.journal')
      .use(middleware.api({ roles: ['admin', 'direction'] }))

    // Le téléchargement reprend l'action web : policy (auteur seul), fichier
    // servi depuis le stockage, jamais par une URL publique.
    router
      .group(() => {
        router.get('/', [Admin, 'documents']).as('index')
        router.get(':id', [DocumentsGeneres, 'telecharger']).as('telecharger')
      })
      .prefix('documents')
      .as('documents')
      .where('id', router.matchers.number())
      .use(middleware.api({ roles: ['secretariat', 'direction', 'admin'] }))

    router
      .group(() => {
        router.get('enfants', [Portail, 'enfants']).as('enfants')
        router.get('enfants/:id', [Portail, 'enfant']).as('enfant')
      })
      .prefix('portail')
      .as('portail')
      .use(middleware.api({ roles: ['tuteur'] }))
  })
  .prefix('api/v1')
  .as('api')
  .use(middleware.forceJson())

// Toute autre adresse sous /api reçoit un 404 JSON, jamais la page HTML.
router
  .any('api/*', ({ response }) =>
    response.notFound({ code: 'E_ROUTE_INTROUVABLE', message: 'Point d’accès inconnu.' })
  )
  .as('api.introuvable')

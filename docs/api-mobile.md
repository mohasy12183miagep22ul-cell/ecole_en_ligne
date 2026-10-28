# API mobile — côté serveur

API JSON consommée par l'application React Native (projet `ecole-en-ligne-rn`). La référence
complète des points d'accès, des réponses et des erreurs est dans ce projet-là :
`ecole-en-ligne-rn/docs/api.md`. Ce fichier ne décrit que l'implémentation côté serveur.

## Où est le code

| Élément | Fichier |
| --- | --- |
| Routes `/api/v1` | `start/routes_api.ts` (préchargé dans `adonisrc.ts`) |
| Santé (`GET /api/v1/sante`, alias `health`) : API et base joignables, sans jeton | `app/controllers/api/sante_controller.ts` |
| Contrôleurs | `app/controllers/api/` |
| Barrière (jeton, compte actif, mot de passe imposé, rôle) | `app/middleware/api_middleware.ts` |
| Réponses toujours en JSON | `app/middleware/force_json_middleware.ts` |
| Garde `api` (jetons d'accès) | `config/auth.ts`, `User.accessTokens` |
| Émission et révocation des jetons | `app/services/jeton_service.ts` |
| Second facteur sans session (défis) | `app/services/code_verification_service.ts`, table `defis_connexion` |
| Portail famille (RG20, identifiants opaques) | `app/services/portail_service.ts`, `ElevePolicy.consulterFamille` |
| Tests | `tests/functional/api_mobile.spec.ts` |

## Choix

- **Mêmes services, mêmes policies que le web.** Les contrôleurs API ne font que valider,
  autoriser, appeler le service et mettre en forme (dates ISO, pas de format d'affichage). Le suivi
  des saisies est passé dans `EvaluationService.suiviSaisies`, partagé par les deux contrôleurs.
- **Jetons d'accès opaques** (`eel_…`), dont seule l'empreinte est stockée, valables 30 jours. Une
  révocation (déconnexion, compte désactivé) ramène `expires_at` à l'instant présent au lieu de
  supprimer la ligne (RG21).
- **CSRF** : `/api/*` est exclu de la vérification (`config/shield.ts`), car l'API n'accepte que le
  garde `api`. Un cookie de session ne vaut rien sous `/api`.
- **Second facteur** : sans session côté mobile, le code en attente est porté par un défi (UUID).
  Seule l'empreinte du code est stockée : 10 minutes, 5 essais, usage unique, comme sur le web.
- **Portail** : les élèves sont désignés par un identifiant chiffré (`encryption`, but
  `portail_eleve`), jamais par leur identifiant séquentiel. Non rattaché ou identifiant forgé :
  même 404. Aucune note ni aucun bulletin n'est exposé avant le lot des bulletins (RG18).
- Le code web lit désormais explicitement le garde `web` (`auth.use('web')`), car `ctx.auth.user`
  peut aussi désigner un compte authentifié par jeton.

## À trancher

- Durée des jetons : 30 jours, fixe. La session web dure 8 h avec prolongation sur activité. Faut-il
  une expiration glissante, ou plus courte pour les comptes direction ?
- Pas de limitation de débit sur `/api/v1/auth/*` en dehors du verrouillage par compte (5 échecs).
- CORS : seule une version web de l'application (Expo web) en aurait besoin. Les applications
  natives n'envoient pas d'en-tête `Origin`.

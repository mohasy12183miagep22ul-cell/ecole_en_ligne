---
name: "ecole-en-ligne-adonis"
description: "Utiliser pour implémenter ou relire le code serveur d'École en ligne en AdonisJS 7 + Inertia React + PostgreSQL : découpage contrôleurs/services, validateurs VineJS, policies Bouncer, migrations Lucid, transactions, sécurité et tests Japa."
---
 
# École en ligne — serveur AdonisJS
 
Couche serveur de l'application de gestion scolaire. Les règles métier elles-mêmes sont dans la
skill `ecole-en-ligne-business-rules` : ici, c'est **où** et **comment** on les écrit.
 
## Stack et mise en route
 
```bash
npm create adonisjs@latest ecole-en-ligne -- --kit=react
```
 
AdonisJS 7, TypeScript, Node.js 24+, React 19 + Inertia.js, Lucid, VineJS, Bouncer, Japa, Vite.
Le kit arrive avec SQLite : **basculer sur PostgreSQL 16+ immédiatement**, y compris en
développement. Un bug de contrainte ou de type ne doit jamais apparaître pour la première fois en
production.
 
## Découpage du code
 
```
app/
  controllers/   fins : valider, autoriser, appeler un service, répondre
  services/      toute la règle de gestion, testable sans HTTP
  models/        modèles Lucid, relations, scopes
  validators/    schémas VineJS, un par action
  policies/      Bouncer, un fichier par ressource
  middleware/    auth, role, annee_active
  exceptions/    gestion centralisée
database/
  migrations/    une migration par changement, jamais modifiée après production
  seeders/       jeu de démo : 1 année, 3 niveaux, 6 classes, 200 élèves
inertia/pages/   une page par écran, groupée par module
```
 
Services attendus : `InscriptionService`, `EleveService`, `StructureService`, `EvaluationService`,
`NoteService`, `MoyenneService`, `DeliberationService`, `BulletinService`, `JournalService`.
 
## Les sept règles d'architecture
 
1. **Un contrôleur ne calcule rien.** Il valide (VineJS), autorise (Bouncer), appelle un service,
   renvoie `inertia.render`. Si une méthode de contrôleur dépasse une vingtaine de lignes ou
   contient un `if` métier, la logique est au mauvais endroit.
2. **`MoyenneService` est pur et unique.** L'écran enseignant, l'écran de délibération et le PDF
   passent par la même fonction. Deux implémentations de la moyenne = un bulletin qui contredit un
   écran, tôt ou tard.
3. **Une transaction par opération métier** (`db.transaction`) : valider une inscription, publier
   une classe, générer des bulletins. Tout ou rien, le journal inclus.
4. **L'année active vient d'un middleware**, jamais d'un paramètre de requête fourni par le client.
   Aucune requête métier ne s'écrit sans filtre d'année (RG1).
5. **Les traitements lourds vont en file d'attente** : génération de masse, exports, PDF. Une
   requête web ne tient jamais 60 secondes.
6. **Aucune moyenne ni rang en colonne de référence** (RG14). Un cache daté est autorisé, avec sa
   date de calcul, et il est invalidé par le service qui touche aux notes.
7. **Les PDF publiés sont des fichiers figés**, stockés et servis depuis le stockage — jamais
   recalculés à la consultation (RG19).
## Sécurité — niveau système RH
 
Ce sont des données personnelles de mineurs. Aucune de ces lignes n'est optionnelle.
 
### Autorisation
 
- Contrôle **à deux niveaux, toujours côté serveur** : le middleware de rôle ouvre l'écran, la
  policy Bouncer autorise la ressource. Les contrôles côté React sont du confort d'affichage.
- Toute action portant un identifiant d'URL passe par `bouncer.authorize` avec l'objet chargé, pas
  avec l'identifiant brut. Un enseignant qui change l'id de classe dans l'URL reçoit un 403.
- `EvaluationPolicy` part de l'affectation (enseignant + classe + matière + année active), jamais
  de la classe (RG9). `BulletinPolicy` vérifie la publication avant toute lecture par un tuteur
  (RG18). `ElevePolicy` vérifie le rattachement tuteur (RG20).
- Écrire aussi les tests **de refus** : pour chaque policy, un test par rôle non autorisé.
### Entrées et requêtes
 
- Toute entrée passe par un validateur VineJS. Jamais de `request.all()` passé tel quel à un modèle,
  jamais de `fill` sur un payload non validé (risque d'affectation de masse sur `role` ou `statut`).
- Jamais de SQL concaténé. Lucid, ou `db.rawQuery` avec bindings `?`.
- Les identifiants exposés sont des UUID ou des identifiants opaques, pas des entiers séquentiels
  devinables sur les routes famille.
### Authentification et session
 
- Mot de passe haché en scrypt (le hacheur par défaut d'AdonisJS), 10 caractères minimum,
  changement imposé à la première connexion d'un compte créé par l'administrateur.
- Verrouillage temporaire après 5 échecs consécutifs sur un même compte, avec journalisation.
- Session par cookie signé `httpOnly` + `secure`, 8 h avec prolongation sur activité.
- Protection CSRF active sur toutes les routes mutantes (`shield`), et vérifiée en test.
- Second facteur par code courriel pour les comptes direction et administrateur.
### Fichiers
 
- Pièces jointes servies par une route **authentifiée et autorisée**, jamais par une URL publique
  devinable. Nom de fichier généré côté serveur, extension et type MIME vérifiés, 5 Mo maximum,
  stockage hors de l'arborescence publique.
### Configuration et secrets
 
- Aucun secret dans le dépôt. Tout passe par `env.ts` avec un schéma validé au démarrage : une
  variable manquante doit faire échouer le boot, pas produire un comportement silencieux.
- Environnements de production et de test strictement séparés, données de test anonymisées.
- HTTPS obligatoire, en-têtes de sécurité via `shield`.
### Journal
 
`JournalService` est appelé dans la même transaction que l'écriture qu'il trace (RG22) : création
et modification de note, validation, déverrouillage, publication, changement de rôle, connexion
échouée. Auteur, date, IP, valeurs avant et après. Aucune route d'écriture ou de suppression sur le
journal, quel que soit le rôle.
 
## Base de données
 
- Contraintes **en base**, pas seulement en code : unicité, bornes de note, clés étrangères en
  restriction (jamais `cascade`), `not null` partout où c'est vrai.
- `created_at`, `updated_at`, `deleted_at` sur toutes les tables ; suppression logique (RG21).
- Index dès la première migration : `notes (evaluation_id, eleve_id)`,
  `inscriptions (annee_id, classe_id)`, `evaluations (affectation_id, periode_id)`,
  `eleves (matricule)`, index trigramme (`pg_trgm`) sur `nom` et `prenoms`.
- Une migration jamais modifiée après son passage en production : on en écrit une nouvelle.
- Attention au N+1 sur les écrans de classe : `preload` explicite, et une requête d'agrégat pour
  les moyennes de classe plutôt qu'une boucle sur les élèves.
## Tests Japa
 
- Un test fonctionnel par règle de gestion (RG1 à RG22), nommé avec le numéro de la règle.
- Un test d'autorisation **en refus** par rôle et par policy.
- Les cas pièges à couvrir explicitement : absent contre 0 (RG11), égalité de rang (RG16), arrondi
  à l'affichage seulement (RG15), bulletin non publié invisible (RG18), réinscription d'un élève
  sorti (RG8), capacité de classe atteinte (RG7).
- Les mesures de performance se font sur le jeu de volumétrie (3 000 élèves, 400 000 notes), pas
  sur le seeder de démonstration.
## Performance visée
 
Écran de liste sous 1 s, grille de saisie complète sous 2 s, génération d'une classe de 60 élèves
sous 60 s en tâche de fond, 200 utilisateurs simultanés. Listes paginées côté serveur, jamais
chargées en entier — la connexion de l'établissement peut être lente.
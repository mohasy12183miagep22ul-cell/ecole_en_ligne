# École en ligne — Instructions projet

Application de gestion scolaire : inscriptions, élèves, matières, évaluations, notes, bulletins.
Référence fonctionnelle : le cahier des charges (14 sections, règles RG1 à RG22).
Référence visuelle : le prototype `Ecole en ligne.dc.html`.

## Langue

Tout est en français : interface, libellés, messages d'erreur, commentaires, noms de migrations,
messages de commit. Le code (variables, classes, routes, tables) est en français aussi — `eleves`,
`inscriptions`, `evaluations`, `bulletins` — pour qu'il n'y ait jamais de traduction mentale entre
le cahier des charges et le code. Pas d'accent ni d'espace dans les identifiants.

## Stack

| Couche | Choix | Notes |
| --- | --- | --- |
| Serveur | AdonisJS 7, TypeScript, Node.js 24+ | `npm create adonisjs@latest -- --kit=react` |
| Front | React 19 + Inertia.js | Rendu serveur, pas d'API REST publique en lot 1 |
| ORM | Lucid | Migrations, modèles, transactions |
| Base | PostgreSQL 16+ | Jamais SQLite, même en dev |
| Style | Tailwind CSS | Jetons centralisés dans `tailwind.config` |
| Icônes | Font Awesome 6 via `@fortawesome/react-fontawesome` | Import icône par icône |
| Validation | VineJS | Un validateur par action, côté serveur |
| Droits | Bouncer | Une policy par ressource |
| Tests | Japa | Chaque RG couverte par un test |

## Architecture — les règles non négociables

1. **Les contrôleurs ne calculent rien.** Ils valident (VineJS), autorisent (Bouncer), appellent un
   service, renvoient une réponse Inertia. Toute règle de gestion vit dans `app/services/`.
2. **Un service par domaine** : `InscriptionService`, `NoteService`, `MoyenneService`,
   `BulletinService`, `DeliberationService`. Testables sans HTTP.
3. **Le calcul des moyennes est un service pur, appelé partout.** L'écran enseignant, l'écran de
   délibération et le bulletin PDF passent par le même code : un bulletin ne peut jamais contredire
   un écran.
4. **Une transaction par opération métier.** Valider une inscription, publier une classe, générer
   des bulletins : tout ou rien (`db.transaction`).
5. **L'année scolaire active est injectée par un middleware** et présente dans chaque requête.
   Aucune requête métier ne s'écrit sans filtre d'année.
6. **Les traitements lourds vont en file d'attente** : génération de masse, exports, PDF.
7. **Aucune moyenne, aucun rang n'est une donnée de référence.** Ils se recalculent depuis les
   notes ; seul un cache daté est autorisé.

```
app/
  controllers/   fins, sans logique métier
  services/      toute la règle de gestion
  models/        modèles Lucid
  validators/    schémas VineJS
  policies/      Bouncer, un fichier par ressource
  middleware/    auth, role, annee_active
database/migrations/   une migration par changement, jamais modifiée après production
inertia/pages/         une page par écran, groupée par module
```

## Sécurité — à appliquer sans exception

Les données sont des données personnelles de mineurs. Niveau d'exigence : système RH.

- **Autorisation côté serveur, systématiquement.** Le rôle ouvre l'écran, la policy Bouncer autorise
  la ressource. Les contrôles côté React sont du confort d'affichage, jamais une barrière. Tout
  identifiant manipulé dans une URL doit se heurter à un refus serveur.
- **Un enseignant ne voit que ses affectations** (classe + matière + année en cours). Tout `query`
  sur les notes part de l'affectation, jamais de la classe seule.
- **Un tuteur n'accède qu'aux élèves qui lui sont rattachés**, en lecture seule.
- **Jamais de secret ni de clé dans le dépôt.** Tout passe par `env.ts` avec un schéma validé.
- **Pas de requête SQL concaténée.** Lucid ou `?` bindings, toujours.
- **Les pièces jointes sont servies par une route authentifiée**, jamais par une URL publique
  devinable ; nom de fichier généré, type MIME vérifié, 5 Mo maximum.
- **Mot de passe** : haché en scrypt, 10 caractères minimum, verrouillage temporaire après 5 échecs,
  changement imposé à la première connexion d'un compte créé par l'administrateur.
- **Session** : cookie signé `httpOnly` + `secure`, 8 h avec prolongation sur activité, protection
  CSRF active sur toutes les routes mutantes.
- **Journalisation obligatoire** (RG22) : création et modification de note, validation,
  déverrouillage, publication, changement de rôle, connexion échouée — avec auteur, date, IP,
  valeurs avant et après. Le journal n'est jamais effaçable depuis l'application.
- **Suppression logique partout** (RG21) : `deleted_at`, jamais de `DELETE`.
- **Clés étrangères en restriction**, jamais en cascade.

## Règles de gestion

Les 22 règles RG1 à RG22 du cahier des charges font foi. Les plus structurantes :

- Une seule année active (RG1) ; une année clôturée est en lecture seule définitive (RG2).
- Le coefficient appartient au couple niveau + matière, jamais à la matière seule (RG3).
- Matricule unique et immuable, format `AAAA-NNNNN` (RG4).
- Une seule inscription validée par élève et par année (RG5).
- Un enseignant ne saisit que sur ses affectations de l'année active (RG9).
- Un élève absent sort du numérateur **et** du dénominateur ; un 0 saisi compte (RG11).
- Une évaluation validée n'est plus modifiable par l'enseignant ; seul le chef d'établissement
  déverrouille, et l'action est journalisée (RG12).
- Arrondi à deux décimales à l'affichage uniquement, jamais dans un calcul intermédiaire (RG15).
- Rang calculé sur la moyenne non arrondie ; égalité → même rang, rang suivant sauté (RG16).
- **Un bulletin n'est visible par la famille qu'après publication par la direction (RG18).**
- Un bulletin publié est immuable ; une correction donne un rectificatif numéroté (RG19).

En cas de doute entre une demande ponctuelle et une RG, la RG l'emporte : il faut la faire évoluer
explicitement, pas la contourner dans un coin du code.

## Interface

Trois environnements, un seul projet : administration, espace enseignant, portail famille.

Jetons issus du prototype, à placer dans `tailwind.config` et nulle part ailleurs :

- Accent `#7424E0`, accent doux `#F3ECFD`
- Texte `#1B1726` / `#3B3747` / `#5E5A6B` / `#77738A`
- Fonds `#F6F5FA` (page), `#FFFFFF` (carte), `#F7F6FA` (champ), `#F8F7FB` (en-tête de tableau)
- Bordures `#ECEAF2` (carte), `#E6E3EE` (champ), `#F1F0F5` (séparateur de ligne)
- États : succès `#14663F` sur `#E2F4EA` · attention `#7A4A00` sur `#FFF3DD` ·
  erreur `#A3214F` sur `#FCE8EF` · information `#2448B5` sur `#EAF0FD`
- Police Plus Jakarta Sans ; tailles 11 / 12 / 13 / 14 / 15 / 17 / 20 / 26 px
- Rayons 10 / 12 / 16 px, pastilles `999px`

Règles d'interface :

- **Mobile first pour le portail famille**, poste de bureau pour l'administration. Barre latérale de
  248 px au-dessus de 1024 px, barre d'onglets basse en dessous.
- **La grille de saisie des notes est l'écran critique** : clavier seul (Entrée ou ↓ pour descendre),
  enregistrement automatique, barre de synthèse collante en bas, tolérance à la coupure réseau.
- **Icônes Font Awesome importées une par une**, jamais le pack complet.
- Contraste minimum 4.5:1, libellés liés aux champs, erreurs rattachées au champ concerné.

## Performance

3 000 élèves, 400 000 notes par an, connexion lente côté établissement.

- Listes paginées côté serveur, jamais chargées en entier.
- Pages utiles sous 300 Ko hors images.
- Grille de saisie complète sous 2 s, écran de liste sous 1 s.
- Bulletins PDF servis depuis le stockage, jamais recalculés à l'affichage.
- Index dès la première migration : `notes (evaluation_id, eleve_id)`,
  `inscriptions (annee_id, classe_id)`, `evaluations (affectation_id, periode_id)`,
  `eleves (matricule)` + trigramme sur nom et prénoms.

## Tests

- Chaque RG a au moins un test fonctionnel qui passe.
- Les droits sont testés par profil, **y compris les accès refusés** par manipulation d'URL.
- Les temps de réponse se mesurent sur le jeu de volumétrie, pas sur dix élèves.
- Seeder de démonstration : 1 année, 3 niveaux, 6 classes, 200 élèves.

## Ce qu'il ne faut pas faire

- Écrire une couleur en dur dans une page.
- Mettre une règle de gestion dans un contrôleur ou dans un composant React.
- Stocker une moyenne ou un rang comme donnée de référence.
- Exposer une note ou un bulletin non publié à un élève ou un tuteur, de quelque manière que ce soit.
- Modifier une migration déjà passée en production.
- Supprimer physiquement une ligne.

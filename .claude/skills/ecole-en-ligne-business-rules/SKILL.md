---
name: "ecole-en-ligne-business-rules"
description: "Utiliser pour implémenter, tester ou relire toute fonctionnalité d'École en ligne touchant années scolaires, inscriptions, élèves, matières, coefficients, évaluations, notes, moyennes, rangs, délibération ou bulletins : checklist RG1 à RG22, états et modèle de données."
---
 
# École en ligne — règles de gestion
 
Référence métier de l'application de gestion scolaire. Indépendante du style et du framework :
ces règles valent pour le service, le contrôleur, le test et le composant.
 
**Règle d'arbitrage** : en cas de conflit entre une demande ponctuelle et une RG, la RG l'emporte.
On la fait évoluer explicitement, on ne la contourne pas dans un coin du code.
 
## Les 22 règles
 
### Structure pédagogique
 
- **RG1** — Une seule année scolaire active à la fois ; toute écriture porte sur l'année active.
- **RG2** — Une année clôturée passe en lecture seule définitive : ni note, ni inscription,
  ni bulletin modifiable.
- **RG3** — Le coefficient d'une matière est défini sur le couple **niveau + matière**, jamais sur
  la matière seule. Les maths valent 4 en Terminale scientifique et 2 en Terminale littéraire.
### Élèves et inscriptions
 
- **RG4** — Le matricule est unique, immuable, attribué à la création, au format `AAAA-NNNNN`
  où `AAAA` est l'année de première inscription.
- **RG5** — Un élève ne peut avoir qu'une seule inscription validée par année scolaire.
- **RG6** — Un dossier ne passe en `validé` que si toutes les pièces obligatoires sont fournies
  et qu'une classe est affectée.
- **RG7** — L'affectation est refusée si l'effectif de la classe atteint sa capacité ; seule la
  direction peut forcer, avec motif enregistré.
- **RG8** — Un élève `transféré`, `abandon` ou `exclu` ne peut pas être réinscrit sans réactivation
  par la direction.
### Notes et évaluations
 
- **RG9** — Un enseignant ne voit et ne saisit que les évaluations des couples classe + matière qui
  lui sont affectés **sur l'année active**. Toute requête sur les notes part de l'affectation,
  jamais de la classe seule.
- **RG10** — Une note est comprise entre 0 et la note maximale de l'évaluation ; toute valeur hors
  bornes est refusée à la saisie, pas à l'envoi.
- **RG11** — Un élève marqué `absent` est exclu du numérateur **et** du dénominateur de la moyenne.
  Un `0` saisi reste un zéro et compte. Ne jamais confondre les deux.
- **RG12** — Une évaluation validée n'est plus modifiable par l'enseignant ; seul le chef
  d'établissement peut la déverrouiller, et l'action est journalisée.
- **RG13** — La saisie est refusée hors de la fenêtre de saisie de la période, sauf dérogation
  accordée par la direction.
- **RG14** — Les moyennes ne sont jamais stockées comme données de référence : elles sont
  recalculées depuis les notes. Un cache daté est autorisé, une colonne `moyenne` saisissable non.
- **RG15** — L'arrondi à deux décimales n'intervient qu'à l'affichage et à l'impression, jamais
  dans un calcul intermédiaire.
### Résultats et bulletins
 
- **RG16** — Le rang est calculé sur la moyenne **non arrondie** ; en cas d'égalité, rang identique
  et rang suivant sauté (1, 2, 2, 4).
- **RG17** — La génération des bulletins est refusée tant qu'une matière du programme est sans note,
  sauf dérogation motivée.
- **RG18** — **Un bulletin n'est visible par l'élève et ses tuteurs qu'après publication par la
  direction.** C'est la règle centrale : une note validée existe dans le système mais reste
  invisible côté famille jusqu'à la publication horodatée.
- **RG19** — Un bulletin publié est immuable. Une correction donne un bulletin rectificatif
  numéroté qui remplace le précédent à l'affichage, l'original restant archivé.
### Accès et traçabilité
 
- **RG20** — Un tuteur n'accède qu'aux dossiers des élèves qui lui sont rattachés, en lecture seule.
- **RG21** — Toute suppression est logique (`deleted_at`) : la donnée est marquée supprimée, jamais
  effacée de la base. Les clés étrangères sont en restriction, jamais en cascade.
- **RG22** — Toute création, modification de note, validation, publication ou déverrouillage est
  journalisée avec auteur, date, IP et valeurs avant/après. Le journal n'est pas effaçable depuis
  l'application.
## Formules
 
Moyenne d'un élève dans une matière sur une période, pondérée par le poids des évaluations :
 
```
M_matiere = somme(note_i * poids_i) / somme(poids_i)
```
 
Moyenne générale de la période, pondérée par les coefficients du niveau :
 
```
M_generale = somme(M_matiere * coef_matiere) / somme(coef_matiere)
```
 
La moyenne annuelle est la moyenne des moyennes de période, à poids égal, sauf paramétrage
contraire de l'établissement. Les élèves absents sont écartés des deux sommes (RG11).
 
## Machines à états
 
| Objet | États | Transitions autorisées |
| --- | --- | --- |
| Année scolaire | `en_preparation` → `active` → `cloturee` | Jamais de retour en arrière |
| Inscription | `brouillon` → `soumis` → `valide` / `refuse` / `annule` | `valide` exige RG6 et RG7 |
| Élève | `inscrit`, `transfere`, `abandon`, `diplome`, `exclu` | Sortie exige motif + date |
| Évaluation | `brouillon` → `soumise` → `validee` → `verrouillee` | Retour `soumise` → `brouillon` possible (refus) ; déverrouillage direction seulement (RG12) |
| Bulletin | `genere` → `delibere` → `publie` | `publie` est terminal (RG19) |
 
Circuit complet d'une note : saisie (enseignant) → soumission (enseignant) → validation (direction)
→ verrouillage (système) → génération (système) → délibération (conseil de classe) → publication
(direction) → consultation (élève et parent).
 
## Modèle de données
 
Séparation stricte : **l'élève est permanent, l'inscription est annuelle, la note appartient à une
évaluation.** L'appartenance à une classe est portée par l'inscription, pas par la fiche élève.
 
Tables : `users`, `annees_scolaires`, `periodes`, `niveaux`, `classes`, `matieres`,
`niveau_matiere` (coefficient), `eleves`, `tuteurs`, `eleve_tuteur`, `inscriptions`, `documents`,
`affectations`, `evaluations`, `notes`, `appreciations`, `bulletins`, `bulletin_lignes`, `journal`.
 
Contraintes à poser en base, pas seulement en code :
 
- `eleves.matricule` unique
- `inscriptions` unique sur (élève, année) parmi les validées
- `notes` unique sur (évaluation, élève), valeur entre 0 et la note max
- `niveau_matiere` unique sur (niveau, matière)
- `affectations` unique sur (enseignant, classe, matière, année)
- `bulletins` unique sur (élève, période, version)
- `evaluations.poids` strictement positif
## Rôles et portée
 
| Rôle | Portée des données |
| --- | --- |
| Administrateur | Tout l'établissement, paramétrage et comptes |
| Direction | Tout l'établissement, valide, délibère, publie |
| Secrétariat | Tout l'établissement, dossiers et élèves |
| Enseignant | Ses classes et ses matières uniquement (RG9) |
| Professeur principal | Sa classe, appréciation générale |
| Élève / Parent | Son propre dossier ou les enfants rattachés, lecture seule (RG20) |
 
Les rôles se cumulent sur un même compte (un enseignant peut être professeur principal).
 
## Checklist avant de livrer une fonctionnalité
 
- [ ] Chaque RG touchée a un test fonctionnel qui passe.
- [ ] Le cas « élève absent » est testé à part du cas « note à 0 » (RG11).
- [ ] Les égalités de moyenne sont testées sur le rang (RG16).
- [ ] L'accès est testé **en refus** par manipulation d'URL pour chaque rôle non autorisé.
- [ ] Aucune donnée non publiée n'est atteignable depuis le portail famille (RG18).
- [ ] Les écritures sensibles alimentent le journal (RG22).
- [ ] Aucune suppression physique (RG21).
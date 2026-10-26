# Conformité au cahier des charges — état au lot L2

Suivi, exigence par exigence, de ce qui est livré, de ce qui est prévu dans un lot ultérieur
(cahier § 14) et de ce qui reste à trancher. Mis à jour à chaque lot.

Légende : **Fait** · **Partiel** (préciser ce qui manque) · **Lot Lx** (prévu plus tard par le
lotissement) · **À trancher** (décision de l’établissement attendue).

## Règles de gestion (§ 8)

| RG | Règle | État | Preuve (test automatisé) |
| --- | --- | --- | --- |
| RG1 | Une seule année active ; toute écriture porte sur elle | Fait | `structure.spec.ts` · RG1 ; inscriptions et import refusés hors année active |
| RG2 | Année clôturée en lecture seule définitive | Fait | `structure.spec.ts` · RG2 |
| RG3 | Coefficient au couple niveau + matière | Fait | `structure.spec.ts` · RG3 |
| RG4 | Matricule unique, immuable, `AAAA-NNNNN` (année de 1re inscription) | Fait | `scolarite.spec.ts` · RG4 (déclencheur en base) |
| RG5 | Une inscription validée par élève et par année | Fait | `scolarite.spec.ts` · RG5 (index unique partiel) |
| RG6 | Validation seulement avec pièces obligatoires et classe affectée | Fait | `scolarite.spec.ts` · RG6 |
| RG7 | Capacité de classe ; seule la direction force, avec motif | Fait | `scolarite.spec.ts` · RG7 |
| RG8 | Élève transféré, en abandon ou exclu : réactivation par la direction | Fait | `scolarite.spec.ts` · RG8 |
| RG9 | L’enseignant ne saisit que sur ses affectations de l’année active | Fait | `notes.spec.ts` · grille et création refusées sur l’affectation d’un collègue, même par l’URL ; élève d’une autre classe refusé |
| RG10 | Note entre 0 et la note maximale | Fait | `notes.spec.ts` · refus en application et en base (déclencheur) |
| RG11 | Absent hors numérateur et dénominateur ; un 0 compte | Fait | `notes.spec.ts` · RG11 |
| RG12 | Évaluation validée non modifiable ; déverrouillage par la direction, avec motif, journalisé | Fait | `notes.spec.ts` · soumission, validation, déverrouillage |
| RG13 | Saisie refusée hors fenêtre, sauf dérogation | Fait | `notes.spec.ts` · fenêtre et dérogation |
| RG14 | Aucune moyenne stockée ; cache daté seulement | Fait | `notes.spec.ts` · le cache suit les notes |
| RG15 | Arrondi à l’affichage uniquement | Fait | `notes.spec.ts` · RG3 et RG15 |
| RG16 | Rang sur la valeur non arrondie, ex æquo, rang suivant sauté | Fait | `notes.spec.ts` · RG16 |
| RG17 à RG19 | Génération, publication, rectificatif | Lot L4 | — |
| RG20 | Tuteur : ses élèves seulement, en lecture | Partiel | Accès au portail créé depuis la fiche ; écrans du portail sur données réelles en L4. Le tuteur n’ouvre aucun écran ni pièce de scolarité (`scolarite.spec.ts`, `acces_par_role.spec.ts`) |
| RG21 | Suppression logique partout | Fait | `deleted_at` sur toutes les tables, clés étrangères en restriction ; tuteur détaché, pièce remplacée et rôle retiré conservés |
| RG22 | Journalisation avec auteur, date, IP, avant / après | Fait pour L0 à L3 | `journal.spec.ts`, `comptes.spec.ts`, `scolarite.spec.ts` (validation), `notes.spec.ts` (saisie, modification, déverrouillage). Publication : L4 |

## Modules

### § 2 · Acteurs et rôles — Fait
Rôles cumulables (administrateur, direction, secrétariat, enseignant, professeur principal,
tuteur, élève). Chaque espace est fermé aux autres rôles (middleware), puis chaque action est
autorisée par la policy de sa ressource. Droits testés par profil, accès refusés compris
(`acces_par_role.spec.ts`, `scolarite.spec.ts`).

### § 3 · Inscription et réinscription
| Exigence | État |
| --- | --- |
| États brouillon, soumis, validé, refusé, annulé ; une inscription par couple élève + année | Fait |
| Formulaire en trois étapes (identité, tuteurs, scolarité), élève déjà connu retrouvé | Fait |
| Tuteur réutilisable pour une fratrie | Fait (recherche par nom ou téléphone) |
| Pièces : PDF ou image, 5 Mo, fourni / manquant, certificat de transfert si autre établissement | Fait (type vérifié sur le contenu réel, nom généré, lecture par route authentifiée) |
| Soumission possible avec pièces manquantes, validation impossible | Fait |
| Fiche d’inscription imprimable | Fait (page HTML imprimable ou à enregistrer en PDF) |
| Certificat de scolarité, liste de classe PDF et Excel, registre des inscriptions | Fait (file d’attente, « Mes documents ») |
| Réinscription de masse | Lot L5 |

### § 4 · Gestion des élèves
| Exigence | État |
| --- | --- |
| Matricule à vie, appartenance à la classe portée par l’inscription | Fait |
| Fiche en 7 onglets | Fait pour identité, tuteurs, scolarité, notes, documents, journal ; bulletins en L4 (état vide) |
| Statuts ; transfert et abandon avec motif et date d’effet | Fait |
| Recherche plein texte (nom, prénom, matricule) et filtres cumulables | Fait (index trigramme, sans accent) |
| Export Excel et PDF des colonnes visibles | Fait (choix des colonnes mémorisé par navigateur) |
| Changement de classe en masse, certificats groupés | Fait |
| Import Excel au format fourni, rapport ligne par ligne, rien d’enregistré avant acceptation | Fait (`scolarite.spec.ts` · import) |

### § 5 · Structure pédagogique — Fait (lot L1)
Années, périodes et fenêtres de saisie, niveaux, matières, coefficients par niveau, matières
obligatoires, classes, affectations, duplication d’année, paramètres de l’établissement.

### § 6 · Notes et résultats — Lot L3
Fait : évaluations, grille de saisie (clavier, enregistrement automatique, file locale hors ligne), soumission, validation, déverrouillage, dérogations, suivi des saisies, appréciations, récapitulatif, onglet Notes de la fiche élève.

### § 7 · Bulletins — Lot L4
Les écrans correspondants affichent encore le jeu de démonstration du prototype.

## Architecture (§ 9)

| Exigence | État |
| --- | --- |
| Contrôleurs sans calcul : validation, autorisation, service, réponse | Fait |
| Une transaction par opération métier | Fait (validation, dossier, import, changement de classe) |
| Service de calcul des moyennes unique | Fait (`MoyenneService`, utilisé par les écrans enseignant, direction et la fiche élève) |
| PDF depuis un gabarit Edge rendu en HTML | Fait (`resources/views/pdf`) |
| Traitements lourds en file d’attente | Fait (exports, certificats, registre) ; travailleur `node ace queue:work` |
| Année active injectée par un middleware | Fait |

## Sécurité (§ 12)

| Exigence | État |
| --- | --- |
| Autorisation côté serveur, ressource par ressource | Fait (policies élève, inscription, document généré) |
| Pièces jointes : route authentifiée, nom généré, type vérifié, 5 Mo | Fait |
| Mots de passe : scrypt, 10 caractères, verrouillage après 5 échecs, changement à la 1re connexion | Fait (L0) |
| Second facteur pour direction et administration | Fait (code par courriel) |
| Session signée, `httpOnly`, 8 h glissantes, CSRF | Fait |
| Aucun secret versionné, `env.ts` validé | Fait |
| Requêtes paramétrées uniquement | Fait |

## Exigences non fonctionnelles (§ 13)

| Exigence | État |
| --- | --- |
| Listes paginées côté serveur | Fait |
| Interface en français, textes centralisés pour une traduction ultérieure | Partiel : interface et messages de validation en français ; les textes ne sont pas encore extraits dans un catalogue |
| Mobile d’abord pour le portail, sans défilement horizontal | Fait sur les écrans de scolarité (vérifié à 390 px) |
| Temps de réponse mesurés sur le jeu de volumétrie (3 000 élèves) | À faire : le jeu de démonstration compte 200 élèves ; un jeu de volumétrie reste à constituer avant la recette |

## Recette (§ 14)

| Critère | État |
| --- | --- |
| Chaque RG du lot couverte par un test qui passe | Fait pour RG1 à RG8 (125 tests fonctionnels) |
| Droits testés par profil, y compris par manipulation d’URL | Fait |
| Documentation d’exploitation à jour | Fait : `docs/exploitation.md` |
| Scénario rejoué avec les données de l’établissement | À organiser |
| Temps de réponse sur jeu de volumétrie | À faire (voir § 13) |

## Points à trancher avec l’établissement

- Cycle visé et barème (hypothèses du § 1) : le modèle suppose le collège et une notation sur 20.
- Mono ou multi-établissement : le modèle est mono-établissement.
- Remise des identifiants du portail aux familles (papier ou SMS) : aujourd’hui, le mot de passe
  provisoire est affiché une fois au secrétariat, à remettre au tuteur.
- Coefficients non datés : un changement de coefficient en cours d’année s’applique
  rétroactivement aux calculs de l’année active.

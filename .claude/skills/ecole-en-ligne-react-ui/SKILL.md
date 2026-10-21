---
name: "ecole-en-ligne-react-ui"
description: "Utiliser pour implémenter ou relire l'interface d'École en ligne en React + Inertia + Tailwind CSS + Font Awesome : jetons de design du prototype, inventaire des 23 écrans, composants, grille de saisie des notes, responsive et accessibilité."
---
 
# École en ligne — interface React
 
Jetons et composants issus du prototype validé `Ecole en ligne.dc.html`. Toute page React doit
pouvoir se superposer au prototype sans écart visible.
 
## Jetons de design
 
À déclarer dans `tailwind.config` et **nulle part ailleurs**. Aucune couleur écrite en dur dans une
page ou un composant.
 
### Couleurs
 
| Rôle | Valeur |
| --- | --- |
| Accent | `#7424E0` |
| Accent doux (fond) | `#F3ECFD` |
| Accent survol / lien actif | `#5A16B8` |
| Texte principal | `#1B1726` |
| Texte fort secondaire | `#3B3747` |
| Texte secondaire | `#5E5A6B` |
| Texte tertiaire | `#77738A` |
| Fond de page | `#F6F5FA` |
| Fond de carte | `#FFFFFF` |
| Fond de champ | `#F7F6FA` |
| Fond d'en-tête de tableau | `#F8F7FB` |
| Fond neutre (bandeau, onglets) | `#F1F0F5` / `#ECEAF2` |
| Bordure de carte | `#ECEAF2` |
| Bordure de champ | `#E6E3EE` |
| Séparateur de ligne | `#F1F0F5` |
 
États, toujours par paire texte sur fond :
 
| État | Texte | Fond |
| --- | --- | --- |
| Succès (validé, publié, complet) | `#14663F` | `#E2F4EA` |
| Attention (en attente, brouillon) | `#7A4A00` | `#FFF3DD` |
| Erreur (refusé, incomplet, hors bornes) | `#A3214F` | `#FCE8EF` |
| Information (à venir, provisoire) | `#2448B5` | `#EAF0FD` |
 
### Typographie
 
Plus Jakarta Sans (Google Fonts), graisses 400 / 500 / 600 / 700 / 800.
 
| Usage | Taille | Graisse |
| --- | --- | --- |
| Titre d'écran | 26 px | 800, `letter-spacing:-.02em` |
| Titre de section | 17–20 px | 800 |
| Titre de carte | 15–16 px | 700 |
| Corps | 14 px | 400–500 |
| Secondaire / méta | 13 px | 400 |
| Légende, badge | 12 px | 600–700 |
| Sur-titre majuscule | 11 px | 700, `letter-spacing:.06em` |
 
### Formes et espacement
 
- Rayons : 10 px (champ, bouton secondaire), 12 px (bouton principal, carte interne),
  16 px (carte), `999px` (pastille, badge).
- Hauteurs : champ 48 px, bouton principal 50 px, bouton compact 32–38 px, ligne de tableau 52 px.
- Espacement vertical entre blocs : 12 px dans une carte, 18–22 px entre sections.
- Ombre réservée aux éléments flottants : `0 -6px 20px rgba(27,23,38,.06)` pour la barre collante,
  `0 10px 24px rgba(27,23,38,.22)` pour le bouton flottant.
### Icônes Font Awesome
 
`@fortawesome/react-fontawesome` + `@fortawesome/free-solid-svg-icons` et `free-regular-svg-icons`.
**Import icône par icône**, jamais le pack complet : le poids des pages compte sur une connexion
lente. Styles `solid` et `regular` uniquement.
 
Jeu utilisé par le prototype : `graduation-cap`, `magnifying-glass`, `bell`, `chevron-down`,
`chevron-right`, `arrow-left`, `arrow-right`, `arrow-right-from-bracket`, `plus`, `xmark`,
`circle-check`, `circle-exclamation`, `circle-info`, `triangle-exclamation`, `lock`, `unlock`,
`shield-halved`, `eye`, `keyboard`, `comment`, `paper-plane`, `paperclip`, `file-pdf`,
`file-excel`, `file-lines`, `file-import`, `download`, `print`, `copy`, `link`, `repeat`,
`hourglass-half`, `spinner`, `star`, `gears`, `door-open`, `briefcase`, `phone`, `location-dot`,
`camera`, `envelope-open-text`.
 
## Structure de l'application
 
Trois environnements, un seul projet : administration, espace enseignant, portail famille. Chacun
son layout, sa navigation et son libellé d'environnement, mais les mêmes composants.
 
### Coque
 
- **Bureau** (≥ 1024 px) : barre latérale blanche de 248 px (logo, libellé d'environnement,
  navigation, déconnexion en bas) + en-tête de 68 px (recherche globale 320 px, notifications,
  bloc utilisateur avec initiales).
- **Mobile** : en-tête de 60 px avec bouton retour contextuel, barre d'onglets basse (icône 18 px +
  libellé 11 px), bouton flottant 56 px en bas à droite pour l'action principale de l'écran.
- Élément de navigation actif : fond accent doux, texte accent, liseré interne
  `inset 3px 0 0` en accent.
### Les 23 écrans
 
| Préfixe | Écrans |
| --- | --- |
| Authentification | connexion, double facteur, mot de passe oublié, lien envoyé |
| `a_` Administration | accueil, structure, comptes, journal |
| `s_` Scolarité | liste des élèves, fiche élève, nouvelle inscription, dossiers incomplets |
| `t_` Enseignant | mes classes, mes évaluations, nouvelle évaluation, grille de saisie, appréciations, récapitulatif |
| `d_` Direction | accueil, validation, délibération, bulletins |
| `p_` Portail famille | accueil, notes, bulletins, bulletin, dossier |
| Commun | profil |
 
La fiche élève s'ouvre en onglets : identité, tuteurs, scolarité, notes, bulletins, documents,
journal.
 
## Composants partagés
 
- **Carte** : fond blanc, bordure `#ECEAF2`, rayon 16 px, padding 16 px.
- **Badge d'état** : pastille `999px`, padding `5px 10px`, 12 px/700, icône à gauche avec 6 px de
  marge, paire de couleurs d'état.
- **Avatar** : cercle 30–38 px, initiales 11–13 px/700, fond et texte dérivés du nom.
- **Champ** : hauteur 48 px, rayon 12 px, fond `#F7F6FA`, bordure `#E6E3EE` ; au focus, bordure
  accent, fond blanc, et `box-shadow 0 0 0 3px` en accent doux sur les champs critiques.
- **Onglets** : conteneur `#ECEAF2` rayon 12 px, padding 4 px ; onglet actif blanc, rayon 9 px,
  légère ombre.
- **Tableau** : en-tête `#F8F7FB`, 11 px/700 majuscules ; lignes séparées par `1px #F1F0F5`,
  hauteur minimale 52 px. En CSS grid, pas en `<table>`, pour rester lisible en étroit.
- **Message d'alerte** : `role="alert"`, rayon 10 px, paire de couleurs d'état, icône à gauche.
- **État vide** : illustration ou icône, une phrase, une action — jamais un tableau vide muet.
## La grille de saisie des notes — écran critique
 
C'est l'écran qui décide de l'adoption par les enseignants. Exigences fermes :
 
- Colonnes en CSS grid `28px minmax(0,1fr) 72px 44px 40px` : numéro, élève, note, absent,
  observation. Tient sans défilement horizontal jusqu'à 60 élèves.
- **Clavier seul** : `Entrée` ou `↓` descend à l'élève suivant. Champ `inputMode="decimal"`,
  `aria-label="Note"`, texte centré 16 px/700.
- **Enregistrement automatique** au fil de la frappe, avec un indicateur d'état de sauvegarde
  visible en permanence (enregistré / en cours / hors ligne).
- **Tolérance à la coupure réseau** : les notes saisies restent en local tant que le serveur n'a pas
  confirmé, et repartent au retour du réseau.
- **Bouton absent distinct du 0** : case 28 px à bascule, jamais une valeur tapée dans le champ note.
- Note hors bornes refusée à la saisie, message `role="alert"` sous la ligne concernée.
- **Barre de synthèse collante en bas** : moyenne, min, max, absents, bouton Soumettre.
- Quand l'évaluation est validée, la grille passe en lecture seule avec un bandeau explicatif et
  une icône cadenas — pas de champs désactivés sans explication.
## Responsive
 
- **Portail famille : mobile first.** Les tuteurs se connectent presque toujours depuis un
  téléphone, souvent en réseau lent.
- **Administration : poste de bureau**, densité assumée — tableaux compacts, filtres persistants,
  actions de masse sans quitter la liste.
- Aucun défilement horizontal de page, quelle que soit la largeur.
## Accessibilité
 
- Contraste minimum 4.5:1 ; les paires d'états ci-dessus le respectent.
- Libellé lié à chaque champ ; `aria-label` sur les boutons porteurs d'une seule icône.
- Message d'erreur rattaché au champ concerné, pas seulement en haut de page.
- Navigation au clavier complète sur tous les formulaires, focus visible.
- La couleur ne porte jamais seule l'information : un état a toujours une icône ou un mot.
## Performance
 
Page utile sous 300 Ko hors images. Listes paginées côté serveur. Icônes importées une par une.
Aucune bibliothèque de composants lourde ajoutée sans raison : Tailwind et React suffisent pour ces
écrans.
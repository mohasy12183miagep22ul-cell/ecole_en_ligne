# Déploiement sur Vercel avec Neon

Mise en ligne de démonstration ou pilote. L'application tourne dans une fonction Vercel unique
(`api/index.js` → `build/bin/vercel.js`) ; la base est PostgreSQL chez Neon.

## Limites de ce mode d'hébergement

| Fonction | Sur Vercel |
| --- | --- |
| Écrans, connexion, saisie des notes, moyennes | Fonctionnent |
| Pièces de dossier, photos, documents générés | **Non conservés** : le dossier `/tmp` est vidé à chaque redémarrage de la fonction. Un stockage externe (S3, R2) sera nécessaire avant tout usage réel |
| File d'attente | Pas de travailleur : `QUEUE_DRIVER=sync`, la tâche s'exécute pendant la requête (60 s maximum) |
| PDF (certificats, bulletins) | Indisponibles : pas de Chromium dans la fonction |
| Courriel | `journal` : les messages (code de second facteur, lien de réinitialisation) apparaissent dans les journaux Vercel ; `smtp` pour un envoi réel |

Données de mineurs : n'y mettre que des données fictives tant que ces limites et les sauvegardes
(`docs/exploitation.md`) ne sont pas traitées.

## 1. Base Neon

1. Créer un projet sur neon.tech (région la plus proche, ex. Europe — Francfort).
2. Dans *Connect*, relever deux adresses :
   - **directe** (sans `-pooler`) : pour les migrations ;
   - **mutualisée** (avec `-pooler`) : pour l'application.
3. Appliquer les migrations depuis le poste de développement, PowerShell, à la racine du projet :

```powershell
$env:NODE_ENV="production"; $env:DB_SSL="true"
$env:DB_HOST="ep-xxxx.eu-central-1.aws.neon.tech"   # adresse DIRECTE
$env:DB_USER="neondb_owner"; $env:DB_PASSWORD="…"; $env:DB_DATABASE="neondb"
node ace migration:run --force
node ace compte:administrateur --nom="Prénom Nom" --email="admin@exemple.org"
```

Fermer ce terminal ensuite : ces variables pointent sur la base en ligne. Ne jamais y lancer les
tests ni `migration:fresh`.

## 2. Projet Vercel

1. vercel.com → *Add New → Project* → importer le dépôt GitHub `ecole_en_ligne`.
2. *Framework Preset* : **Other**. Les commandes viennent de `vercel.json`, ne rien changer.
3. *Settings → General → Node.js Version* : **24.x**. La région des fonctions est fixée à Francfort (`fra1`) dans `vercel.json`, au plus près de la base.
4. *Environment Variables* (Production) :

| Variable | Valeur |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` / `PORT` | `0.0.0.0` / `3333` (exigées, non utilisées) |
| `LOG_LEVEL` | `info` |
| `APP_KEY` | résultat de `node ace generate:key --show` — secret, ne jamais le committer |
| `APP_URL` | `https://<projet>.vercel.app` |
| `SESSION_DRIVER` | `cookie` |
| `DB_*` | rien à saisir si la base est créée par l'intégration Neon de Vercel : `bin/vercel.ts` reprend `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (adresse mutualisée) et active `DB_SSL` |
| `PROXY_DE_CONFIANCE` | `true` (adresse IP réelle au journal) |
| `MAIL_MAILER` | `journal` (ou `smtp` + `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_PASSWORD`) |
| `MAIL_FROM_NAME` / `MAIL_FROM_ADDRESS` | nom et adresse d'expédition |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` si `journal` (exigées) |
| `DRIVE_DISK` | `fs` |
| `DRIVE_DOSSIER` | `/tmp/stockage` |
| `QUEUE_DRIVER` | `sync` |

5. *Deploy*. Chaque `git push` sur `main` redéploie.

## 3. Vérifier

- `https://<projet>.vercel.app/` redirige vers `/login`.
- Connexion avec le compte administrateur : changement de mot de passe imposé, puis code de second
  facteur, à lire dans *Deployments → Logs* (« Courriel non envoyé ») tant que `MAIL_MAILER=journal`.

## Nouvelle migration

À chaque lot qui ajoute une migration : refaire l'étape 1.3 (`migration:run --force` sur l'adresse
directe) **avant** de pousser le code qui en dépend.

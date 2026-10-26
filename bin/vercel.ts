/*
|--------------------------------------------------------------------------
| Point d'entrée Vercel
|--------------------------------------------------------------------------
|
| Même démarrage que `bin/server.ts`, sans ouvrir de port : Vercel fournit
| la requête et la réponse Node.js, AdonisJS les traite. L'application est
| démarrée une fois par instance, puis réutilisée d'une requête à l'autre.
|
*/

import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core/ignitor'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * L'intégration Neon de Vercel fournit PGHOST, PGUSER… (adresse mutualisée) :
 * on les reprend sous les noms attendus par `start/env.ts`, sauf valeur explicite.
 */
const NEON = {
  DB_HOST: 'PGHOST',
  DB_USER: 'PGUSER',
  DB_PASSWORD: 'PGPASSWORD',
  DB_DATABASE: 'PGDATABASE',
}
for (const [cible, source] of Object.entries(NEON)) {
  process.env[cible] ??= process.env[source]
}
if (process.env.PGHOST) {
  process.env.DB_PORT ??= '5432'
  process.env.DB_SSL ??= 'true'
}

const APP_ROOT = new URL('../', import.meta.url)

/**
 * Vercel lance la fonction depuis la racine du dépôt : les chemins relatifs
 * (tâches de la file d'attente…) doivent partir de `build/`.
 */
process.chdir(fileURLToPath(APP_ROOT))

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

const app = new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((application) => {
    application.booting(async () => {
      await import('#start/env')
    })
  })
  .createApp('web')

await app.init()
await app.boot()
await app.start(async () => {})

const server = await app.container.make('server')
await server.boot()

export default function traiter(req: IncomingMessage, res: ServerResponse) {
  return server.handle(req, res)
}

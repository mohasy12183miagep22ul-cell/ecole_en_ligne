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
import type { IncomingMessage, ServerResponse } from 'node:http'

const APP_ROOT = new URL('../', import.meta.url)

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

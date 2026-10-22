import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/queue'

/**
 * File d'attente des traitements lourds (cahier des charges § 9) : PDF,
 * exports, générations de masse. Pilote `database` : les tâches vivent dans
 * PostgreSQL, sans service supplémentaire à installer sur le serveur de
 * l'établissement. Le travailleur se lance avec `node ace queue:work`.
 * Pilote `sync` en test : la tâche s'exécute immédiatement.
 */
export default defineConfig({
  default: env.get('QUEUE_DRIVER', 'database'),

  adapters: {
    database: drivers.database(),
    sync: drivers.sync(),
  },

  worker: {
    concurrency: 2,
    idleDelay: '2s',
  },

  locations: ['./app/jobs/**/*.{ts,js}'],
})

import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

/**
 * PostgreSQL uniquement, y compris en développement et en test : les
 * contraintes, index partiels et règles du schéma en dépendent.
 */
const dbConfig = defineConfig({
  connection: 'pg',

  connections: {
    pg: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD').release(),
        database: env.get('DB_DATABASE'),
        ssl: env.get('DB_SSL') ? { rejectUnauthorized: true } : undefined,
      },
      // Aucune connexion gardée ouverte au repos : indispensable en hébergement
      // serverless, sans effet sur un serveur classique
      pool: { min: 0, max: 10 },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      schemaGeneration: {
        enabled: true,
        rulesPaths: ['./database/schema_rules.js'],
      },
      debug: app.inDev,
    },
  },
})

export default dbConfig

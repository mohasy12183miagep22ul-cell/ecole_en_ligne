import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

/**
 * Stockage des fichiers : pièces de dossier, photos, PDF générés.
 *
 * Données personnelles de mineurs : le stockage est privé et n'est JAMAIS
 * servi directement (pas de `serveFiles`, pas d'URL publique devinable). Un
 * fichier ne sort que par une route authentifiée qui vérifie les droits
 * (cahier des charges § 12). En test, un dossier à part.
 */
const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  services: {
    fs: services.fs({
      location: app.inTest
        ? app.tmpPath('stockage_tests')
        : (env.get('DRIVE_DOSSIER') ?? app.makePath('storage')),
      serveFiles: false,
      visibility: 'private',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}

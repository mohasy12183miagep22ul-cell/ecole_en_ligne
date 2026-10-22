import env from '#start/env'
import edge from 'edge.js'
import { chromium } from 'playwright-core'

/**
 * PDF générés côté serveur depuis un gabarit Edge rendu en HTML, puis
 * converti (cahier des charges § 9, principe 4). Appelé uniquement depuis la
 * file d'attente : une génération ne bloque jamais une requête web.
 *
 * Navigateur de conversion : PDF_NAVIGATEUR (chemin d'un Chromium ou Chrome)
 * s'il est défini, sinon Google Chrome installé sur la machine.
 */
export default class PdfService {
  static async depuisGabarit(gabarit: string, donnees: Record<string, unknown>) {
    const html = await edge.render(`pdf/${gabarit}`, donnees)
    const chemin = env.get('PDF_NAVIGATEUR')
    const navigateur = await chromium.launch(
      chemin ? { executablePath: chemin } : { channel: 'chrome' }
    )
    try {
      const page = await navigateur.newPage()
      await page.setContent(html, { waitUntil: 'load' })
      return await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
      })
    } finally {
      await navigateur.close()
    }
  }
}

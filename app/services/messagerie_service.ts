import env from '#start/env'
import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'

type Message = {
  a: string
  sujet: string
  /** Gabarit Edge sous resources/views/emails/, décliné en `.html` et `.texte`. */
  gabarit: string
  donnees: Record<string, unknown>
}

/**
 * Seul point d'envoi de courriel de l'application.
 *
 * En mode `journal` (développement), rien ne part : le destinataire, le sujet
 * et les données sont écrits dans le journal applicatif. En mode `smtp`, le
 * message part par le serveur de l'établissement.
 */
export default class MessagerieService {
  static async envoyer({ a, sujet, gabarit, donnees }: Message) {
    if (env.get('MAIL_MAILER') === 'journal') {
      logger.info({ a, sujet, ...donnees }, `Courriel non envoyé (MAIL_MAILER=journal) : ${sujet}`)
      return
    }
    await mail.send((m) => {
      m.to(a)
        .subject(sujet)
        .htmlView(`emails/${gabarit}_html`, donnees)
        .textView(`emails/${gabarit}_texte`, donnees)
    })
  }

  static get envoiReel() {
    return env.get('MAIL_MAILER') !== 'journal'
  }
}

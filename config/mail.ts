import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

/**
 * Courriels sortants (codes de vérification, liens de réinitialisation).
 *
 * MAIL_MAILER=smtp    : envoi réel par le serveur SMTP de l'établissement.
 * MAIL_MAILER=journal : aucun envoi, le message est écrit dans le journal
 *                       applicatif (développement). Voir MessagerieService.
 */
const mailConfig = defineConfig({
  default: 'smtp',

  from: {
    address: env.get('MAIL_FROM_ADDRESS'),
    name: env.get('MAIL_FROM_NAME'),
  },

  globals: {
    brandName: 'École en ligne',
  },

  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: env.get('SMTP_SECURE', false),
      ...(env.get('SMTP_USERNAME')
        ? {
            auth: {
              type: 'login' as const,
              user: env.get('SMTP_USERNAME')!,
              pass: env.get('SMTP_PASSWORD')?.release() ?? '',
            },
          }
        : {}),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}

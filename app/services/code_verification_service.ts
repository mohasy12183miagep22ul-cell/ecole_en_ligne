import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import type { Session } from '@adonisjs/session'
import type User from '#models/user'

const CLE = 'double_facteur'
const VALIDITE_MS = 10 * 60 * 1000
const MAX_ESSAIS = 5

type CodeEnAttente = { userId: number; empreinte: string; expire: number; essais: number }

const empreinte = (code: string) => createHash('sha256').update(code).digest('hex')

/**
 * Second facteur par code à 6 chiffres, réservé aux comptes direction et
 * administrateur (§ 12). Seule l'empreinte du code est gardée en session,
 * avec une validité de 10 minutes et 5 essais au plus.
 */
export default class CodeVerificationService {
  /**
   * Génère et « envoie » un code. Tant que l'envoi de courriel n'est pas
   * configuré, le code est écrit dans le journal applicatif ; il est aussi
   * renvoyé pour être affiché hors production uniquement.
   */
  static emettre(session: Session, user: User) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const attente: CodeEnAttente = {
      userId: user.id,
      empreinte: empreinte(code),
      expire: Date.now() + VALIDITE_MS,
      essais: 0,
    }
    session.put(CLE, attente)
    // TODO envoi par courriel (@adonisjs/mail) quand le SMTP de l'établissement sera connu.
    logger.info({ userId: user.id }, `Code de vérification pour ${user.email} : ${code}`)
    return code
  }

  static enAttente(session: Session): CodeEnAttente | null {
    const a = session.get(CLE) as CodeEnAttente | undefined
    if (!a || a.expire < Date.now() || a.essais >= MAX_ESSAIS) return null
    return a
  }

  /** Renvoie l'identifiant de l'utilisateur si le code est bon, sinon `null`. */
  static verifier(session: Session, code: string): number | null {
    const a = this.enAttente(session)
    if (!a) return null
    const ok = timingSafeEqual(Buffer.from(empreinte(code)), Buffer.from(a.empreinte))
    if (ok) {
      session.forget(CLE)
      return a.userId
    }
    session.put(CLE, { ...a, essais: a.essais + 1 })
    return null
  }

  static annuler(session: Session) {
    session.forget(CLE)
  }
}

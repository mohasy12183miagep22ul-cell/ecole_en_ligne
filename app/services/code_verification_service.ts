import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import MessagerieService from '#services/messagerie_service'
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
   * Génère un code, l'envoie par courriel et le renvoie à l'appelant (qui ne
   * l'affiche qu'en développement, quand aucun courriel ne part).
   */
  static async emettre(session: Session, user: User) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const attente: CodeEnAttente = {
      userId: user.id,
      empreinte: empreinte(code),
      expire: Date.now() + VALIDITE_MS,
      essais: 0,
    }
    session.put(CLE, attente)
    await MessagerieService.envoyer({
      a: user.email,
      sujet: 'Votre code de vérification',
      gabarit: 'code_verification',
      donnees: { nom: user.fullName ?? user.email, code },
    })
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

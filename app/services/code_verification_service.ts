import { createHash, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import DefiConnexion from '#models/defi_connexion'
import MessagerieService from '#services/messagerie_service'
import type { Session } from '@adonisjs/session'
import type User from '#models/user'

const CLE = 'double_facteur'
const VALIDITE_MS = 10 * 60 * 1000
const MAX_ESSAIS = 5

type CodeEnAttente = { userId: number; empreinte: string; expire: number; essais: number }

const empreinte = (code: string) => createHash('sha256').update(code).digest('hex')
const nouveauCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0')
const memeEmpreinte = (code: string, attendue: string) =>
  timingSafeEqual(Buffer.from(empreinte(code)), Buffer.from(attendue))

/**
 * Second facteur par code à 6 chiffres, réservé aux comptes direction et
 * administrateur (§ 12). Seule l'empreinte du code est gardée, avec une
 * validité de 10 minutes et 5 essais au plus : en session pour le web, dans
 * un défi à identifiant opaque pour l'application mobile.
 */
export default class CodeVerificationService {
  /**
   * Le code n'est rendu à l'écran que si aucun courriel n'est réellement
   * envoyé : en développement, ou en production tant que l'envoi n'est pas
   * branché ET que AFFICHER_CODE_VERIFICATION=true (mesure provisoire, qui
   * réduit le second facteur au seul mot de passe).
   */
  static get codeAffichable() {
    return (
      !MessagerieService.envoiReel &&
      (!app.inProduction || env.get('AFFICHER_CODE_VERIFICATION') === true)
    )
  }

  static async #envoyer(user: User, code: string) {
    await MessagerieService.envoyer({
      a: user.email,
      sujet: 'Votre code de vérification',
      gabarit: 'code_verification',
      donnees: { nom: user.fullName ?? user.email, code },
    })
  }

  /**
   * Génère un code, l'envoie par courriel et le renvoie à l'appelant (qui ne
   * l'affiche qu'en développement, quand aucun courriel ne part).
   */
  static async emettre(session: Session, user: User) {
    const code = nouveauCode()
    const attente: CodeEnAttente = {
      userId: user.id,
      empreinte: empreinte(code),
      expire: Date.now() + VALIDITE_MS,
      essais: 0,
    }
    session.put(CLE, attente)
    await this.#envoyer(user, code)
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
    if (memeEmpreinte(code, a.empreinte)) {
      session.forget(CLE)
      return a.userId
    }
    session.put(CLE, { ...a, essais: a.essais + 1 })
    return null
  }

  static annuler(session: Session) {
    session.forget(CLE)
  }

  /**
   * Application mobile : ouvre un défi (ou en régénère le code, l'ancien
   * devenant invalide) et renvoie son identifiant opaque avec le code.
   */
  static async emettreDefi(user: User, existant?: DefiConnexion) {
    const code = nouveauCode()
    const valeurs = {
      empreinte: empreinte(code),
      expireLe: DateTime.now().plus({ milliseconds: VALIDITE_MS }),
      essais: 0,
    }
    const defi = existant
      ? await existant.merge(valeurs).save()
      : await DefiConnexion.create({ id: randomUUID(), userId: user.id, ...valeurs })
    await this.#envoyer(user, code)
    return { defi: defi.id, code }
  }

  /** Défi encore utilisable : ni expiré, ni consommé, ni épuisé. */
  static async defiEnAttente(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const defi = await DefiConnexion.query()
      .where('id', id)
      .whereNull('utilise_le')
      .whereNull('deleted_at')
      .where('expire_le', '>', DateTime.now().toSQL()!)
      .where('essais', '<', MAX_ESSAIS)
      .first()
    return defi
  }

  /** Renvoie l'identifiant de l'utilisateur si le code est bon, sinon `null`. */
  static async verifierDefi(id: string, code: string): Promise<number | null> {
    const defi = await this.defiEnAttente(id)
    if (!defi) return null
    if (memeEmpreinte(code, defi.empreinte)) {
      defi.utiliseLe = DateTime.now()
      await defi.save()
      return defi.userId
    }
    defi.essais += 1
    await defi.save()
    return null
  }
}

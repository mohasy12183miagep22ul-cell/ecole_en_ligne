import { type NomIcone } from '~/lib/icones'

export type EtatEvaluation = 'brouillon' | 'soumise' | 'validee' | 'verrouillee'
export type TypeEvaluation = 'interrogation' | 'devoir' | 'composition' | 'tp' | 'oral'

export const ICONE_TYPE: Record<TypeEvaluation, NomIcone> = {
  interrogation: 'pen',
  devoir: 'file-pen',
  composition: 'file-signature',
  tp: 'flask-vial',
  oral: 'microphone',
}

export type StatistiquesEvaluation = {
  moyenne: number | null
  min: number | null
  max: number | null
  notes: number
  absents: number
  reste: number
  effectif: number
}

/** Évaluation telle que la renvoient les listes du serveur. */
export type EvaluationListe = {
  id: number
  titre: string
  type: TypeEvaluation
  date: string
  noteMax: number
  poids: number
  etat: EtatEvaluation
  motifRetour: string | null
  affectationId: number
  classe: string
  matiere: string
  enseignant: string
  periode: string
  statistiques: StatistiquesEvaluation
}

/** Moyenne d'une évaluation ramenée sur 20, pour l'affichage. */
export const sur20 = (moyenne: number | null, noteMax: number) =>
  moyenne === null ? null : (moyenne * 20) / noteMax

/**
 * Requête JSON vers le serveur (enregistrement automatique), avec le jeton
 * CSRF du cookie XSRF-TOKEN. Renvoie la réponse décodée ou lève une erreur
 * portant le message du serveur ; `reseau` vaut vrai quand le serveur n'a
 * pas pu être joint (la saisie reste alors conservée sur l'appareil).
 */
export async function envoyerJson<T>(url: string, corps: unknown): Promise<T> {
  const jeton = decodeURIComponent(
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('XSRF-TOKEN='))
      ?.slice('XSRF-TOKEN='.length) ?? ''
  )
  let reponse: Response
  try {
    reponse = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': jeton,
      },
      body: JSON.stringify(corps),
    })
  } catch {
    throw Object.assign(new Error('Serveur injoignable'), { reseau: true })
  }
  const donnees = await reponse.json().catch(() => ({}))
  if (!reponse.ok) {
    const message =
      donnees?.message ??
      donnees?.errors?.[0]?.message ??
      (reponse.status === 403 ? 'Action non autorisée.' : 'Enregistrement refusé par le serveur.')
    throw Object.assign(new Error(message), { reseau: false, statut: reponse.status })
  }
  return donnees as T
}

import vine from '@vinejs/vine'

const id = () => vine.number().withoutDecimals().positive()
const type = () => vine.enum(['interrogation', 'devoir', 'composition', 'tp', 'oral'] as const)
const champsEvaluation = {
  type: type(),
  titre: vine.string().trim().minLength(3).maxLength(120),
  date: vine.date({ formats: ['YYYY-MM-DD'] }),
  noteMax: vine.number().min(1).max(100),
  poids: vine.number().positive().max(100),
}

/** Création d'une évaluation sur une affectation de l'enseignant. */
export const evaluationValidator = vine.create({
  affectationId: id(),
  periodeId: id(),
  ...champsEvaluation,
})

/** Modification d'une évaluation en brouillon. */
export const modifierEvaluationValidator = vine.create(champsEvaluation)

/**
 * Lot de saisies de la grille (frappe au fil de l'eau ou file locale renvoyée
 * au retour du réseau). Les bornes de la note sont contrôlées par le service
 * contre la note maximale de l'évaluation (RG10).
 */
export const saisiesValidator = vine.create({
  saisies: vine
    .array(
      vine.object({
        eleveId: id(),
        valeur: vine.number().min(0).max(100).nullable(),
        absent: vine.boolean(),
        observation: vine.string().trim().maxLength(120).nullable().optional(),
      })
    )
    .minLength(1)
    .maxLength(200),
})

/** Appréciation d'un élève (250 caractères ; vide pour l'effacer). */
export const appreciationValidator = vine.create({
  affectationId: id(),
  periodeId: id(),
  eleveId: id(),
  texte: vine.string().maxLength(250).optional(),
})

/** Dérogation à la fenêtre de saisie (RG13). */
export const derogationValidator = vine.create({
  affectationId: id(),
  periodeId: id(),
  jusquAu: vine.date({ formats: ['YYYY-MM-DD'] }),
  motif: vine.string().trim().minLength(5).maxLength(250),
})

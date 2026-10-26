export const policies = {
  ElevePolicy: () => import('#policies/eleve_policy'),
  EvaluationPolicy: () => import('#policies/evaluation_policy'),
  FichierGenerePolicy: () => import('#policies/fichier_genere_policy'),
  InscriptionPolicy: () => import('#policies/inscription_policy'),
}


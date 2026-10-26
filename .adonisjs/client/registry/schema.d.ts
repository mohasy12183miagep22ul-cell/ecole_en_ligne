/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'double_facteur.create': {
    methods: ["GET","HEAD"]
    pattern: '/connexion/verification'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['createCode']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['createCode']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['createCode']>>>
    }
  }
  'double_facteur.store': {
    methods: ["POST"]
    pattern: '/connexion/verification'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').codeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').codeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['storeCode']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['storeCode']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['storeCode']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mot_de_passe_oublie.create': {
    methods: ["GET","HEAD"]
    pattern: '/mot-de-passe-oublie'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['create']>>>
    }
  }
  'double_facteur.renvoyer': {
    methods: ["POST"]
    pattern: '/connexion/verification/renvoyer'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['renvoyerCode']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['renvoyerCode']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['renvoyerCode']>>>
    }
  }
  'mot_de_passe_oublie.store': {
    methods: ["POST"]
    pattern: '/mot-de-passe-oublie'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').motDePasseOublieValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').motDePasseOublieValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'reinitialisation.edit': {
    methods: ["GET","HEAD"]
    pattern: '/reinitialiser/:jeton'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { jeton: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['edit']>>>
    }
  }
  'reinitialisation.update': {
    methods: ["POST"]
    pattern: '/reinitialiser/:jeton'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').reinitialiserValidator)>>
      paramsTuple: [ParamValue]
      params: { jeton: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user').reinitialiserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/mot_de_passe_oublie_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'profil': {
    methods: ["GET","HEAD"]
    pattern: '/profil'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profil_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profil_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/profil_controller').default['show']>>>
    }
  }
  'profil.mot_de_passe': {
    methods: ["POST"]
    pattern: '/profil/mot-de-passe'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').changerMotDePasseValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').changerMotDePasseValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profil_controller').default['changerMotDePasse']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profil_controller').default['changerMotDePasse']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/profil_controller').default['changerMotDePasse']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'portail.accueil': {
    methods: ["GET","HEAD"]
    pattern: '/portail'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'portail.notes': {
    methods: ["GET","HEAD"]
    pattern: '/portail/notes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'portail.bulletins': {
    methods: ["GET","HEAD"]
    pattern: '/portail/bulletins'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'portail.bulletin': {
    methods: ["GET","HEAD"]
    pattern: '/portail/bulletins/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'portail.dossier': {
    methods: ["GET","HEAD"]
    pattern: '/portail/dossier'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'enseignant.classes': {
    methods: ["GET","HEAD"]
    pattern: '/enseignant/classes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['classes']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['classes']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['classes']>>>
    }
  }
  'enseignant.evaluations': {
    methods: ["GET","HEAD"]
    pattern: '/enseignant/evaluations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['index']>>>
    }
  }
  'enseignant.nouvelle_evaluation': {
    methods: ["GET","HEAD"]
    pattern: '/enseignant/evaluations/nouvelle'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['create']>>>
    }
  }
  'enseignant.evaluations.store': {
    methods: ["POST"]
    pattern: '/enseignant/evaluations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/notes').evaluationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/notes').evaluationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'enseignant.grille': {
    methods: ["GET","HEAD"]
    pattern: '/enseignant/evaluations/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['show']>>>
    }
  }
  'enseignant.evaluations.update': {
    methods: ["PUT"]
    pattern: '/enseignant/evaluations/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/notes').modifierEvaluationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/notes').modifierEvaluationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'enseignant.evaluations.notes': {
    methods: ["POST"]
    pattern: '/enseignant/evaluations/:id/notes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/notes').saisiesValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/notes').saisiesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['notes']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['notes']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['notes']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'enseignant.evaluations.soumettre': {
    methods: ["POST"]
    pattern: '/enseignant/evaluations/:id/soumettre'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['soumettre']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['soumettre']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/evaluations_controller').default['soumettre']>>>
    }
  }
  'enseignant.appreciations': {
    methods: ["GET","HEAD"]
    pattern: '/enseignant/appreciations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/appreciations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/appreciations_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/appreciations_controller').default['index']>>>
    }
  }
  'enseignant.appreciations.store': {
    methods: ["POST"]
    pattern: '/enseignant/appreciations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/notes').appreciationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/notes').appreciationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/appreciations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/appreciations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/appreciations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'enseignant.recapitulatif': {
    methods: ["GET","HEAD"]
    pattern: '/enseignant/recapitulatif'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/appreciations_controller').default['recapitulatif']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/appreciations_controller').default['recapitulatif']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/appreciations_controller').default['recapitulatif']>>>
    }
  }
  'direction.accueil': {
    methods: ["GET","HEAD"]
    pattern: '/direction'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'direction.validation': {
    methods: ["GET","HEAD"]
    pattern: '/direction/validation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['index']>>>
    }
  }
  'direction.evaluations.valider': {
    methods: ["POST"]
    pattern: '/direction/evaluations/:id/valider'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['valider']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['valider']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['valider']>>>
    }
  }
  'direction.evaluations.renvoyer': {
    methods: ["POST"]
    pattern: '/direction/evaluations/:id/renvoyer'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').motifValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').motifValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['renvoyer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['renvoyer']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['renvoyer']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'direction.evaluations.deverrouiller': {
    methods: ["POST"]
    pattern: '/direction/evaluations/:id/deverrouiller'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').motifValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').motifValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['deverrouiller']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['deverrouiller']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['deverrouiller']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'direction.suivi': {
    methods: ["GET","HEAD"]
    pattern: '/direction/suivi'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['suivi']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['suivi']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['suivi']>>>
    }
  }
  'direction.derogations.store': {
    methods: ["POST"]
    pattern: '/direction/derogations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/notes').derogationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/notes').derogationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['derogation']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['derogation']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/validation_evaluations_controller').default['derogation']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'direction.deliberation': {
    methods: ["GET","HEAD"]
    pattern: '/direction/deliberation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'direction.bulletins': {
    methods: ["GET","HEAD"]
    pattern: '/direction/bulletins'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'direction.inscriptions': {
    methods: ["GET","HEAD"]
    pattern: '/direction/inscriptions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/validation_inscriptions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/validation_inscriptions_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/validation_inscriptions_controller').default['index']>>>
    }
  }
  'direction.inscriptions.valider': {
    methods: ["POST"]
    pattern: '/direction/inscriptions/:id/valider'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').validerInscriptionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').validerInscriptionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/validation_inscriptions_controller').default['valider']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/validation_inscriptions_controller').default['valider']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/validation_inscriptions_controller').default['valider']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'direction.inscriptions.refuser': {
    methods: ["POST"]
    pattern: '/direction/inscriptions/:id/refuser'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').motifValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').motifValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/validation_inscriptions_controller').default['refuser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/validation_inscriptions_controller').default['refuser']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/validation_inscriptions_controller').default['refuser']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.eleves': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/eleves'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/scolarite').listeElevesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.fiche': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/eleves/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['show']>>>
    }
  }
  'scolarite.eleves.update': {
    methods: ["PUT"]
    pattern: '/scolarite/eleves/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').identiteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').identiteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.eleves.statut': {
    methods: ["POST"]
    pattern: '/scolarite/eleves/:id/statut'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').statutValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').statutValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['statut']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['statut']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['statut']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.eleves.reactiver': {
    methods: ["POST"]
    pattern: '/scolarite/eleves/:id/reactiver'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').motifValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').motifValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['reactiver']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['reactiver']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['reactiver']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.eleves.photo': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/eleves/:id/photo'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['photo']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['photo']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/eleves_controller').default['photo']>>>
    }
  }
  'scolarite.tuteurs.store': {
    methods: ["POST"]
    pattern: '/scolarite/eleves/:id/tuteurs'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').tuteurValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').tuteurValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.tuteurs.rattacher': {
    methods: ["POST"]
    pattern: '/scolarite/eleves/:id/tuteurs/:tuteurId/rattacher'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; tuteurId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['rattacher']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['rattacher']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['rattacher']>>>
    }
  }
  'scolarite.tuteurs.update': {
    methods: ["PUT"]
    pattern: '/scolarite/eleves/:id/tuteurs/:tuteurId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').tuteurValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; tuteurId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').tuteurValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.tuteurs.principal': {
    methods: ["PUT"]
    pattern: '/scolarite/eleves/:id/tuteurs/:tuteurId/principal'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; tuteurId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['principal']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['principal']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['principal']>>>
    }
  }
  'scolarite.tuteurs.detacher': {
    methods: ["DELETE"]
    pattern: '/scolarite/eleves/:id/tuteurs/:tuteurId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; tuteurId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['detacher']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['detacher']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['detacher']>>>
    }
  }
  'scolarite.tuteurs.acces': {
    methods: ["POST"]
    pattern: '/scolarite/eleves/:id/tuteurs/:tuteurId/acces'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').accesPortailValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; tuteurId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').accesPortailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['acces']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['acces']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tuteurs_controller').default['acces']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.inscription': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/inscription'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['create']>>>
    }
  }
  'scolarite.inscriptions.store': {
    methods: ["POST"]
    pattern: '/scolarite/inscriptions'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').dossierValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').dossierValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.inscriptions.fiche': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/inscriptions/:id/fiche'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['fiche']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['fiche']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['fiche']>>>
    }
  }
  'scolarite.inscriptions.soumettre': {
    methods: ["POST"]
    pattern: '/scolarite/inscriptions/:id/soumettre'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['soumettre']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['soumettre']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['soumettre']>>>
    }
  }
  'scolarite.inscriptions.annuler': {
    methods: ["POST"]
    pattern: '/scolarite/inscriptions/:id/annuler'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').motifValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').motifValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['annuler']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['annuler']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['annuler']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.inscriptions.piece': {
    methods: ["POST"]
    pattern: '/scolarite/inscriptions/:id/pieces/:type'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').pieceValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; type: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').pieceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['deposerPiece']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['deposerPiece']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['deposerPiece']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.inscriptions.changer_classe': {
    methods: ["POST"]
    pattern: '/scolarite/inscriptions/changer-classe'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').changerClasseValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').changerClasseValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['changerClasse']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['changerClasse']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['changerClasse']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.pieces.lire': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/pieces/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['lirePiece']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['lirePiece']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['lirePiece']>>>
    }
  }
  'scolarite.dossiers': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/dossiers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['dossiers']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['dossiers']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/inscriptions_controller').default['dossiers']>>>
    }
  }
  'scolarite.import': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/import'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['index']>>>
    }
  }
  'scolarite.import.modele': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/import/modele'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['modele']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['modele']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['modele']>>>
    }
  }
  'scolarite.import.analyser': {
    methods: ["POST"]
    pattern: '/scolarite/import'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').importValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').importValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['analyser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['analyser']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['analyser']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'scolarite.import.accepter': {
    methods: ["POST"]
    pattern: '/scolarite/import/:id/accepter'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['accepter']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['accepter']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['accepter']>>>
    }
  }
  'scolarite.import.abandonner': {
    methods: ["POST"]
    pattern: '/scolarite/import/:id/abandonner'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['abandonner']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['abandonner']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/imports_controller').default['abandonner']>>>
    }
  }
  'scolarite.documents.demander': {
    methods: ["POST"]
    pattern: '/scolarite/documents'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/scolarite').demandeDocumentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/scolarite').demandeDocumentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_generes_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/documents_generes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/documents_generes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'documents.index': {
    methods: ["GET","HEAD"]
    pattern: '/documents'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_generes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/documents_generes_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/documents_generes_controller').default['index']>>>
    }
  }
  'documents.telecharger': {
    methods: ["GET","HEAD"]
    pattern: '/documents/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_generes_controller').default['telecharger']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/documents_generes_controller').default['telecharger']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/documents_generes_controller').default['telecharger']>>>
    }
  }
  'admin.accueil': {
    methods: ["GET","HEAD"]
    pattern: '/admin'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_accueil_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_accueil_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_accueil_controller').default['index']>>>
    }
  }
  'admin.annees': {
    methods: ["GET","HEAD"]
    pattern: '/admin/annees'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['index']>>>
    }
  }
  'admin.annees.store': {
    methods: ["POST"]
    pattern: '/admin/annees'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').creerAnneeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').creerAnneeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.annees.activer': {
    methods: ["POST"]
    pattern: '/admin/annees/:id/activer'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['activer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['activer']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['activer']>>>
    }
  }
  'admin.annees.cloturer': {
    methods: ["POST"]
    pattern: '/admin/annees/:id/cloturer'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['cloturer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['cloturer']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['cloturer']>>>
    }
  }
  'admin.annees.dupliquer': {
    methods: ["POST"]
    pattern: '/admin/annees/:id/dupliquer'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').dupliquerAnneeValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').dupliquerAnneeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['dupliquer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['dupliquer']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['dupliquer']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.periodes.update': {
    methods: ["PUT"]
    pattern: '/admin/periodes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').periodeValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').periodeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['updatePeriode']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['updatePeriode']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/annees_controller').default['updatePeriode']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.structure': {
    methods: ["GET","HEAD"]
    pattern: '/admin/structure'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['index']>>>
    }
  }
  'admin.niveaux.store': {
    methods: ["POST"]
    pattern: '/admin/niveaux'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').niveauValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').niveauValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['storeNiveau']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['storeNiveau']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['storeNiveau']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.matieres.store': {
    methods: ["POST"]
    pattern: '/admin/matieres'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').matiereValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').matiereValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['storeMatiere']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['storeMatiere']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['storeMatiere']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.coefficients': {
    methods: ["PUT"]
    pattern: '/admin/coefficients'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').coefficientValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').coefficientValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['updateCoefficient']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['updateCoefficient']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['updateCoefficient']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.programme.obligatoire': {
    methods: ["PUT"]
    pattern: '/admin/programme/obligatoire'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').obligatoireValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').obligatoireValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['updateObligatoire']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['updateObligatoire']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/structure_controller').default['updateObligatoire']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.etablissement': {
    methods: ["GET","HEAD"]
    pattern: '/admin/etablissement'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/etablissement_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/etablissement_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/etablissement_controller').default['edit']>>>
    }
  }
  'admin.etablissement.update': {
    methods: ["PUT"]
    pattern: '/admin/etablissement'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').etablissementValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').etablissementValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/etablissement_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/etablissement_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/etablissement_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.classes': {
    methods: ["GET","HEAD"]
    pattern: '/admin/classes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/classes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/classes_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/classes_controller').default['index']>>>
    }
  }
  'admin.classes.store': {
    methods: ["POST"]
    pattern: '/admin/annees/:anneeId/classes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').classeValidator)>>
      paramsTuple: [ParamValue]
      params: { anneeId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').classeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/classes_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/classes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/classes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.classes.update': {
    methods: ["PUT"]
    pattern: '/admin/classes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').classeValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').classeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/classes_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/classes_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/classes_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.affectations': {
    methods: ["GET","HEAD"]
    pattern: '/admin/affectations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/affectations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/affectations_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/affectations_controller').default['index']>>>
    }
  }
  'admin.affectations.store': {
    methods: ["POST"]
    pattern: '/admin/annees/:anneeId/affectations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/structure').affectationValidator)>>
      paramsTuple: [ParamValue]
      params: { anneeId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/structure').affectationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/affectations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/affectations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/affectations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.affectations.destroy': {
    methods: ["DELETE"]
    pattern: '/admin/affectations/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/affectations_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/affectations_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/affectations_controller').default['destroy']>>>
    }
  }
  'admin.comptes': {
    methods: ["GET","HEAD"]
    pattern: '/admin/comptes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['index']>>>
    }
  }
  'admin.comptes.store': {
    methods: ["POST"]
    pattern: '/admin/comptes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').creerCompteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').creerCompteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.comptes.roles': {
    methods: ["PUT"]
    pattern: '/admin/comptes/:id/roles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').rolesCompteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user').rolesCompteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['updateRoles']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['updateRoles']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['updateRoles']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.comptes.activation': {
    methods: ["PUT"]
    pattern: '/admin/comptes/:id/activation'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').activationCompteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user').activationCompteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['updateActivation']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['updateActivation']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/comptes_controller').default['updateActivation']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.journal': {
    methods: ["GET","HEAD"]
    pattern: '/admin/journal'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/journal_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/journal_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/journal_controller').default['index']>>>
    }
  }
}

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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
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
  'scolarite.eleves': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/eleves'
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
  'scolarite.fiche': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/eleves/:id'
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
  'scolarite.inscription': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/inscription'
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
  'scolarite.dossiers': {
    methods: ["GET","HEAD"]
    pattern: '/scolarite/dossiers'
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
  'admin.accueil': {
    methods: ["GET","HEAD"]
    pattern: '/admin'
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
  'admin.structure': {
    methods: ["GET","HEAD"]
    pattern: '/admin/structure'
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

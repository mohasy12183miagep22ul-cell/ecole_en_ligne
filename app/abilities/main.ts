/*
|--------------------------------------------------------------------------
| Capacités Bouncer
|--------------------------------------------------------------------------
|
| Capacités transverses, liées au rôle. Les droits sur une ressource précise
| (une classe, une évaluation, un élève) vivent dans app/policies, une
| policy par ressource, au fil des lots.
|
*/

import type User from '#models/user'
import { Bouncer } from '@adonisjs/bouncer'

/** Consulter le journal d'activité (RG22) : direction et administrateur. */
export const consulterJournal = Bouncer.ability(async (user: User) => {
  await user.load('rolesUtilisateur')
  return user.aLeRole('admin', 'direction')
})

/** Gérer les comptes et les rôles : administrateur uniquement. */
export const gererComptes = Bouncer.ability(async (user: User) => {
  await user.load('rolesUtilisateur')
  return user.aLeRole('admin')
})

/** Déverrouiller une évaluation validée (RG12) : chef d'établissement seul. */
export const deverrouillerEvaluation = Bouncer.ability(async (user: User) => {
  await user.load('rolesUtilisateur')
  return user.aLeRole('direction')
})

/**
 * Paramétrer la structure pédagogique (années, périodes, niveaux, matières,
 * coefficients, classes, affectations) : administrateur uniquement.
 */
export const gererStructure = Bouncer.ability(async (user: User) => {
  await user.load('rolesUtilisateur')
  return user.aLeRole('admin')
})

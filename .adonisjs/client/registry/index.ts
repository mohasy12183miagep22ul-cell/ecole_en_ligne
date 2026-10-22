/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['home']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.store']['types'],
  },
  'double_facteur.create': {
    methods: ["GET","HEAD"],
    pattern: '/connexion/verification',
    tokens: [[0,"connexion"],[0,"verification"]],
    types: placeholder as Registry['double_facteur.create']['types'],
  },
  'double_facteur.store': {
    methods: ["POST"],
    pattern: '/connexion/verification',
    tokens: [[0,"connexion"],[0,"verification"]],
    types: placeholder as Registry['double_facteur.store']['types'],
  },
  'mot_de_passe_oublie.create': {
    methods: ["GET","HEAD"],
    pattern: '/mot-de-passe-oublie',
    tokens: [[0,"mot-de-passe-oublie"]],
    types: placeholder as Registry['mot_de_passe_oublie.create']['types'],
  },
  'double_facteur.renvoyer': {
    methods: ["POST"],
    pattern: '/connexion/verification/renvoyer',
    tokens: [[0,"connexion"],[0,"verification"],[0,"renvoyer"]],
    types: placeholder as Registry['double_facteur.renvoyer']['types'],
  },
  'mot_de_passe_oublie.store': {
    methods: ["POST"],
    pattern: '/mot-de-passe-oublie',
    tokens: [[0,"mot-de-passe-oublie"]],
    types: placeholder as Registry['mot_de_passe_oublie.store']['types'],
  },
  'reinitialisation.edit': {
    methods: ["GET","HEAD"],
    pattern: '/reinitialiser/:jeton',
    tokens: [[0,"reinitialiser"],[1,"jeton"]],
    types: placeholder as Registry['reinitialisation.edit']['types'],
  },
  'reinitialisation.update': {
    methods: ["POST"],
    pattern: '/reinitialiser/:jeton',
    tokens: [[0,"reinitialiser"],[1,"jeton"]],
    types: placeholder as Registry['reinitialisation.update']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [[0,"logout"]],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'profil': {
    methods: ["GET","HEAD"],
    pattern: '/profil',
    tokens: [[0,"profil"]],
    types: placeholder as Registry['profil']['types'],
  },
  'profil.mot_de_passe': {
    methods: ["POST"],
    pattern: '/profil/mot-de-passe',
    tokens: [[0,"profil"],[0,"mot-de-passe"]],
    types: placeholder as Registry['profil.mot_de_passe']['types'],
  },
  'portail.accueil': {
    methods: ["GET","HEAD"],
    pattern: '/portail',
    tokens: [[0,"portail"]],
    types: placeholder as Registry['portail.accueil']['types'],
  },
  'portail.notes': {
    methods: ["GET","HEAD"],
    pattern: '/portail/notes',
    tokens: [[0,"portail"],[0,"notes"]],
    types: placeholder as Registry['portail.notes']['types'],
  },
  'portail.bulletins': {
    methods: ["GET","HEAD"],
    pattern: '/portail/bulletins',
    tokens: [[0,"portail"],[0,"bulletins"]],
    types: placeholder as Registry['portail.bulletins']['types'],
  },
  'portail.bulletin': {
    methods: ["GET","HEAD"],
    pattern: '/portail/bulletins/:id',
    tokens: [[0,"portail"],[0,"bulletins"],[1,"id"]],
    types: placeholder as Registry['portail.bulletin']['types'],
  },
  'portail.dossier': {
    methods: ["GET","HEAD"],
    pattern: '/portail/dossier',
    tokens: [[0,"portail"],[0,"dossier"]],
    types: placeholder as Registry['portail.dossier']['types'],
  },
  'enseignant.classes': {
    methods: ["GET","HEAD"],
    pattern: '/enseignant/classes',
    tokens: [[0,"enseignant"],[0,"classes"]],
    types: placeholder as Registry['enseignant.classes']['types'],
  },
  'enseignant.evaluations': {
    methods: ["GET","HEAD"],
    pattern: '/enseignant/evaluations',
    tokens: [[0,"enseignant"],[0,"evaluations"]],
    types: placeholder as Registry['enseignant.evaluations']['types'],
  },
  'enseignant.nouvelle_evaluation': {
    methods: ["GET","HEAD"],
    pattern: '/enseignant/evaluations/nouvelle',
    tokens: [[0,"enseignant"],[0,"evaluations"],[0,"nouvelle"]],
    types: placeholder as Registry['enseignant.nouvelle_evaluation']['types'],
  },
  'enseignant.grille': {
    methods: ["GET","HEAD"],
    pattern: '/enseignant/evaluations/:id',
    tokens: [[0,"enseignant"],[0,"evaluations"],[1,"id"]],
    types: placeholder as Registry['enseignant.grille']['types'],
  },
  'enseignant.appreciations': {
    methods: ["GET","HEAD"],
    pattern: '/enseignant/appreciations',
    tokens: [[0,"enseignant"],[0,"appreciations"]],
    types: placeholder as Registry['enseignant.appreciations']['types'],
  },
  'enseignant.recapitulatif': {
    methods: ["GET","HEAD"],
    pattern: '/enseignant/recapitulatif',
    tokens: [[0,"enseignant"],[0,"recapitulatif"]],
    types: placeholder as Registry['enseignant.recapitulatif']['types'],
  },
  'direction.accueil': {
    methods: ["GET","HEAD"],
    pattern: '/direction',
    tokens: [[0,"direction"]],
    types: placeholder as Registry['direction.accueil']['types'],
  },
  'direction.validation': {
    methods: ["GET","HEAD"],
    pattern: '/direction/validation',
    tokens: [[0,"direction"],[0,"validation"]],
    types: placeholder as Registry['direction.validation']['types'],
  },
  'direction.deliberation': {
    methods: ["GET","HEAD"],
    pattern: '/direction/deliberation',
    tokens: [[0,"direction"],[0,"deliberation"]],
    types: placeholder as Registry['direction.deliberation']['types'],
  },
  'direction.bulletins': {
    methods: ["GET","HEAD"],
    pattern: '/direction/bulletins',
    tokens: [[0,"direction"],[0,"bulletins"]],
    types: placeholder as Registry['direction.bulletins']['types'],
  },
  'scolarite.eleves': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/eleves',
    tokens: [[0,"scolarite"],[0,"eleves"]],
    types: placeholder as Registry['scolarite.eleves']['types'],
  },
  'scolarite.fiche': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/eleves/:id',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"]],
    types: placeholder as Registry['scolarite.fiche']['types'],
  },
  'scolarite.inscription': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/inscription',
    tokens: [[0,"scolarite"],[0,"inscription"]],
    types: placeholder as Registry['scolarite.inscription']['types'],
  },
  'scolarite.dossiers': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/dossiers',
    tokens: [[0,"scolarite"],[0,"dossiers"]],
    types: placeholder as Registry['scolarite.dossiers']['types'],
  },
  'admin.accueil': {
    methods: ["GET","HEAD"],
    pattern: '/admin',
    tokens: [[0,"admin"]],
    types: placeholder as Registry['admin.accueil']['types'],
  },
  'admin.annees': {
    methods: ["GET","HEAD"],
    pattern: '/admin/annees',
    tokens: [[0,"admin"],[0,"annees"]],
    types: placeholder as Registry['admin.annees']['types'],
  },
  'admin.annees.store': {
    methods: ["POST"],
    pattern: '/admin/annees',
    tokens: [[0,"admin"],[0,"annees"]],
    types: placeholder as Registry['admin.annees.store']['types'],
  },
  'admin.annees.activer': {
    methods: ["POST"],
    pattern: '/admin/annees/:id/activer',
    tokens: [[0,"admin"],[0,"annees"],[1,"id"],[0,"activer"]],
    types: placeholder as Registry['admin.annees.activer']['types'],
  },
  'admin.annees.cloturer': {
    methods: ["POST"],
    pattern: '/admin/annees/:id/cloturer',
    tokens: [[0,"admin"],[0,"annees"],[1,"id"],[0,"cloturer"]],
    types: placeholder as Registry['admin.annees.cloturer']['types'],
  },
  'admin.annees.dupliquer': {
    methods: ["POST"],
    pattern: '/admin/annees/:id/dupliquer',
    tokens: [[0,"admin"],[0,"annees"],[1,"id"],[0,"dupliquer"]],
    types: placeholder as Registry['admin.annees.dupliquer']['types'],
  },
  'admin.periodes.update': {
    methods: ["PUT"],
    pattern: '/admin/periodes/:id',
    tokens: [[0,"admin"],[0,"periodes"],[1,"id"]],
    types: placeholder as Registry['admin.periodes.update']['types'],
  },
  'admin.structure': {
    methods: ["GET","HEAD"],
    pattern: '/admin/structure',
    tokens: [[0,"admin"],[0,"structure"]],
    types: placeholder as Registry['admin.structure']['types'],
  },
  'admin.niveaux.store': {
    methods: ["POST"],
    pattern: '/admin/niveaux',
    tokens: [[0,"admin"],[0,"niveaux"]],
    types: placeholder as Registry['admin.niveaux.store']['types'],
  },
  'admin.matieres.store': {
    methods: ["POST"],
    pattern: '/admin/matieres',
    tokens: [[0,"admin"],[0,"matieres"]],
    types: placeholder as Registry['admin.matieres.store']['types'],
  },
  'admin.coefficients': {
    methods: ["PUT"],
    pattern: '/admin/coefficients',
    tokens: [[0,"admin"],[0,"coefficients"]],
    types: placeholder as Registry['admin.coefficients']['types'],
  },
  'admin.classes': {
    methods: ["GET","HEAD"],
    pattern: '/admin/classes',
    tokens: [[0,"admin"],[0,"classes"]],
    types: placeholder as Registry['admin.classes']['types'],
  },
  'admin.classes.store': {
    methods: ["POST"],
    pattern: '/admin/annees/:anneeId/classes',
    tokens: [[0,"admin"],[0,"annees"],[1,"anneeId"],[0,"classes"]],
    types: placeholder as Registry['admin.classes.store']['types'],
  },
  'admin.classes.update': {
    methods: ["PUT"],
    pattern: '/admin/classes/:id',
    tokens: [[0,"admin"],[0,"classes"],[1,"id"]],
    types: placeholder as Registry['admin.classes.update']['types'],
  },
  'admin.affectations': {
    methods: ["GET","HEAD"],
    pattern: '/admin/affectations',
    tokens: [[0,"admin"],[0,"affectations"]],
    types: placeholder as Registry['admin.affectations']['types'],
  },
  'admin.affectations.store': {
    methods: ["POST"],
    pattern: '/admin/annees/:anneeId/affectations',
    tokens: [[0,"admin"],[0,"annees"],[1,"anneeId"],[0,"affectations"]],
    types: placeholder as Registry['admin.affectations.store']['types'],
  },
  'admin.affectations.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/affectations/:id',
    tokens: [[0,"admin"],[0,"affectations"],[1,"id"]],
    types: placeholder as Registry['admin.affectations.destroy']['types'],
  },
  'admin.comptes': {
    methods: ["GET","HEAD"],
    pattern: '/admin/comptes',
    tokens: [[0,"admin"],[0,"comptes"]],
    types: placeholder as Registry['admin.comptes']['types'],
  },
  'admin.comptes.store': {
    methods: ["POST"],
    pattern: '/admin/comptes',
    tokens: [[0,"admin"],[0,"comptes"]],
    types: placeholder as Registry['admin.comptes.store']['types'],
  },
  'admin.comptes.roles': {
    methods: ["PUT"],
    pattern: '/admin/comptes/:id/roles',
    tokens: [[0,"admin"],[0,"comptes"],[1,"id"],[0,"roles"]],
    types: placeholder as Registry['admin.comptes.roles']['types'],
  },
  'admin.comptes.activation': {
    methods: ["PUT"],
    pattern: '/admin/comptes/:id/activation',
    tokens: [[0,"admin"],[0,"comptes"],[1,"id"],[0,"activation"]],
    types: placeholder as Registry['admin.comptes.activation']['types'],
  },
  'admin.journal': {
    methods: ["GET","HEAD"],
    pattern: '/admin/journal',
    tokens: [[0,"admin"],[0,"journal"]],
    types: placeholder as Registry['admin.journal']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}

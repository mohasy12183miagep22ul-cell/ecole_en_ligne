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
  'direction.inscriptions': {
    methods: ["GET","HEAD"],
    pattern: '/direction/inscriptions',
    tokens: [[0,"direction"],[0,"inscriptions"]],
    types: placeholder as Registry['direction.inscriptions']['types'],
  },
  'direction.inscriptions.valider': {
    methods: ["POST"],
    pattern: '/direction/inscriptions/:id/valider',
    tokens: [[0,"direction"],[0,"inscriptions"],[1,"id"],[0,"valider"]],
    types: placeholder as Registry['direction.inscriptions.valider']['types'],
  },
  'direction.inscriptions.refuser': {
    methods: ["POST"],
    pattern: '/direction/inscriptions/:id/refuser',
    tokens: [[0,"direction"],[0,"inscriptions"],[1,"id"],[0,"refuser"]],
    types: placeholder as Registry['direction.inscriptions.refuser']['types'],
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
  'scolarite.eleves.update': {
    methods: ["PUT"],
    pattern: '/scolarite/eleves/:id',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"]],
    types: placeholder as Registry['scolarite.eleves.update']['types'],
  },
  'scolarite.eleves.statut': {
    methods: ["POST"],
    pattern: '/scolarite/eleves/:id/statut',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"],[0,"statut"]],
    types: placeholder as Registry['scolarite.eleves.statut']['types'],
  },
  'scolarite.eleves.reactiver': {
    methods: ["POST"],
    pattern: '/scolarite/eleves/:id/reactiver',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"],[0,"reactiver"]],
    types: placeholder as Registry['scolarite.eleves.reactiver']['types'],
  },
  'scolarite.eleves.photo': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/eleves/:id/photo',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"],[0,"photo"]],
    types: placeholder as Registry['scolarite.eleves.photo']['types'],
  },
  'scolarite.tuteurs.store': {
    methods: ["POST"],
    pattern: '/scolarite/eleves/:id/tuteurs',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"],[0,"tuteurs"]],
    types: placeholder as Registry['scolarite.tuteurs.store']['types'],
  },
  'scolarite.tuteurs.rattacher': {
    methods: ["POST"],
    pattern: '/scolarite/eleves/:id/tuteurs/:tuteurId/rattacher',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"],[0,"tuteurs"],[1,"tuteurId"],[0,"rattacher"]],
    types: placeholder as Registry['scolarite.tuteurs.rattacher']['types'],
  },
  'scolarite.tuteurs.update': {
    methods: ["PUT"],
    pattern: '/scolarite/eleves/:id/tuteurs/:tuteurId',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"],[0,"tuteurs"],[1,"tuteurId"]],
    types: placeholder as Registry['scolarite.tuteurs.update']['types'],
  },
  'scolarite.tuteurs.principal': {
    methods: ["PUT"],
    pattern: '/scolarite/eleves/:id/tuteurs/:tuteurId/principal',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"],[0,"tuteurs"],[1,"tuteurId"],[0,"principal"]],
    types: placeholder as Registry['scolarite.tuteurs.principal']['types'],
  },
  'scolarite.tuteurs.detacher': {
    methods: ["DELETE"],
    pattern: '/scolarite/eleves/:id/tuteurs/:tuteurId',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"],[0,"tuteurs"],[1,"tuteurId"]],
    types: placeholder as Registry['scolarite.tuteurs.detacher']['types'],
  },
  'scolarite.tuteurs.acces': {
    methods: ["POST"],
    pattern: '/scolarite/eleves/:id/tuteurs/:tuteurId/acces',
    tokens: [[0,"scolarite"],[0,"eleves"],[1,"id"],[0,"tuteurs"],[1,"tuteurId"],[0,"acces"]],
    types: placeholder as Registry['scolarite.tuteurs.acces']['types'],
  },
  'scolarite.inscription': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/inscription',
    tokens: [[0,"scolarite"],[0,"inscription"]],
    types: placeholder as Registry['scolarite.inscription']['types'],
  },
  'scolarite.inscriptions.store': {
    methods: ["POST"],
    pattern: '/scolarite/inscriptions',
    tokens: [[0,"scolarite"],[0,"inscriptions"]],
    types: placeholder as Registry['scolarite.inscriptions.store']['types'],
  },
  'scolarite.inscriptions.fiche': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/inscriptions/:id/fiche',
    tokens: [[0,"scolarite"],[0,"inscriptions"],[1,"id"],[0,"fiche"]],
    types: placeholder as Registry['scolarite.inscriptions.fiche']['types'],
  },
  'scolarite.inscriptions.soumettre': {
    methods: ["POST"],
    pattern: '/scolarite/inscriptions/:id/soumettre',
    tokens: [[0,"scolarite"],[0,"inscriptions"],[1,"id"],[0,"soumettre"]],
    types: placeholder as Registry['scolarite.inscriptions.soumettre']['types'],
  },
  'scolarite.inscriptions.annuler': {
    methods: ["POST"],
    pattern: '/scolarite/inscriptions/:id/annuler',
    tokens: [[0,"scolarite"],[0,"inscriptions"],[1,"id"],[0,"annuler"]],
    types: placeholder as Registry['scolarite.inscriptions.annuler']['types'],
  },
  'scolarite.inscriptions.piece': {
    methods: ["POST"],
    pattern: '/scolarite/inscriptions/:id/pieces/:type',
    tokens: [[0,"scolarite"],[0,"inscriptions"],[1,"id"],[0,"pieces"],[1,"type"]],
    types: placeholder as Registry['scolarite.inscriptions.piece']['types'],
  },
  'scolarite.inscriptions.changer_classe': {
    methods: ["POST"],
    pattern: '/scolarite/inscriptions/changer-classe',
    tokens: [[0,"scolarite"],[0,"inscriptions"],[0,"changer-classe"]],
    types: placeholder as Registry['scolarite.inscriptions.changer_classe']['types'],
  },
  'scolarite.pieces.lire': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/pieces/:id',
    tokens: [[0,"scolarite"],[0,"pieces"],[1,"id"]],
    types: placeholder as Registry['scolarite.pieces.lire']['types'],
  },
  'scolarite.dossiers': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/dossiers',
    tokens: [[0,"scolarite"],[0,"dossiers"]],
    types: placeholder as Registry['scolarite.dossiers']['types'],
  },
  'scolarite.import': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/import',
    tokens: [[0,"scolarite"],[0,"import"]],
    types: placeholder as Registry['scolarite.import']['types'],
  },
  'scolarite.import.modele': {
    methods: ["GET","HEAD"],
    pattern: '/scolarite/import/modele',
    tokens: [[0,"scolarite"],[0,"import"],[0,"modele"]],
    types: placeholder as Registry['scolarite.import.modele']['types'],
  },
  'scolarite.import.analyser': {
    methods: ["POST"],
    pattern: '/scolarite/import',
    tokens: [[0,"scolarite"],[0,"import"]],
    types: placeholder as Registry['scolarite.import.analyser']['types'],
  },
  'scolarite.import.accepter': {
    methods: ["POST"],
    pattern: '/scolarite/import/:id/accepter',
    tokens: [[0,"scolarite"],[0,"import"],[1,"id"],[0,"accepter"]],
    types: placeholder as Registry['scolarite.import.accepter']['types'],
  },
  'scolarite.import.abandonner': {
    methods: ["POST"],
    pattern: '/scolarite/import/:id/abandonner',
    tokens: [[0,"scolarite"],[0,"import"],[1,"id"],[0,"abandonner"]],
    types: placeholder as Registry['scolarite.import.abandonner']['types'],
  },
  'scolarite.documents.demander': {
    methods: ["POST"],
    pattern: '/scolarite/documents',
    tokens: [[0,"scolarite"],[0,"documents"]],
    types: placeholder as Registry['scolarite.documents.demander']['types'],
  },
  'documents.index': {
    methods: ["GET","HEAD"],
    pattern: '/documents',
    tokens: [[0,"documents"]],
    types: placeholder as Registry['documents.index']['types'],
  },
  'documents.telecharger': {
    methods: ["GET","HEAD"],
    pattern: '/documents/:id',
    tokens: [[0,"documents"],[1,"id"]],
    types: placeholder as Registry['documents.telecharger']['types'],
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
  'admin.programme.obligatoire': {
    methods: ["PUT"],
    pattern: '/admin/programme/obligatoire',
    tokens: [[0,"admin"],[0,"programme"],[0,"obligatoire"]],
    types: placeholder as Registry['admin.programme.obligatoire']['types'],
  },
  'admin.etablissement': {
    methods: ["GET","HEAD"],
    pattern: '/admin/etablissement',
    tokens: [[0,"admin"],[0,"etablissement"]],
    types: placeholder as Registry['admin.etablissement']['types'],
  },
  'admin.etablissement.update': {
    methods: ["PUT"],
    pattern: '/admin/etablissement',
    tokens: [[0,"admin"],[0,"etablissement"]],
    types: placeholder as Registry['admin.etablissement.update']['types'],
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

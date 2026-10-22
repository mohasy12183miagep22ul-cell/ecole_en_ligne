import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'double_facteur.create': { paramsTuple?: []; params?: {} }
    'double_facteur.store': { paramsTuple?: []; params?: {} }
    'mot_de_passe_oublie.create': { paramsTuple?: []; params?: {} }
    'double_facteur.renvoyer': { paramsTuple?: []; params?: {} }
    'mot_de_passe_oublie.store': { paramsTuple?: []; params?: {} }
    'reinitialisation.edit': { paramsTuple: [ParamValue]; params: {'jeton': ParamValue} }
    'reinitialisation.update': { paramsTuple: [ParamValue]; params: {'jeton': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'profil': { paramsTuple?: []; params?: {} }
    'profil.mot_de_passe': { paramsTuple?: []; params?: {} }
    'portail.accueil': { paramsTuple?: []; params?: {} }
    'portail.notes': { paramsTuple?: []; params?: {} }
    'portail.bulletins': { paramsTuple?: []; params?: {} }
    'portail.bulletin': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'portail.dossier': { paramsTuple?: []; params?: {} }
    'enseignant.classes': { paramsTuple?: []; params?: {} }
    'enseignant.evaluations': { paramsTuple?: []; params?: {} }
    'enseignant.nouvelle_evaluation': { paramsTuple?: []; params?: {} }
    'enseignant.grille': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enseignant.appreciations': { paramsTuple?: []; params?: {} }
    'enseignant.recapitulatif': { paramsTuple?: []; params?: {} }
    'direction.accueil': { paramsTuple?: []; params?: {} }
    'direction.validation': { paramsTuple?: []; params?: {} }
    'direction.deliberation': { paramsTuple?: []; params?: {} }
    'direction.bulletins': { paramsTuple?: []; params?: {} }
    'scolarite.eleves': { paramsTuple?: []; params?: {} }
    'scolarite.fiche': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.inscription': { paramsTuple?: []; params?: {} }
    'scolarite.dossiers': { paramsTuple?: []; params?: {} }
    'admin.accueil': { paramsTuple?: []; params?: {} }
    'admin.annees': { paramsTuple?: []; params?: {} }
    'admin.annees.store': { paramsTuple?: []; params?: {} }
    'admin.annees.activer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.annees.cloturer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.annees.dupliquer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.periodes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.structure': { paramsTuple?: []; params?: {} }
    'admin.niveaux.store': { paramsTuple?: []; params?: {} }
    'admin.matieres.store': { paramsTuple?: []; params?: {} }
    'admin.coefficients': { paramsTuple?: []; params?: {} }
    'admin.classes': { paramsTuple?: []; params?: {} }
    'admin.classes.store': { paramsTuple: [ParamValue]; params: {'anneeId': ParamValue} }
    'admin.classes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.affectations': { paramsTuple?: []; params?: {} }
    'admin.affectations.store': { paramsTuple: [ParamValue]; params: {'anneeId': ParamValue} }
    'admin.affectations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.comptes': { paramsTuple?: []; params?: {} }
    'admin.comptes.store': { paramsTuple?: []; params?: {} }
    'admin.comptes.roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.comptes.activation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.journal': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'double_facteur.create': { paramsTuple?: []; params?: {} }
    'mot_de_passe_oublie.create': { paramsTuple?: []; params?: {} }
    'reinitialisation.edit': { paramsTuple: [ParamValue]; params: {'jeton': ParamValue} }
    'profil': { paramsTuple?: []; params?: {} }
    'portail.accueil': { paramsTuple?: []; params?: {} }
    'portail.notes': { paramsTuple?: []; params?: {} }
    'portail.bulletins': { paramsTuple?: []; params?: {} }
    'portail.bulletin': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'portail.dossier': { paramsTuple?: []; params?: {} }
    'enseignant.classes': { paramsTuple?: []; params?: {} }
    'enseignant.evaluations': { paramsTuple?: []; params?: {} }
    'enseignant.nouvelle_evaluation': { paramsTuple?: []; params?: {} }
    'enseignant.grille': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enseignant.appreciations': { paramsTuple?: []; params?: {} }
    'enseignant.recapitulatif': { paramsTuple?: []; params?: {} }
    'direction.accueil': { paramsTuple?: []; params?: {} }
    'direction.validation': { paramsTuple?: []; params?: {} }
    'direction.deliberation': { paramsTuple?: []; params?: {} }
    'direction.bulletins': { paramsTuple?: []; params?: {} }
    'scolarite.eleves': { paramsTuple?: []; params?: {} }
    'scolarite.fiche': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.inscription': { paramsTuple?: []; params?: {} }
    'scolarite.dossiers': { paramsTuple?: []; params?: {} }
    'admin.accueil': { paramsTuple?: []; params?: {} }
    'admin.annees': { paramsTuple?: []; params?: {} }
    'admin.structure': { paramsTuple?: []; params?: {} }
    'admin.classes': { paramsTuple?: []; params?: {} }
    'admin.affectations': { paramsTuple?: []; params?: {} }
    'admin.comptes': { paramsTuple?: []; params?: {} }
    'admin.journal': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'double_facteur.create': { paramsTuple?: []; params?: {} }
    'mot_de_passe_oublie.create': { paramsTuple?: []; params?: {} }
    'reinitialisation.edit': { paramsTuple: [ParamValue]; params: {'jeton': ParamValue} }
    'profil': { paramsTuple?: []; params?: {} }
    'portail.accueil': { paramsTuple?: []; params?: {} }
    'portail.notes': { paramsTuple?: []; params?: {} }
    'portail.bulletins': { paramsTuple?: []; params?: {} }
    'portail.bulletin': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'portail.dossier': { paramsTuple?: []; params?: {} }
    'enseignant.classes': { paramsTuple?: []; params?: {} }
    'enseignant.evaluations': { paramsTuple?: []; params?: {} }
    'enseignant.nouvelle_evaluation': { paramsTuple?: []; params?: {} }
    'enseignant.grille': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enseignant.appreciations': { paramsTuple?: []; params?: {} }
    'enseignant.recapitulatif': { paramsTuple?: []; params?: {} }
    'direction.accueil': { paramsTuple?: []; params?: {} }
    'direction.validation': { paramsTuple?: []; params?: {} }
    'direction.deliberation': { paramsTuple?: []; params?: {} }
    'direction.bulletins': { paramsTuple?: []; params?: {} }
    'scolarite.eleves': { paramsTuple?: []; params?: {} }
    'scolarite.fiche': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.inscription': { paramsTuple?: []; params?: {} }
    'scolarite.dossiers': { paramsTuple?: []; params?: {} }
    'admin.accueil': { paramsTuple?: []; params?: {} }
    'admin.annees': { paramsTuple?: []; params?: {} }
    'admin.structure': { paramsTuple?: []; params?: {} }
    'admin.classes': { paramsTuple?: []; params?: {} }
    'admin.affectations': { paramsTuple?: []; params?: {} }
    'admin.comptes': { paramsTuple?: []; params?: {} }
    'admin.journal': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'double_facteur.store': { paramsTuple?: []; params?: {} }
    'double_facteur.renvoyer': { paramsTuple?: []; params?: {} }
    'mot_de_passe_oublie.store': { paramsTuple?: []; params?: {} }
    'reinitialisation.update': { paramsTuple: [ParamValue]; params: {'jeton': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'profil.mot_de_passe': { paramsTuple?: []; params?: {} }
    'admin.annees.store': { paramsTuple?: []; params?: {} }
    'admin.annees.activer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.annees.cloturer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.annees.dupliquer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.niveaux.store': { paramsTuple?: []; params?: {} }
    'admin.matieres.store': { paramsTuple?: []; params?: {} }
    'admin.classes.store': { paramsTuple: [ParamValue]; params: {'anneeId': ParamValue} }
    'admin.affectations.store': { paramsTuple: [ParamValue]; params: {'anneeId': ParamValue} }
    'admin.comptes.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'admin.periodes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.coefficients': { paramsTuple?: []; params?: {} }
    'admin.classes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.comptes.roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.comptes.activation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'admin.affectations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
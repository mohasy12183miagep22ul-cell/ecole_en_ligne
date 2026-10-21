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
    'admin.structure': { paramsTuple?: []; params?: {} }
    'admin.comptes': { paramsTuple?: []; params?: {} }
    'admin.journal': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'double_facteur.create': { paramsTuple?: []; params?: {} }
    'mot_de_passe_oublie.create': { paramsTuple?: []; params?: {} }
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
    'admin.structure': { paramsTuple?: []; params?: {} }
    'admin.comptes': { paramsTuple?: []; params?: {} }
    'admin.journal': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'double_facteur.create': { paramsTuple?: []; params?: {} }
    'mot_de_passe_oublie.create': { paramsTuple?: []; params?: {} }
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
    'admin.structure': { paramsTuple?: []; params?: {} }
    'admin.comptes': { paramsTuple?: []; params?: {} }
    'admin.journal': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'double_facteur.store': { paramsTuple?: []; params?: {} }
    'double_facteur.renvoyer': { paramsTuple?: []; params?: {} }
    'mot_de_passe_oublie.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'profil.mot_de_passe': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
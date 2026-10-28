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
    'enseignant.evaluations.store': { paramsTuple?: []; params?: {} }
    'enseignant.grille': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enseignant.evaluations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enseignant.evaluations.notes': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enseignant.evaluations.soumettre': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enseignant.appreciations': { paramsTuple?: []; params?: {} }
    'enseignant.appreciations.store': { paramsTuple?: []; params?: {} }
    'enseignant.recapitulatif': { paramsTuple?: []; params?: {} }
    'direction.accueil': { paramsTuple?: []; params?: {} }
    'direction.validation': { paramsTuple?: []; params?: {} }
    'direction.evaluations.valider': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'direction.evaluations.renvoyer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'direction.evaluations.deverrouiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'direction.suivi': { paramsTuple?: []; params?: {} }
    'direction.derogations.store': { paramsTuple?: []; params?: {} }
    'direction.deliberation': { paramsTuple?: []; params?: {} }
    'direction.bulletins': { paramsTuple?: []; params?: {} }
    'direction.inscriptions': { paramsTuple?: []; params?: {} }
    'direction.inscriptions.valider': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'direction.inscriptions.refuser': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.eleves': { paramsTuple?: []; params?: {} }
    'scolarite.fiche': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.eleves.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.eleves.statut': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.eleves.reactiver': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.eleves.photo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.tuteurs.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.tuteurs.rattacher': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'tuteurId': ParamValue} }
    'scolarite.tuteurs.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'tuteurId': ParamValue} }
    'scolarite.tuteurs.principal': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'tuteurId': ParamValue} }
    'scolarite.tuteurs.detacher': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'tuteurId': ParamValue} }
    'scolarite.tuteurs.acces': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'tuteurId': ParamValue} }
    'scolarite.inscription': { paramsTuple?: []; params?: {} }
    'scolarite.inscriptions.store': { paramsTuple?: []; params?: {} }
    'scolarite.inscriptions.fiche': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.inscriptions.soumettre': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.inscriptions.annuler': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.inscriptions.piece': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'scolarite.inscriptions.changer_classe': { paramsTuple?: []; params?: {} }
    'scolarite.pieces.lire': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.dossiers': { paramsTuple?: []; params?: {} }
    'scolarite.import': { paramsTuple?: []; params?: {} }
    'scolarite.import.modele': { paramsTuple?: []; params?: {} }
    'scolarite.import.analyser': { paramsTuple?: []; params?: {} }
    'scolarite.import.accepter': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.import.abandonner': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.documents.demander': { paramsTuple?: []; params?: {} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'documents.telecharger': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'admin.programme.obligatoire': { paramsTuple?: []; params?: {} }
    'admin.etablissement': { paramsTuple?: []; params?: {} }
    'admin.etablissement.update': { paramsTuple?: []; params?: {} }
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
    'api.sante': { paramsTuple?: []; params?: {} }
    'api.health': { paramsTuple?: []; params?: {} }
    'api.auth.connexion': { paramsTuple?: []; params?: {} }
    'api.auth.verification': { paramsTuple?: []; params?: {} }
    'api.auth.verification.renvoyer': { paramsTuple?: []; params?: {} }
    'api.auth.mot_de_passe_oublie': { paramsTuple?: []; params?: {} }
    'api.auth.deconnexion': { paramsTuple?: []; params?: {} }
    'api.moi': { paramsTuple?: []; params?: {} }
    'api.moi.mot_de_passe': { paramsTuple?: []; params?: {} }
    'api.enseignant.affectations': { paramsTuple?: []; params?: {} }
    'api.enseignant.periodes': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.types': { paramsTuple?: []; params?: {} }
    'api.enseignant.evaluations': { paramsTuple?: []; params?: {} }
    'api.enseignant.evaluations.store': { paramsTuple?: []; params?: {} }
    'api.enseignant.evaluations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.evaluations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.evaluations.notes': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.evaluations.soumettre': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.appreciations': { paramsTuple?: []; params?: {} }
    'api.enseignant.appreciations.store': { paramsTuple?: []; params?: {} }
    'api.enseignant.recapitulatif': { paramsTuple?: []; params?: {} }
    'api.direction.evaluations': { paramsTuple?: []; params?: {} }
    'api.direction.evaluations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.evaluations.valider': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.evaluations.renvoyer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.evaluations.deverrouiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.suivi': { paramsTuple?: []; params?: {} }
    'api.direction.derogations.store': { paramsTuple?: []; params?: {} }
    'api.direction.inscriptions': { paramsTuple?: []; params?: {} }
    'api.direction.inscriptions.valider': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.inscriptions.refuser': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.admin.accueil': { paramsTuple?: []; params?: {} }
    'api.admin.annees': { paramsTuple?: []; params?: {} }
    'api.admin.structure': { paramsTuple?: []; params?: {} }
    'api.admin.etablissement': { paramsTuple?: []; params?: {} }
    'api.admin.classes': { paramsTuple?: []; params?: {} }
    'api.admin.affectations': { paramsTuple?: []; params?: {} }
    'api.admin.comptes': { paramsTuple?: []; params?: {} }
    'api.admin.journal': { paramsTuple?: []; params?: {} }
    'api.documents.index': { paramsTuple?: []; params?: {} }
    'api.documents.telecharger': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.portail.enfants': { paramsTuple?: []; params?: {} }
    'api.portail.enfant': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.introuvable': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
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
    'direction.suivi': { paramsTuple?: []; params?: {} }
    'direction.deliberation': { paramsTuple?: []; params?: {} }
    'direction.bulletins': { paramsTuple?: []; params?: {} }
    'direction.inscriptions': { paramsTuple?: []; params?: {} }
    'scolarite.eleves': { paramsTuple?: []; params?: {} }
    'scolarite.fiche': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.eleves.photo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.inscription': { paramsTuple?: []; params?: {} }
    'scolarite.inscriptions.fiche': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.pieces.lire': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.dossiers': { paramsTuple?: []; params?: {} }
    'scolarite.import': { paramsTuple?: []; params?: {} }
    'scolarite.import.modele': { paramsTuple?: []; params?: {} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'documents.telecharger': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.accueil': { paramsTuple?: []; params?: {} }
    'admin.annees': { paramsTuple?: []; params?: {} }
    'admin.structure': { paramsTuple?: []; params?: {} }
    'admin.etablissement': { paramsTuple?: []; params?: {} }
    'admin.classes': { paramsTuple?: []; params?: {} }
    'admin.affectations': { paramsTuple?: []; params?: {} }
    'admin.comptes': { paramsTuple?: []; params?: {} }
    'admin.journal': { paramsTuple?: []; params?: {} }
    'api.sante': { paramsTuple?: []; params?: {} }
    'api.health': { paramsTuple?: []; params?: {} }
    'api.moi': { paramsTuple?: []; params?: {} }
    'api.enseignant.affectations': { paramsTuple?: []; params?: {} }
    'api.enseignant.periodes': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.types': { paramsTuple?: []; params?: {} }
    'api.enseignant.evaluations': { paramsTuple?: []; params?: {} }
    'api.enseignant.evaluations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.appreciations': { paramsTuple?: []; params?: {} }
    'api.enseignant.recapitulatif': { paramsTuple?: []; params?: {} }
    'api.direction.evaluations': { paramsTuple?: []; params?: {} }
    'api.direction.evaluations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.suivi': { paramsTuple?: []; params?: {} }
    'api.direction.inscriptions': { paramsTuple?: []; params?: {} }
    'api.admin.accueil': { paramsTuple?: []; params?: {} }
    'api.admin.annees': { paramsTuple?: []; params?: {} }
    'api.admin.structure': { paramsTuple?: []; params?: {} }
    'api.admin.etablissement': { paramsTuple?: []; params?: {} }
    'api.admin.classes': { paramsTuple?: []; params?: {} }
    'api.admin.affectations': { paramsTuple?: []; params?: {} }
    'api.admin.comptes': { paramsTuple?: []; params?: {} }
    'api.admin.journal': { paramsTuple?: []; params?: {} }
    'api.documents.index': { paramsTuple?: []; params?: {} }
    'api.documents.telecharger': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.portail.enfants': { paramsTuple?: []; params?: {} }
    'api.portail.enfant': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.introuvable': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
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
    'direction.suivi': { paramsTuple?: []; params?: {} }
    'direction.deliberation': { paramsTuple?: []; params?: {} }
    'direction.bulletins': { paramsTuple?: []; params?: {} }
    'direction.inscriptions': { paramsTuple?: []; params?: {} }
    'scolarite.eleves': { paramsTuple?: []; params?: {} }
    'scolarite.fiche': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.eleves.photo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.inscription': { paramsTuple?: []; params?: {} }
    'scolarite.inscriptions.fiche': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.pieces.lire': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.dossiers': { paramsTuple?: []; params?: {} }
    'scolarite.import': { paramsTuple?: []; params?: {} }
    'scolarite.import.modele': { paramsTuple?: []; params?: {} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'documents.telecharger': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.accueil': { paramsTuple?: []; params?: {} }
    'admin.annees': { paramsTuple?: []; params?: {} }
    'admin.structure': { paramsTuple?: []; params?: {} }
    'admin.etablissement': { paramsTuple?: []; params?: {} }
    'admin.classes': { paramsTuple?: []; params?: {} }
    'admin.affectations': { paramsTuple?: []; params?: {} }
    'admin.comptes': { paramsTuple?: []; params?: {} }
    'admin.journal': { paramsTuple?: []; params?: {} }
    'api.sante': { paramsTuple?: []; params?: {} }
    'api.health': { paramsTuple?: []; params?: {} }
    'api.moi': { paramsTuple?: []; params?: {} }
    'api.enseignant.affectations': { paramsTuple?: []; params?: {} }
    'api.enseignant.periodes': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.types': { paramsTuple?: []; params?: {} }
    'api.enseignant.evaluations': { paramsTuple?: []; params?: {} }
    'api.enseignant.evaluations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.appreciations': { paramsTuple?: []; params?: {} }
    'api.enseignant.recapitulatif': { paramsTuple?: []; params?: {} }
    'api.direction.evaluations': { paramsTuple?: []; params?: {} }
    'api.direction.evaluations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.suivi': { paramsTuple?: []; params?: {} }
    'api.direction.inscriptions': { paramsTuple?: []; params?: {} }
    'api.admin.accueil': { paramsTuple?: []; params?: {} }
    'api.admin.annees': { paramsTuple?: []; params?: {} }
    'api.admin.structure': { paramsTuple?: []; params?: {} }
    'api.admin.etablissement': { paramsTuple?: []; params?: {} }
    'api.admin.classes': { paramsTuple?: []; params?: {} }
    'api.admin.affectations': { paramsTuple?: []; params?: {} }
    'api.admin.comptes': { paramsTuple?: []; params?: {} }
    'api.admin.journal': { paramsTuple?: []; params?: {} }
    'api.documents.index': { paramsTuple?: []; params?: {} }
    'api.documents.telecharger': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.portail.enfants': { paramsTuple?: []; params?: {} }
    'api.portail.enfant': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.introuvable': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'double_facteur.store': { paramsTuple?: []; params?: {} }
    'double_facteur.renvoyer': { paramsTuple?: []; params?: {} }
    'mot_de_passe_oublie.store': { paramsTuple?: []; params?: {} }
    'reinitialisation.update': { paramsTuple: [ParamValue]; params: {'jeton': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'profil.mot_de_passe': { paramsTuple?: []; params?: {} }
    'enseignant.evaluations.store': { paramsTuple?: []; params?: {} }
    'enseignant.evaluations.notes': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enseignant.evaluations.soumettre': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'enseignant.appreciations.store': { paramsTuple?: []; params?: {} }
    'direction.evaluations.valider': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'direction.evaluations.renvoyer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'direction.evaluations.deverrouiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'direction.derogations.store': { paramsTuple?: []; params?: {} }
    'direction.inscriptions.valider': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'direction.inscriptions.refuser': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.eleves.statut': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.eleves.reactiver': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.tuteurs.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.tuteurs.rattacher': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'tuteurId': ParamValue} }
    'scolarite.tuteurs.acces': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'tuteurId': ParamValue} }
    'scolarite.inscriptions.store': { paramsTuple?: []; params?: {} }
    'scolarite.inscriptions.soumettre': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.inscriptions.annuler': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.inscriptions.piece': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'scolarite.inscriptions.changer_classe': { paramsTuple?: []; params?: {} }
    'scolarite.import.analyser': { paramsTuple?: []; params?: {} }
    'scolarite.import.accepter': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.import.abandonner': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.documents.demander': { paramsTuple?: []; params?: {} }
    'admin.annees.store': { paramsTuple?: []; params?: {} }
    'admin.annees.activer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.annees.cloturer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.annees.dupliquer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.niveaux.store': { paramsTuple?: []; params?: {} }
    'admin.matieres.store': { paramsTuple?: []; params?: {} }
    'admin.classes.store': { paramsTuple: [ParamValue]; params: {'anneeId': ParamValue} }
    'admin.affectations.store': { paramsTuple: [ParamValue]; params: {'anneeId': ParamValue} }
    'admin.comptes.store': { paramsTuple?: []; params?: {} }
    'api.auth.connexion': { paramsTuple?: []; params?: {} }
    'api.auth.verification': { paramsTuple?: []; params?: {} }
    'api.auth.verification.renvoyer': { paramsTuple?: []; params?: {} }
    'api.auth.mot_de_passe_oublie': { paramsTuple?: []; params?: {} }
    'api.auth.deconnexion': { paramsTuple?: []; params?: {} }
    'api.enseignant.evaluations.store': { paramsTuple?: []; params?: {} }
    'api.enseignant.evaluations.notes': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.evaluations.soumettre': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.evaluations.valider': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.evaluations.renvoyer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.evaluations.deverrouiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.derogations.store': { paramsTuple?: []; params?: {} }
    'api.direction.inscriptions.valider': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.direction.inscriptions.refuser': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.introuvable': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  PUT: {
    'enseignant.evaluations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.eleves.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'scolarite.tuteurs.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'tuteurId': ParamValue} }
    'scolarite.tuteurs.principal': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'tuteurId': ParamValue} }
    'admin.periodes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.coefficients': { paramsTuple?: []; params?: {} }
    'admin.programme.obligatoire': { paramsTuple?: []; params?: {} }
    'admin.etablissement.update': { paramsTuple?: []; params?: {} }
    'admin.classes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.comptes.roles': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.comptes.activation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.moi.mot_de_passe': { paramsTuple?: []; params?: {} }
    'api.enseignant.evaluations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.enseignant.appreciations.store': { paramsTuple?: []; params?: {} }
    'api.introuvable': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  DELETE: {
    'scolarite.tuteurs.detacher': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'tuteurId': ParamValue} }
    'admin.affectations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.introuvable': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  OPTIONS: {
    'api.introuvable': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  PATCH: {
    'api.introuvable': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
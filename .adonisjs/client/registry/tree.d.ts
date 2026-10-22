/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  doubleFacteur: {
    create: typeof routes['double_facteur.create']
    store: typeof routes['double_facteur.store']
    renvoyer: typeof routes['double_facteur.renvoyer']
  }
  motDePasseOublie: {
    create: typeof routes['mot_de_passe_oublie.create']
    store: typeof routes['mot_de_passe_oublie.store']
  }
  reinitialisation: {
    edit: typeof routes['reinitialisation.edit']
    update: typeof routes['reinitialisation.update']
  }
  profil: typeof routes['profil'] & {
    motDePasse: typeof routes['profil.mot_de_passe']
  }
  portail: {
    accueil: typeof routes['portail.accueil']
    notes: typeof routes['portail.notes']
    bulletins: typeof routes['portail.bulletins']
    bulletin: typeof routes['portail.bulletin']
    dossier: typeof routes['portail.dossier']
  }
  enseignant: {
    classes: typeof routes['enseignant.classes']
    evaluations: typeof routes['enseignant.evaluations']
    nouvelleEvaluation: typeof routes['enseignant.nouvelle_evaluation']
    grille: typeof routes['enseignant.grille']
    appreciations: typeof routes['enseignant.appreciations']
    recapitulatif: typeof routes['enseignant.recapitulatif']
  }
  direction: {
    accueil: typeof routes['direction.accueil']
    validation: typeof routes['direction.validation']
    deliberation: typeof routes['direction.deliberation']
    bulletins: typeof routes['direction.bulletins']
    inscriptions: typeof routes['direction.inscriptions'] & {
      valider: typeof routes['direction.inscriptions.valider']
      refuser: typeof routes['direction.inscriptions.refuser']
    }
  }
  scolarite: {
    eleves: typeof routes['scolarite.eleves'] & {
      update: typeof routes['scolarite.eleves.update']
      statut: typeof routes['scolarite.eleves.statut']
      reactiver: typeof routes['scolarite.eleves.reactiver']
      photo: typeof routes['scolarite.eleves.photo']
    }
    fiche: typeof routes['scolarite.fiche']
    tuteurs: {
      store: typeof routes['scolarite.tuteurs.store']
      rattacher: typeof routes['scolarite.tuteurs.rattacher']
      update: typeof routes['scolarite.tuteurs.update']
      principal: typeof routes['scolarite.tuteurs.principal']
      detacher: typeof routes['scolarite.tuteurs.detacher']
      acces: typeof routes['scolarite.tuteurs.acces']
    }
    inscription: typeof routes['scolarite.inscription']
    inscriptions: {
      store: typeof routes['scolarite.inscriptions.store']
      fiche: typeof routes['scolarite.inscriptions.fiche']
      soumettre: typeof routes['scolarite.inscriptions.soumettre']
      annuler: typeof routes['scolarite.inscriptions.annuler']
      piece: typeof routes['scolarite.inscriptions.piece']
      changerClasse: typeof routes['scolarite.inscriptions.changer_classe']
    }
    pieces: {
      lire: typeof routes['scolarite.pieces.lire']
    }
    dossiers: typeof routes['scolarite.dossiers']
    import: typeof routes['scolarite.import'] & {
      modele: typeof routes['scolarite.import.modele']
      analyser: typeof routes['scolarite.import.analyser']
      accepter: typeof routes['scolarite.import.accepter']
      abandonner: typeof routes['scolarite.import.abandonner']
    }
    documents: {
      demander: typeof routes['scolarite.documents.demander']
    }
  }
  documents: {
    index: typeof routes['documents.index']
    telecharger: typeof routes['documents.telecharger']
  }
  admin: {
    accueil: typeof routes['admin.accueil']
    annees: typeof routes['admin.annees'] & {
      store: typeof routes['admin.annees.store']
      activer: typeof routes['admin.annees.activer']
      cloturer: typeof routes['admin.annees.cloturer']
      dupliquer: typeof routes['admin.annees.dupliquer']
    }
    periodes: {
      update: typeof routes['admin.periodes.update']
    }
    structure: typeof routes['admin.structure']
    niveaux: {
      store: typeof routes['admin.niveaux.store']
    }
    matieres: {
      store: typeof routes['admin.matieres.store']
    }
    coefficients: typeof routes['admin.coefficients']
    programme: {
      obligatoire: typeof routes['admin.programme.obligatoire']
    }
    etablissement: typeof routes['admin.etablissement'] & {
      update: typeof routes['admin.etablissement.update']
    }
    classes: typeof routes['admin.classes'] & {
      store: typeof routes['admin.classes.store']
      update: typeof routes['admin.classes.update']
    }
    affectations: typeof routes['admin.affectations'] & {
      store: typeof routes['admin.affectations.store']
      destroy: typeof routes['admin.affectations.destroy']
    }
    comptes: typeof routes['admin.comptes'] & {
      store: typeof routes['admin.comptes.store']
      roles: typeof routes['admin.comptes.roles']
      activation: typeof routes['admin.comptes.activation']
    }
    journal: typeof routes['admin.journal']
  }
}

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
  }
  scolarite: {
    eleves: typeof routes['scolarite.eleves']
    fiche: typeof routes['scolarite.fiche']
    inscription: typeof routes['scolarite.inscription']
    dossiers: typeof routes['scolarite.dossiers']
  }
  admin: {
    accueil: typeof routes['admin.accueil']
    structure: typeof routes['admin.structure']
    comptes: typeof routes['admin.comptes']
    journal: typeof routes['admin.journal']
  }
}

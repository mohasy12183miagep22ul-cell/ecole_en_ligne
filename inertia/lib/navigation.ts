import { type NomIcone } from '~/lib/icones'

export type Espace = 'portail' | 'enseignant' | 'direction' | 'scolarite' | 'admin'

export type ElementNav = {
  libelle: string
  icone: NomIcone
  href: string
  /** Si vrai, seul l'URL exacte active l'élément (sinon tout sous-chemin l'active). */
  exact?: boolean
}

type ConfigEspace = {
  libelle: string
  /** Valeur de `data-env` : détermine la couleur d'accent. */
  accent: 'portail' | 'enseignant' | 'admin'
  nav: ElementNav[]
}

/** Navigation de chaque espace, reprise du prototype. */
export const espaces: Record<Espace, ConfigEspace> = {
  portail: {
    libelle: 'Portail famille',
    accent: 'portail',
    nav: [
      { libelle: 'Accueil', icone: 'house', href: '/portail', exact: true },
      { libelle: 'Notes', icone: 'chart-simple', href: '/portail/notes' },
      { libelle: 'Bulletins', icone: 'file-lines', href: '/portail/bulletins' },
      { libelle: 'Dossier', icone: 'id-card', href: '/portail/dossier' },
    ],
  },
  enseignant: {
    libelle: 'Espace enseignant',
    accent: 'enseignant',
    nav: [
      { libelle: 'Mes classes', icone: 'users', href: '/enseignant/classes' },
      { libelle: 'Évaluations', icone: 'clipboard-list', href: '/enseignant/evaluations' },
      { libelle: 'Appréciations', icone: 'comment-dots', href: '/enseignant/appreciations' },
      { libelle: 'Récap', icone: 'chart-column', href: '/enseignant/recapitulatif' },
    ],
  },
  direction: {
    libelle: 'Direction',
    accent: 'admin',
    nav: [
      { libelle: 'Tableau de bord', icone: 'gauge', href: '/direction', exact: true },
      { libelle: 'Inscriptions', icone: 'user-plus', href: '/direction/inscriptions' },
      { libelle: 'Validation', icone: 'circle-check', href: '/direction/validation' },
      { libelle: 'Délibération', icone: 'scale-balanced', href: '/direction/deliberation' },
      { libelle: 'Bulletins', icone: 'file-export', href: '/direction/bulletins' },
      { libelle: 'Élèves', icone: 'user-graduate', href: '/scolarite/eleves' },
      { libelle: 'Documents', icone: 'download', href: '/documents' },
      { libelle: 'Journal', icone: 'clock-rotate-left', href: '/admin/journal' },
    ],
  },
  scolarite: {
    libelle: 'Scolarité',
    accent: 'admin',
    nav: [
      { libelle: 'Élèves', icone: 'user-graduate', href: '/scolarite/eleves' },
      { libelle: 'Inscription', icone: 'user-plus', href: '/scolarite/inscription' },
      { libelle: 'Dossiers', icone: 'folder-open', href: '/scolarite/dossiers' },
      { libelle: 'Import', icone: 'file-import', href: '/scolarite/import' },
      { libelle: 'Documents', icone: 'download', href: '/documents' },
    ],
  },
  admin: {
    libelle: 'Administration',
    accent: 'admin',
    nav: [
      { libelle: 'Tableau de bord', icone: 'gauge', href: '/admin', exact: true },
      { libelle: 'Années', icone: 'calendar-days', href: '/admin/annees' },
      { libelle: 'Structure', icone: 'sitemap', href: '/admin/structure' },
      { libelle: 'Classes', icone: 'door-open', href: '/admin/classes' },
      { libelle: 'Affectations', icone: 'chalkboard-user', href: '/admin/affectations' },
      { libelle: 'Comptes', icone: 'user-shield', href: '/admin/comptes' },
      { libelle: 'Établissement', icone: 'gear', href: '/admin/etablissement' },
      { libelle: 'Journal', icone: 'clock-rotate-left', href: '/admin/journal' },
    ],
  },
}

/**
 * Espace principal selon les rôles cumulés, par ordre de priorité — le même
 * que l'accueil choisi par le serveur (journal et profil sont partagés).
 */
export const espaceDesRoles = (roles: string[] = []): Espace =>
  roles.includes('admin')
    ? 'admin'
    : roles.includes('direction')
      ? 'direction'
      : roles.includes('secretariat')
        ? 'scolarite'
        : roles.includes('enseignant') || roles.includes('professeur_principal')
          ? 'enseignant'
          : 'portail'

/** Libellés des rôles à l'écran. */
export const LIBELLES_ROLES: Record<string, string> = {
  admin: 'Administrateur',
  direction: 'Direction',
  secretariat: 'Secrétariat',
  enseignant: 'Enseignant',
  professeur_principal: 'Professeur principal',
  tuteur: 'Tuteur légal',
  eleve: 'Élève',
}

export const estActif = (url: string, el: ElementNav) => {
  const chemin = url.split('?')[0]
  return el.exact ? chemin === el.href : chemin === el.href || chemin.startsWith(`${el.href}/`)
}

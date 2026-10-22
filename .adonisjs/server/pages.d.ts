import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'admin/accueil': ExtractProps<(typeof import('../../inertia/pages/admin/accueil.tsx'))['default']>
    'admin/affectations': ExtractProps<(typeof import('../../inertia/pages/admin/affectations.tsx'))['default']>
    'admin/annees': ExtractProps<(typeof import('../../inertia/pages/admin/annees.tsx'))['default']>
    'admin/classes': ExtractProps<(typeof import('../../inertia/pages/admin/classes.tsx'))['default']>
    'admin/comptes': ExtractProps<(typeof import('../../inertia/pages/admin/comptes.tsx'))['default']>
    'admin/journal': ExtractProps<(typeof import('../../inertia/pages/admin/journal.tsx'))['default']>
    'admin/structure': ExtractProps<(typeof import('../../inertia/pages/admin/structure.tsx'))['default']>
    'auth/connexion': ExtractProps<(typeof import('../../inertia/pages/auth/connexion.tsx'))['default']>
    'auth/double_facteur': ExtractProps<(typeof import('../../inertia/pages/auth/double_facteur.tsx'))['default']>
    'auth/lien_envoye': ExtractProps<(typeof import('../../inertia/pages/auth/lien_envoye.tsx'))['default']>
    'auth/mot_de_passe_oublie': ExtractProps<(typeof import('../../inertia/pages/auth/mot_de_passe_oublie.tsx'))['default']>
    'auth/reinitialiser': ExtractProps<(typeof import('../../inertia/pages/auth/reinitialiser.tsx'))['default']>
    'direction/accueil': ExtractProps<(typeof import('../../inertia/pages/direction/accueil.tsx'))['default']>
    'direction/bulletins': ExtractProps<(typeof import('../../inertia/pages/direction/bulletins.tsx'))['default']>
    'direction/deliberation': ExtractProps<(typeof import('../../inertia/pages/direction/deliberation.tsx'))['default']>
    'direction/validation': ExtractProps<(typeof import('../../inertia/pages/direction/validation.tsx'))['default']>
    'enseignant/appreciations': ExtractProps<(typeof import('../../inertia/pages/enseignant/appreciations.tsx'))['default']>
    'enseignant/classes': ExtractProps<(typeof import('../../inertia/pages/enseignant/classes.tsx'))['default']>
    'enseignant/evaluations': ExtractProps<(typeof import('../../inertia/pages/enseignant/evaluations.tsx'))['default']>
    'enseignant/grille': ExtractProps<(typeof import('../../inertia/pages/enseignant/grille.tsx'))['default']>
    'enseignant/nouvelle_evaluation': ExtractProps<(typeof import('../../inertia/pages/enseignant/nouvelle_evaluation.tsx'))['default']>
    'enseignant/recapitulatif': ExtractProps<(typeof import('../../inertia/pages/enseignant/recapitulatif.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'portail/accueil': ExtractProps<(typeof import('../../inertia/pages/portail/accueil.tsx'))['default']>
    'portail/bulletin': ExtractProps<(typeof import('../../inertia/pages/portail/bulletin.tsx'))['default']>
    'portail/bulletins': ExtractProps<(typeof import('../../inertia/pages/portail/bulletins.tsx'))['default']>
    'portail/dossier': ExtractProps<(typeof import('../../inertia/pages/portail/dossier.tsx'))['default']>
    'portail/notes': ExtractProps<(typeof import('../../inertia/pages/portail/notes.tsx'))['default']>
    'profil': ExtractProps<(typeof import('../../inertia/pages/profil.tsx'))['default']>
    'scolarite/dossiers': ExtractProps<(typeof import('../../inertia/pages/scolarite/dossiers.tsx'))['default']>
    'scolarite/eleves': ExtractProps<(typeof import('../../inertia/pages/scolarite/eleves.tsx'))['default']>
    'scolarite/fiche': ExtractProps<(typeof import('../../inertia/pages/scolarite/fiche.tsx'))['default']>
    'scolarite/inscription': ExtractProps<(typeof import('../../inertia/pages/scolarite/inscription.tsx'))['default']>
  }
}

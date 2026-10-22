import AuthLayout, { type AccentAuth } from '~/layouts/auth'
import Icone from '~/components/ui/icone'
import Champ, { ChampMotDePasse } from '~/components/ui/champ'
import { cx } from '~/lib/format'
import { type NomIcone } from '~/lib/icones'
import { Form, Link } from '@adonisjs/inertia/react'
import { useState } from 'react'

/** Profils de démonstration du prototype (comptes créés par le seeder). */
const PROFILS: Array<{
  id: string
  libelle: string
  icone: NomIcone
  email: string
  accent: AccentAuth
}> = [
  {
    id: 'parent',
    libelle: 'Parent',
    icone: 'people-roof',
    email: 'f.diallo@mail.gn',
    accent: 'portail',
  },
  {
    id: 'enseignant',
    libelle: 'Enseignant',
    icone: 'chalkboard-user',
    email: 'i.sow@flamboyants.edu.gn',
    accent: 'enseignant',
  },
  {
    id: 'direction',
    libelle: 'Direction',
    icone: 'user-tie',
    email: 'm.camara@flamboyants.edu.gn',
    accent: 'admin',
  },
  {
    id: 'secretariat',
    libelle: 'Secrétariat',
    icone: 'folder-open',
    email: 'a.bangoura@flamboyants.edu.gn',
    accent: 'admin',
  },
  {
    id: 'admin',
    libelle: 'Administrateur',
    icone: 'gear',
    email: 'k.barry@flamboyants.edu.gn',
    accent: 'admin',
  },
]
const MOT_DE_PASSE_DEMO = 'Flamboyant2026'

export default function Connexion() {
  const [profil, setProfil] = useState(PROFILS[0])
  // Formulaire vide au chargement : rien n'est prérempli ni mémorisé.
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')

  return (
    <AuthLayout titre="Connexion" accent={profil.accent}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-ecran font-extrabold tracking-[-0.02em]">Connexion</h1>
        <p className="text-corps text-encre-3">Accédez à votre espace avec vos identifiants.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-leg font-semibold tracking-[0.06em] text-encre-3 uppercase">
          Profil de démonstration
        </span>
        <div className="flex flex-wrap gap-2">
          {PROFILS.map((p) => {
            const on = p.id === profil.id
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                data-env={p.accent}
                onClick={() => {
                  setProfil(p)
                  setEmail(p.email)
                  setMotDePasse(MOT_DE_PASSE_DEMO)
                }}
                className={cx(
                  'flex h-[38px] items-center gap-2 rounded-full border px-3 text-meta font-semibold',
                  on
                    ? 'border-accent bg-accent-doux text-accent'
                    : 'border-bordure-champ bg-white text-encre-2'
                )}
              >
                <Icone nom={p.icone} />
                {p.libelle}
              </button>
            )
          })}
        </div>
      </div>

      <Form
        route="session.store"
        autoComplete="off"
        onFinish={() => {
          // Après chaque tentative, les champs sont effacés.
          setEmail('')
          setMotDePasse('')
        }}
        className="flex flex-col gap-[18px]"
      >
        {({ errors, processing }) => (
          <>
            <Champ
              libelle="Adresse e-mail"
              name="email"
              type="email"
              autoComplete="off"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              erreur={errors.email}
            />
            <ChampMotDePasse
              libelle="Mot de passe"
              name="password"
              autoComplete="new-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              erreur={errors.password}
            />
            {(errors as Record<string, string | undefined>).connexion && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-champ bg-erreur-fond px-3 py-2.5 text-meta font-medium text-erreur"
              >
                <Icone nom="circle-exclamation" />
                {(errors as Record<string, string | undefined>).connexion}
              </div>
            )}
            <div className="-mt-1.5 flex justify-end">
              <Link
                route="mot_de_passe_oublie.create"
                className="py-1 text-meta font-semibold text-accent"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <button
              type="submit"
              disabled={processing}
              className="flex h-[50px] items-center justify-center gap-2.5 rounded-bouton bg-accent text-moyen font-bold text-white hover:brightness-[.94] disabled:opacity-60"
            >
              {processing ? <Icone nom="spinner" tourne /> : null}
              Se connecter
              {!processing && <Icone nom="arrow-right" />}
            </button>
          </>
        )}
      </Form>

      <p className="flex items-center gap-2 text-leg text-encre-4">
        <Icone nom="shield-halved" />
        Session sécurisée · compte verrouillé après 5 échecs
      </p>
    </AuthLayout>
  )
}

import Logo from '~/components/logo'
import Toasts from '~/components/ui/toast'
import { type ReactNode } from 'react'
import { Head, usePage } from '@inertiajs/react'
import apprentissage from '~/assets/illustrations/online-learning_tgmv.svg'

export type AccentAuth = 'portail' | 'enseignant' | 'admin'

/**
 * Écrans d'authentification, à l'identique du prototype : grille auto-fit
 * (une colonne sous 720 px, deux au-delà), marque + illustration à gauche,
 * formulaire à droite.
 */
export default function AuthLayout({
  titre,
  accent = 'admin',
  children,
}: {
  titre: string
  /** Couleur d'accent : suit le profil de démonstration choisi à la connexion. */
  accent?: AccentAuth
  children: ReactNode
}) {
  const { props } = usePage()
  return (
    <div
      data-env={accent}
      className="relative flex min-h-dvh justify-center overflow-y-auto bg-white"
    >
      <Head title={titre} />
      <div className="grid min-h-dvh w-full max-w-[1080px] grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] content-center">
        <section className="flex flex-col justify-center gap-5 px-6 pt-7 pb-2">
          <div className="flex items-center gap-2.5">
            <Logo taille={40} nom={false} className="text-[18px]" />
            <div className="flex flex-col">
              <span className="text-[18px] font-extrabold tracking-[-0.01em]">École en ligne</span>
              <span className="text-leg text-encre-3">{props.etablissement?.nom}</span>
            </div>
          </div>
          <div className="flex justify-center rounded-3xl bg-accent-doux p-5">
            <img
              src={apprentissage}
              alt=""
              className="max-h-[220px] w-full max-w-[340px] object-contain"
            />
          </div>
          <p className="text-corps leading-[1.55] text-pretty text-encre-3">
            Inscriptions, notes et bulletins réunis dans un seul espace — pour l’établissement, les
            enseignants et les familles.
          </p>
        </section>
        <section className="flex flex-col justify-center px-6 pt-3 pb-9">
          <div className="flex w-full max-w-[420px] flex-col gap-[18px]">{children}</div>
        </section>
      </div>
      <Toasts bas="auth" />
    </div>
  )
}

import Logo from '~/components/logo'
import Icone from '~/components/ui/icone'
import Toasts, { notifier } from '~/components/ui/toast'
import { cx } from '~/lib/format'
import { espaces, estActif, type ElementNav, type Espace } from '~/lib/navigation'
import { Form, Link } from '@adonisjs/inertia/react'
import { Head, usePage } from '@inertiajs/react'
import { useState, type ReactNode } from 'react'

type Props = {
  espace: Espace
  /** Titre d'écran : en-tête mobile, titre de page bureau et titre du document. */
  titre: string
  /** Écran enfant : bouton retour (mobile) et fil d'Ariane (bureau). */
  retour?: { href: string; libelle: string; surligner?: boolean }
  /** Action principale de l'écran : bouton flottant en mobile. */
  action?: { href: string; libelle: string }
  children: ReactNode
}

/**
 * Coque de l'application, reprise du prototype.
 *
 * - Mobile (par défaut) : en-tête 60 px, contenu défilant, barre d'onglets basse.
 * - Dès 1024 px : barre latérale 248 px, en-tête 68 px, titre + fil d'Ariane.
 *
 * La page occupe exactement la hauteur de l'écran et seul le contenu défile :
 * les barres collantes (ex. synthèse de la grille de notes) restent visibles.
 */
const MAX_ONGLETS = 5

/**
 * Barre d'onglets mobile. Au-delà de 5 entrées, les 4 premières restent
 * visibles et les autres s'ouvrent depuis « Plus ».
 */
function BarreOnglets({
  elements,
  estCourant,
}: {
  elements: ElementNav[]
  estCourant: (el: ElementNav) => boolean
}) {
  const [plusOuvert, setPlusOuvert] = useState(false)
  const deborde = elements.length > MAX_ONGLETS
  const visibles = deborde ? elements.slice(0, MAX_ONGLETS - 1) : elements
  const autres = deborde ? elements.slice(MAX_ONGLETS - 1) : []
  const autreCourant = autres.some(estCourant)
  const onglet = (actif: boolean) =>
    cx(
      'flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 text-micro hover:no-underline',
      actif
        ? 'font-bold text-accent hover:text-accent'
        : 'font-medium text-encre-4 hover:text-encre-4'
    )

  return (
    <>
      {plusOuvert && (
        <div className="absolute inset-0 z-40 lg:hidden" onClick={() => setPlusOuvert(false)}>
          <nav
            aria-label="Autres rubriques"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 bottom-[76px] flex min-w-[220px] flex-col rounded-carte border border-bordure bg-white p-1.5 shadow-flottant"
          >
            {autres.map((el) => (
              <Link
                key={el.href}
                href={el.href}
                aria-current={estCourant(el) ? 'page' : undefined}
                onClick={() => setPlusOuvert(false)}
                className={cx(
                  'flex h-11 items-center gap-3 rounded-champ px-3 text-corps hover:no-underline',
                  estCourant(el)
                    ? 'bg-accent-doux font-bold text-accent hover:text-accent'
                    : 'font-medium text-encre-nav hover:text-encre-nav'
                )}
              >
                <Icone nom={el.icone} className="w-[18px]" />
                {el.libelle}
              </Link>
            ))}
          </nav>
        </div>
      )}
      <nav
        aria-label="Navigation principale"
        className="flex shrink-0 border-t border-bordure bg-carte px-1 pt-1.5 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden"
      >
        {visibles.map((el) => (
          <Link
            key={el.href}
            href={el.href}
            aria-current={estCourant(el) ? 'page' : undefined}
            className={onglet(estCourant(el))}
          >
            <Icone nom={el.icone} className="text-[18px]" />
            <span className="max-w-full truncate">{el.libelle}</span>
          </Link>
        ))}
        {deborde && (
          <button
            type="button"
            aria-expanded={plusOuvert}
            aria-haspopup="true"
            onClick={() => setPlusOuvert((v) => !v)}
            className={onglet(autreCourant || plusOuvert)}
          >
            <Icone nom="ellipsis" className="text-[18px]" />
            <span>Plus</span>
          </button>
        )}
      </nav>
    </>
  )
}

export default function Coque({ espace, titre, retour, action, children }: Props) {
  const config = espaces[espace]
  const { url, props } = usePage()
  const nom = props.user?.fullName ?? ''
  const sousTitre = props.user?.sousTitre ?? ''
  const init = props.user?.initials ?? ''

  return (
    <div data-env={config.accent} className="relative flex h-dvh overflow-hidden bg-page">
      <Head title={titre} />

      {/* Barre latérale — bureau */}
      <aside className="hidden h-full w-[248px] shrink-0 flex-col gap-[22px] overflow-y-auto border-r border-bordure bg-carte px-3.5 py-5 lg:flex">
        <Logo className="px-1.5" />
        <span className="px-2 text-micro font-bold tracking-[0.08em] text-encre-4 uppercase">
          {config.libelle}
        </span>
        <nav aria-label="Navigation principale" className="flex flex-col gap-1">
          {config.nav.map((el) => {
            const actif =
              estActif(url, el) ||
              (retour !== undefined && retour.surligner !== false && retour.href === el.href)
            return (
              <Link
                key={el.href}
                href={el.href}
                aria-current={actif ? 'page' : undefined}
                className={cx(
                  'flex h-[42px] items-center gap-3 rounded-champ px-3 text-corps hover:no-underline',
                  actif
                    ? 'bg-accent-doux font-bold text-accent shadow-[inset_3px_0_0_var(--acc)] hover:text-accent'
                    : 'font-medium text-encre-nav hover:text-encre-nav'
                )}
              >
                <Icone nom={el.icone} className="w-[18px]" />
                {el.libelle}
              </Link>
            )
          })}
        </nav>
        <div className="flex-1" />
        <Form route="session.destroy">
          <button
            type="submit"
            className="flex h-[42px] w-full items-center gap-3 rounded-champ px-3 text-corps text-encre-nav"
          >
            <Icone nom="arrow-right-from-bracket" className="w-[18px]" />
            Se déconnecter
          </button>
        </Form>
      </aside>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {/* En-tête — bureau */}
        <header className="hidden h-[68px] shrink-0 items-center gap-4 border-b border-bordure bg-carte px-7 lg:flex">
          <div className="flex h-10 w-80 max-w-[40%] items-center gap-2.5 rounded-champ bg-page px-3.5">
            <input
              aria-label="Rechercher"
              placeholder="Rechercher un élève, une classe…"
              className="min-w-0 flex-1 border-none bg-transparent text-meta text-encre outline-none"
            />
            <Icone nom="magnifying-glass" className="text-accent" />
          </div>
          <div className="flex-1" />
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => notifier('Aucune nouvelle notification')}
            className="size-10 rounded-full border border-bordure bg-carte text-encre-2"
          >
            <Icone nom="reg-bell" />
          </button>
          <Link
            href="/profil"
            className="flex items-center gap-2.5 p-1 text-left hover:no-underline"
          >
            <span className="flex size-[38px] items-center justify-center rounded-full bg-accent-doux text-meta font-bold text-accent">
              {init}
            </span>
            <span className="flex flex-col">
              <span className="text-corps font-bold text-encre">{nom}</span>
              <span className="text-leg text-encre-3">{sousTitre}</span>
            </span>
            <Icone nom="chevron-down" className="text-leg text-encre-3" />
          </Link>
        </header>

        {/* En-tête — mobile */}
        <header className="flex h-[60px] shrink-0 items-center gap-2 border-b border-bordure bg-carte pr-2 pl-3 lg:hidden">
          {retour ? (
            <Link
              href={retour.href}
              aria-label="Retour"
              className="flex size-11 items-center justify-center text-[17px] text-encre hover:text-encre"
            >
              <Icone nom="arrow-left" />
            </Link>
          ) : (
            <span className="mr-1 flex size-[34px] items-center justify-center rounded-champ bg-accent text-corps text-white">
              <Icone nom="graduation-cap" />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-section font-extrabold">{titre}</span>
            <span className="text-micro text-encre-3">{config.libelle}</span>
          </div>
          <Link
            href="/profil"
            aria-label="Mon profil"
            className="flex size-11 items-center justify-center hover:no-underline"
          >
            <span className="flex size-[34px] items-center justify-center rounded-full bg-accent-doux text-leg font-bold text-accent">
              {init}
            </span>
          </Link>
        </header>

        <main id="defilement" className="min-h-0 flex-1 overflow-y-auto">
          <div className="w-full px-4 pt-4 pb-24 lg:mx-auto lg:max-w-[1180px] lg:px-8 lg:pt-7 lg:pb-14">
            <div className="mb-[22px] hidden flex-col gap-1 lg:flex">
              <h1 className="text-[24px] font-extrabold tracking-[-0.01em]">{titre}</h1>
              <span className="text-meta text-encre-3">
                {retour ? retour.libelle : config.libelle} /{' '}
                <span className="text-encre">{titre}</span>
              </span>
            </div>
            {children}
          </div>
        </main>

        {/* Barre d'onglets basse — mobile : 5 entrées au plus, le reste sous « Plus » */}
        <BarreOnglets
          elements={config.nav}
          estCourant={(el) =>
            estActif(url, el) ||
            (retour !== undefined && retour.surligner !== false && retour.href === el.href)
          }
        />
      </div>

      {/* Action principale — bouton flottant, mobile */}
      {action && (
        <Link
          href={action.href}
          aria-label={action.libelle}
          className="absolute right-[18px] bottom-[88px] z-20 flex size-14 items-center justify-center rounded-[18px] bg-accent text-[20px] text-white shadow-flottant hover:text-white lg:hidden"
        >
          <Icone nom="plus" />
        </Link>
      )}

      <Toasts />
    </div>
  )
}

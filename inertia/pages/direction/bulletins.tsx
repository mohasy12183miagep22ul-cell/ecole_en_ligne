import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Pastille, { type Etat } from '~/components/ui/pastille'
import { notifier } from '~/components/ui/toast'
import { useFeuille } from '~/components/ui/feuille'
import { cx, fmt } from '~/lib/format'
import { donneesClasse } from '~/demo/calculs'
import { NOM_MATIERE_COURT, maintenant } from '~/demo/donnees'
import { journaliser, modifier, useDemo } from '~/demo/store'
import { router, usePage } from '@inertiajs/react'

const AUTRES: Array<[string, string, Etat, string]> = [
  ['3e B', 'Saisies en cours', 'attention', '2 évaluations soumises'],
  ['4e A', 'Prêt à générer', 'info', 'Toutes les évaluations validées'],
  ['5e A', 'Publié', 'succes', '28 bulletins délivrés'],
  ['6e B', 'Saisies en cours', 'attention', '64 % des notes saisies'],
]

export default function BulletinsDirection() {
  const st = useDemo()
  const { props } = usePage()
  const auteur = props.user?.fullName ?? ''
  const [feuille, ouvrir] = useFeuille()
  const cd = donneesClasse(st)
  const attente = st.evals.filter(
    (e) => e.classe === '3e A' && !['validée', 'verrouillée'].includes(e.etat)
  )

  const controles = [
    {
      ok: !attente.length,
      libelle: attente.length
        ? `${attente.length} évaluation(s) non validée(s) : ${attente.map((e) => `${e.titre} (${NOM_MATIERE_COURT[e.matiere]})`).join(', ')}`
        : 'Toutes les évaluations de la période sont validées',
      action: attente.length
        ? { libelle: 'Aller à la validation', faire: () => router.visit('/direction/validation') }
        : null,
    },
    {
      ok: st.ignoreEPS,
      libelle: st.ignoreEPS
        ? `EPS sans note — ignorée avec motif : « ${st.epsMotif} »`
        : 'EPS : aucune note sur la période',
      action: st.ignoreEPS
        ? null
        : {
            libelle: 'Ignorer avec motif',
            faire: () =>
              ouvrir({
                titre: 'Ignorer la matière EPS ?',
                texte:
                  'La matière apparaîtra « non notée » sur les bulletins et sera exclue de la moyenne générale. Le motif est journalisé (RG17).',
                motif: true,
                libelleConfirmer: 'Ignorer avec motif',
                onConfirmer: (m) => {
                  modifier(() => ({ ignoreEPS: true, epsMotif: m }))
                  journaliser(
                    auteur,
                    'Dérogation génération',
                    `EPS · 3e A · T1 — ${m}`,
                    '',
                    'Ignorée'
                  )
                },
              }),
          },
    },
    { ok: true, libelle: 'Fenêtre de saisie du 1er trimestre close le 15/12/2026', action: null },
  ]
  const peutGenerer = controles.every((c) => c.ok)

  const statut: [Etat, string] =
    st.bul === 'published'
      ? ['succes', 'Publié']
      : st.bul === 'generated'
        ? ['info', 'Généré']
        : st.bul === 'generating'
          ? ['info', 'En cours']
          : peutGenerer
            ? ['info', 'Prêt à générer']
            : ['attention', 'Manques à lever']

  const generer = () => {
    if (!peutGenerer) return
    modifier(() => ({ bul: 'generating' }))
    journaliser(
      auteur,
      'Génération des bulletins',
      `3e A · 1er trimestre · ${cd.effectif} élèves`,
      '',
      'En file d’attente'
    )
    setTimeout(() => {
      modifier(() => ({ bul: 'generated' }))
      notifier(`${cd.effectif} bulletins générés`)
    }, 2200)
  }

  const publier = () =>
    ouvrir({
      titre: 'Publier les bulletins de la 3e A ?',
      texte:
        'La publication est l’acte de délivrance : les bulletins deviennent visibles pour les élèves et leurs tuteurs, et ne pourront plus être modifiés.',
      lignes: [
        ['Classe', '3e A · 1er trimestre'],
        ['Bulletins', String(cd.effectif)],
        ['Moyenne de classe', fmt(cd.moyenne)],
      ],
      libelleConfirmer: 'Publier maintenant',
      onConfirmer: () => {
        modifier(() => ({ bul: 'published', pubAt: maintenant() }))
        journaliser(auteur, 'Publication', 'Bulletins 3e A · 1er trimestre', 'Généré', 'Publié')
        notifier('Bulletins publiés — visibles sur le portail famille')
      },
    })

  const rectificatif = () =>
    ouvrir({
      titre: 'Créer un bulletin rectificatif ?',
      texte:
        'Le bulletin publié reste archivé. Le rectificatif numéroté le remplace à l’affichage du portail.',
      motif: true,
      libelleConfirmer: 'Créer le rectificatif',
      onConfirmer: (m) => {
        modifier((s) => ({ rectif: s.rectif + 1 }))
        journaliser(
          auteur,
          'Bulletin rectificatif',
          `3e A · DIALLO Aminata — ${m}`,
          `Version ${st.rectif + 1}`,
          `Version ${st.rectif + 2}`
        )
        notifier('Rectificatif créé')
      },
    })

  return (
    <Coque espace="direction" titre="Génération et publication">
      <div className="flex max-w-[880px] flex-col gap-3.5">
        <div className="flex flex-col gap-3.5 rounded-carte border border-bordure bg-white p-[18px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-section font-extrabold">3e A · 1er trimestre</span>
              <span className="text-leg text-encre-3">{cd.effectif} élèves · PP : I. Sow</span>
            </div>
            <Pastille etat={statut[0]}>{statut[1]}</Pastille>
          </div>
          <div className="flex flex-col gap-2.5">
            {controles.map((c) => (
              <div
                key={c.libelle}
                className="flex items-start gap-2.5 rounded-champ border border-separateur bg-bandeau px-3 py-2.5"
              >
                <Icone
                  nom={c.ok ? 'circle-check' : 'circle-exclamation'}
                  className={cx('mt-0.5', c.ok ? 'text-succes' : 'text-erreur')}
                />
                <span className="flex-1 text-meta leading-[1.45]">{c.libelle}</span>
                {c.action && (
                  <button
                    type="button"
                    onClick={c.action.faire}
                    className="text-meta font-bold whitespace-nowrap text-accent"
                  >
                    {c.action.libelle}
                  </button>
                )}
              </div>
            ))}
          </div>

          {st.bul === 'none' && (
            <>
              <button
                type="button"
                onClick={generer}
                disabled={!peutGenerer}
                className="h-12 rounded-bouton bg-accent text-corps font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Icone nom="gears" className="mr-2" />
                Générer les bulletins
              </button>
              {!peutGenerer && (
                <span className="text-leg text-erreur">
                  Génération refusée tant que les manques ne sont pas levés ou ignorés avec motif.
                </span>
              )}
            </>
          )}
          {st.bul === 'generating' && (
            <div className="flex h-12 items-center justify-center gap-2.5 rounded-bouton bg-info-fond text-corps font-bold text-info">
              <Icone nom="spinner" tourne />
              Génération en tâche de fond…
            </div>
          )}
          {st.bul === 'generated' && (
            <div className="flex flex-wrap gap-2.5">
              <span className="min-w-[180px] flex-1 self-center text-meta text-encre-2">
                Bulletins générés, non visibles par les familles tant qu’ils ne sont pas publiés.
              </span>
              <button
                type="button"
                onClick={publier}
                className="h-12 rounded-bouton bg-accent px-[22px] text-corps font-bold text-white"
              >
                <Icone nom="paper-plane" className="mr-2" />
                Publier la classe
              </button>
            </div>
          )}
          {st.bul === 'published' && (
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex min-w-[200px] flex-1 items-center gap-2.5 rounded-champ bg-succes-fond p-3 text-meta font-semibold text-succes">
                <Icone nom="circle-check" />
                Publié le {st.pubAt} · visible sur le portail famille
              </div>
              <button
                type="button"
                onClick={rectificatif}
                className="h-11 rounded-bouton border border-bordure-champ bg-white px-3.5 text-meta font-semibold text-encre-2"
              >
                Bulletin rectificatif
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-carte border border-bordure bg-white">
          {AUTRES.map(([c, l, etat, sous]) => (
            <div key={c} className="flex items-center gap-3 border-b border-separateur px-4 py-3.5">
              <span className="w-[46px] text-corps font-extrabold">{c}</span>
              <span className="flex-1 text-meta text-encre-3">{sous}</span>
              <Pastille etat={etat}>{l}</Pastille>
            </div>
          ))}
        </div>
      </div>
      {feuille}
    </Coque>
  )
}

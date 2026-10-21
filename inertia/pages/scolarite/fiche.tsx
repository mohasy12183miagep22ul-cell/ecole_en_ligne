import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Onglets from '~/components/ui/onglets'
import Pastille from '~/components/ui/pastille'
import EtatVide from '~/components/ui/etat_vide'
import { notifier } from '~/components/ui/toast'
import { cx, fmt } from '~/lib/format'
import { donneesClasse } from '~/demo/calculs'
import { AMINATA, ARCHIVES, MATIERES, eleve } from '~/demo/donnees'
import { estIncomplet, etatStatut } from '~/demo/scolarite'
import { journaliser, modifier, useDemo } from '~/demo/store'
import { usePage } from '@inertiajs/react'
import { useState } from 'react'

type Onglet = 'id' | 'tut' | 'sco' | 'notes' | 'bul' | 'docs' | 'log'
const ONGLETS: Array<{ id: Onglet; libelle: string }> = [
  { id: 'id', libelle: 'Identité' },
  { id: 'tut', libelle: 'Tuteurs' },
  { id: 'sco', libelle: 'Scolarité' },
  { id: 'notes', libelle: 'Notes' },
  { id: 'bul', libelle: 'Bulletins' },
  { id: 'docs', libelle: 'Documents' },
  { id: 'log', libelle: 'Journal' },
]
const PIECES: Array<[string, string]> = [
  ['Acte de naissance', 'acte'],
  ['Bulletin de l’année précédente', 'bull'],
  ['Certificat de transfert', 'transf'],
  ['Photo d’identité', 'photo'],
]

export default function FicheEleve({ id, onglet }: { id: string; onglet: string }) {
  const st = useDemo()
  const { props } = usePage()
  const auteur = props.user?.fullName ?? ''
  const [actif, setActif] = useState<Onglet>(
    ONGLETS.some((o) => o.id === onglet) ? (onglet as Onglet) : 'id'
  )
  const s = eleve(id)
  const retour = { href: '/scolarite/eleves', libelle: 'Liste des élèves' }

  if (!s) {
    return (
      <Coque espace="scolarite" titre="Fiche élève" retour={retour}>
        <EtatVide illustration="vide" titre="Élève introuvable" />
      </Coque>
    )
  }

  const estAminata = s.id === AMINATA.id
  const ligne = donneesClasse(st).lignes.find((r) => r.s.id === s.id)
  const inc = estIncomplet(st, s)
  const identite: Array<[string, string]> = [
    ['Nom', s.nom],
    ['Prénoms', s.prenom],
    ['Sexe', s.sexe === 'F' ? 'Féminin' : 'Masculin'],
    ['Date de naissance', s.naissance],
    ['Lieu de naissance', 'Conakry'],
    ['Nationalité', 'Guinéenne'],
    ['N° acte de naissance', `CKY-${s.matricule.slice(0, 4)}-${4000 + s.i * 13}`],
    ['Matricule', s.matricule],
  ]
  const tuteurs = estAminata
    ? [
        {
          nom: 'Fatoumata Diallo',
          lien: 'Mère · tutrice principale',
          tel: '+224 622 14 87 30',
          prof: 'Commerçante',
          adr: 'Kipé, Ratoma, Conakry',
        },
        {
          nom: 'Mamadou Diallo',
          lien: 'Père',
          tel: '+224 664 02 55 19',
          prof: 'Ingénieur',
          adr: 'Kipé, Ratoma, Conakry',
        },
      ]
    : [
        {
          nom: `${s.sexe === 'F' ? 'Mme ' : 'M. '}${s.nom}`,
          lien: 'Tuteur principal',
          tel: `+224 62${s.i % 10} ${10 + s.i} 4${s.i % 9} 0${s.i % 7}`,
          prof: 'Fonctionnaire',
          adr: 'Matoto, Conakry',
        },
      ]
  const parcours = [
    {
      a: '2026-2027',
      c: s.classe,
      e: s.statut === 'Transféré' ? 'Transféré le 04/11/2026' : 'Validée',
      red: s.redoublant ? 'Redoublant' : '',
    },
    { a: '2025-2026', c: s.classe[0] === '3' ? '4e A' : '5e B', e: 'Validée', red: '' },
  ]
  const journal = [
    ...st.journal.slice(0, 2),
    {
      auteur: 'Alseny Bangoura',
      action: 'Inscription validée',
      objet: `${s.classe} · 2026-2027`,
      date: '02/09/2026 à 09:30',
    },
  ]

  return (
    <Coque espace="scolarite" titre="Fiche élève" retour={retour}>
      <div className="flex max-w-[960px] flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-4 rounded-carte border border-bordure bg-white p-[18px]">
          <span
            className={cx(
              'flex size-16 items-center justify-center rounded-full text-section-lg font-extrabold',
              s.avatar
            )}
          >
            {s.initiales}
          </span>
          <div className="flex min-w-[180px] flex-1 flex-col gap-1">
            <span className="text-section-lg font-extrabold">{s.complet}</span>
            <span className="text-meta text-encre-3">
              Matricule {s.matricule} · {s.classe}
            </span>
            <Pastille etat={etatStatut(s)} taille="moyenne" className="self-start">
              {s.statut}
            </Pastille>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => notifier('Certificat de scolarité généré (PDF)')}
              className="h-[42px] rounded-champ border border-bordure-champ bg-white px-3.5 text-meta font-semibold text-encre-2"
            >
              Certificat
            </button>
            <button
              type="button"
              onClick={() => notifier('Mode édition — prototype')}
              className="h-[42px] rounded-champ bg-accent px-[18px] text-meta font-bold text-white"
            >
              Modifier
            </button>
          </div>
        </div>

        <Onglets
          aria-label="Sections de la fiche"
          variante="souligne"
          actif={actif}
          onChange={setActif}
          onglets={ONGLETS}
        />

        <div className="rounded-carte border border-bordure bg-white p-[18px]">
          {actif === 'id' && (
            <dl className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
              {identite.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-[3px]">
                  <dt className="text-leg text-encre-3">{k}</dt>
                  <dd className="text-moyen font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {actif === 'tut' && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3">
              {tuteurs.map((t) => (
                <div
                  key={t.nom}
                  className="flex flex-col gap-1.5 rounded-bouton border border-bordure p-3.5"
                >
                  <span className="text-moyen font-bold">{t.nom}</span>
                  <span className="text-leg font-semibold text-accent">{t.lien}</span>
                  <span className="text-meta">
                    <Icone nom="phone" className="w-[18px] text-encre-3" />
                    {t.tel}
                  </span>
                  <span className="text-meta">
                    <Icone nom="briefcase" className="w-[18px] text-encre-3" />
                    {t.prof}
                  </span>
                  <span className="text-meta">
                    <Icone nom="location-dot" className="w-[18px] text-encre-3" />
                    {t.adr}
                  </span>
                </div>
              ))}
            </div>
          )}
          {actif === 'sco' &&
            parcours.map((y) => (
              <div
                key={y.a}
                className="flex justify-between gap-2.5 border-b border-separateur py-3 text-corps"
              >
                <span className="font-bold">
                  {y.a} · {y.c} <span className="text-leg font-medium text-attention">{y.red}</span>
                </span>
                <span className="font-semibold text-succes">{y.e}</span>
              </div>
            ))}
          {actif === 'notes' && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-2.5">
              {MATIERES.map((m) => (
                <div
                  key={m.code}
                  className="flex items-center gap-2.5 rounded-champ bg-entete px-3 py-2.5"
                >
                  <Icone nom={m.icone} className="w-[18px] text-accent" />
                  <span className="flex-1 text-meta">
                    {m.nom} <span className="text-encre-3">· coef {m.coef}</span>
                  </span>
                  <strong>{fmt(ligne ? ligne.av[m.code] : s.moy[m.code])}</strong>
                </div>
              ))}
            </div>
          )}
          {actif === 'bul' &&
            (estAminata ? (
              ARCHIVES.map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between border-b border-separateur py-3 text-corps"
                >
                  <span>
                    <Icone nom="file-lines" className="mr-2.5 text-accent" />
                    {b.libelle} · {b.annee} · {b.classe}
                  </span>
                  <strong>{fmt(b.mg)}</strong>
                </div>
              ))
            ) : (
              <span className="text-corps text-encre-3">Aucun bulletin archivé.</span>
            ))}
          {actif === 'docs' && (
            <div className="flex flex-col gap-2.5">
              {PIECES.map(([l, k]) => {
                const manque = s.manquantes.includes(l) && inc
                return (
                  <div
                    key={k}
                    className="flex flex-wrap items-center gap-3 rounded-bouton border border-bordure p-3"
                  >
                    <Icone
                      nom={manque ? 'file-circle-exclamation' : 'file-circle-check'}
                      className={cx('text-[18px]', manque ? 'text-erreur' : 'text-succes')}
                    />
                    <div className="flex min-w-[160px] flex-1 flex-col gap-0.5">
                      <span className="text-corps font-semibold">{l}</span>
                      <span className="text-leg text-encre-3">
                        {manque
                          ? 'PDF ou image · 5 Mo max.'
                          : k === 'photo'
                            ? 'photo_identite.jpg · 312 Ko'
                            : `${k}_${s.nom.toLowerCase()}.pdf · 1,2 Mo`}
                      </span>
                    </div>
                    <Pastille etat={manque ? 'erreur' : 'succes'} taille="moyenne">
                      {manque ? 'Manquant' : 'Fourni'}
                    </Pastille>
                    {manque && (
                      <button
                        type="button"
                        onClick={() => {
                          modifier((x) => ({ docsDone: { ...x.docsDone, [s.id]: true } }))
                          journaliser(
                            auteur,
                            'Pièce ajoutée',
                            `${l} · ${s.nomU} ${s.prenom}`,
                            'Manquant',
                            'Fourni'
                          )
                          notifier('Pièce ajoutée au dossier')
                        }}
                        className="h-9 rounded-[9px] border border-accent bg-white px-3 text-meta font-bold text-accent"
                      >
                        <Icone nom="paperclip" className="mr-1.5" />
                        Joindre
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {actif === 'log' &&
            journal.map((l) => (
              <div
                key={l.action + l.date}
                className="flex flex-col gap-0.5 border-b border-separateur py-3"
              >
                <span className="text-corps font-bold">{l.action}</span>
                <span className="text-meta text-encre-2">{l.objet}</span>
                <span className="text-leg text-encre-4">
                  {l.auteur} · {l.date}
                </span>
              </div>
            ))}
        </div>
      </div>
    </Coque>
  )
}

/**
 * Données du portail famille, reprises de `parentVals` du prototype.
 * Un bulletin n'est visible qu'après publication par la direction (RG18).
 */
import { donneesClasse } from './calculs'
import { type EtatDemo } from './store'
import { rang } from '~/lib/format'
import { AMINATA, ARCHIVES, MATIERES, MOUSSA, suggerer, type Bulletin, type Eleve } from './donnees'

export type Enfant = { id: 'aminata' | 'moussa'; s: Eleve; classe: string }
export const ENFANTS: Enfant[] = [
  { id: 'aminata', s: AMINATA, classe: '3e A' },
  { id: 'moussa', s: MOUSSA, classe: '6e B' },
]

export const donneesPortail = (st: EtatDemo) => {
  const enfant = ENFANTS.find((k) => k.id === st.enfant) ?? ENFANTS[0]
  const estAminata = enfant.id === 'aminata'
  const publie = st.bul === 'published'
  const cd = donneesClasse(st)
  const moi = cd.lignes.find((r) => r.s.id === AMINATA.id)!

  const courant: Bulletin | null = publie
    ? {
        id: 'cur',
        libelle: '1er trimestre',
        annee: '2026-2027',
        classe: '3e A',
        mg: moi.mg ?? 0,
        rang: rang(moi.rang),
        effectif: cd.effectif,
        publie: st.pubAt ?? '',
        decision: st.dec[AMINATA.id] ?? suggerer(moi.mg),
        appr:
          st.apprG[AMINATA.id] ||
          'Élève sérieuse et impliquée. Le conseil l’encourage à maintenir ce niveau.',
        rectif: st.rectif,
        lignes: MATIERES.map((m) => ({
          code: m.code,
          v: moi.av[m.code],
          moyenne: cd.stats[m.code]?.moyenne ?? null,
          min: cd.stats[m.code]?.min ?? null,
          max: cd.stats[m.code]?.max ?? null,
          rang: moi.sr[m.code] ?? null,
          appr: m.code === 'MA' && st.appr[AMINATA.id] ? st.appr[AMINATA.id] : null,
        })),
      }
    : null

  const bulletins = estAminata ? [...(courant ? [courant] : []), ...ARCHIVES] : []
  return {
    enfant,
    estAminata,
    publie,
    cd,
    moi,
    courant,
    bulletins,
    enAttente: estAminata && !publie,
  }
}

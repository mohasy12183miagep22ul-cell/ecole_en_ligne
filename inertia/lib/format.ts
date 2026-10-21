/**
 * Formatage d'affichage uniquement (RG15) : l'arrondi à deux décimales ne
 * sert qu'à l'écran, jamais à un calcul intermédiaire.
 */
export const fmt = (n: number | null | undefined) =>
  typeof n !== 'number' || Number.isNaN(n) ? '—' : n.toFixed(2).replace('.', ',')

/** Valeur saisie ou stockée affichée avec la virgule décimale française. */
export const fmtv = (n: number | string) => String(n).replace('.', ',')

/** Convertit une saisie (« 12,5 ») en nombre, ou `null` si elle n'est pas numérique. */
export const num = (v: string): number | null => {
  const n = Number.parseFloat(v.replace(',', '.'))
  return Number.isNaN(n) ? null : n
}

/** Rang à l'affichage : 1er, 2e, 3e… */
export const rang = (n: number | null | undefined) =>
  typeof n !== 'number' ? '—' : n === 1 ? '1er' : `${n}e`

/** Initiales d'un nom complet, ex. « Fatoumata Diallo » → « FD ». */
export const initiales = (nom: string) =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0])
    .join('')
    .toUpperCase()

/** Classes utilitaires conditionnelles : `cx('a', cond && 'b')`. */
export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ')

import { type FormDataConvertible } from '@inertiajs/core'

type Donnees = Record<string, FormDataConvertible>

/** Champs texte vides envoyés comme `null` : le serveur n'accepte pas de chaîne vide. */
export const sansVides = (d: Donnees): Donnees =>
  Object.fromEntries(
    Object.entries(d).map(([k, v]) => [
      k,
      typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v,
    ])
  )

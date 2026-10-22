import type Inscription from '#models/inscription'
import { type TypeDocument } from '#models/document_inscription'

/**
 * Pièces du dossier (§ 3). Le certificat de transfert n'est exigé que pour
 * un élève venant d'un autre établissement (établissement d'origine
 * renseigné).
 */
export default class PiecesService {
  static obligatoires(inscription: Pick<Inscription, 'etablissementOrigine'>): TypeDocument[] {
    const types: TypeDocument[] = ['acte_naissance', 'bulletin_precedent', 'photo']
    if (inscription.etablissementOrigine) types.splice(2, 0, 'certificat_transfert')
    return types
  }

  /** Pièces obligatoires non fournies (RG6). Documents préchargés requis. */
  static manquantes(inscription: Inscription): TypeDocument[] {
    const fournies = new Set(
      (inscription.documents ?? []).filter((d) => d.fourni).map((d) => d.type)
    )
    return this.obligatoires(inscription).filter((t) => !fournies.has(t))
  }

  /**
   * Condition SQL « dossier incomplet » pour une inscription aliasée `t`
   * (`i` par défaut), cohérente avec `manquantes` (listes et filtres).
   */
  static sqlIncomplet(t = 'i') {
    return PiecesService.SQL_INCOMPLET.replace(/\bi\./g, `${t}.`)
  }

  static readonly SQL_INCOMPLET = `(
    EXISTS (
      SELECT 1 FROM unnest(
        CASE WHEN i.etablissement_origine IS NULL
          THEN ARRAY['acte_naissance','bulletin_precedent','photo']
          ELSE ARRAY['acte_naissance','bulletin_precedent','certificat_transfert','photo']
        END
      ) AS t(type)
      WHERE NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.inscription_id = i.id AND d.type::text = t.type
          AND d.fourni AND d.deleted_at IS NULL
      )
    )
  )`
}

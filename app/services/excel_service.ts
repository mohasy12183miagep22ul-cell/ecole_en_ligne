import ExcelJS from 'exceljs'

export type ColonneExcel = { cle: string; titre: string; largeur?: number }

/**
 * Classeurs Excel (exports de listes, registre, modèle d'import).
 */
export default class ExcelService {
  static async classeur(
    titre: string,
    colonnes: ColonneExcel[],
    lignes: Array<Record<string, string | number | null>>
  ) {
    const classeur = new ExcelJS.Workbook()
    classeur.creator = 'École en ligne'
    const feuille = classeur.addWorksheet(titre.slice(0, 31))
    feuille.columns = colonnes.map((c) => ({ header: c.titre, key: c.cle, width: c.largeur ?? 18 }))
    feuille.getRow(1).font = { bold: true }
    feuille.views = [{ state: 'frozen', ySplit: 1 }]
    for (const l of lignes) feuille.addRow(l)
    return Buffer.from(await classeur.xlsx.writeBuffer())
  }
}

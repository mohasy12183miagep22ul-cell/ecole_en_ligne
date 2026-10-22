import { DateTime } from 'luxon'
import ExcelJS from 'exceljs'
import db from '@adonisjs/lucid/services/db'
import Eleve from '#models/eleve'
import Tuteur, { LIENS_PARENTE, type LienParente } from '#models/tuteur'
import Classe from '#models/classe'
import Inscription from '#models/inscription'
import AnneeScolaire from '#models/annee_scolaire'
import DocumentInscription, {
  TYPES_DOCUMENT,
  type TypeDocument,
} from '#models/document_inscription'
import ImportEleves, { type ErreurImport, type LigneImport } from '#models/import_eleves'
import JournalService from '#services/journal_service'
import MatriculeService, { FORMAT_MATRICULE } from '#services/matricule_service'
import type { Auteur } from '#services/annee_scolaire_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'

/** Colonnes du modèle d'import, dans l'ordre (format fourni, § 4). */
export const COLONNES_IMPORT = [
  ['matricule', 'Matricule (si déjà attribué)'],
  ['anneeEntree', 'Année de première inscription'],
  ['nom', 'Nom *'],
  ['prenoms', 'Prénoms *'],
  ['sexe', 'Sexe (F/M) *'],
  ['dateNaissance', 'Date de naissance (JJ/MM/AAAA) *'],
  ['lieuNaissance', 'Lieu de naissance *'],
  ['nationalite', 'Nationalité'],
  ['numeroActe', 'N° d’acte de naissance'],
  ['classe', 'Classe *'],
  ['redoublant', 'Redoublant (oui/non)'],
  ['etablissementOrigine', 'Établissement d’origine'],
  ['tuteurNom', 'Tuteur : nom complet *'],
  ['tuteurLien', 'Tuteur : lien de parenté *'],
  ['tuteurTelephone', 'Tuteur : téléphone *'],
  ['tuteurProfession', 'Tuteur : profession'],
  ['tuteurAdresse', 'Tuteur : adresse'],
] as const

const LIENS_PAR_LIBELLE = Object.fromEntries(
  Object.entries(LIENS_PARENTE).map(([cle, libelle]) => [libelle.toLowerCase(), cle])
) as Record<string, LienParente>

/** Texte d'une cellule Excel, quel que soit son type. */
const texte = (v: ExcelJS.CellValue): string => {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return DateTime.fromJSDate(v, { zone: 'utc' }).toFormat('dd/MM/yyyy')
  if (typeof v === 'object' && 'text' in v) return String(v.text).trim()
  if (typeof v === 'object' && 'result' in v) return String(v.result ?? '').trim()
  return String(v).trim()
}

/**
 * Import initial des élèves depuis Excel (§ 4) : analyse ligne par ligne,
 * rapport d'erreurs, et rien d'enregistré tant que le rapport n'est pas
 * accepté. À l'acceptation, chaque ligne valide devient un élève (matricule
 * repris ou attribué, RG4), un tuteur et un dossier d'inscription soumis sur
 * l'année active ; les pièces se complètent ensuite (RG6 : pas de validation
 * sans pièces obligatoires).
 */
export default class ImportService {
  static async modele() {
    const classeur = new ExcelJS.Workbook()
    const feuille = classeur.addWorksheet('Élèves')
    feuille.columns = COLONNES_IMPORT.map(([cle, titre]) => ({
      header: titre,
      key: cle,
      width: 22,
    }))
    feuille.getRow(1).font = { bold: true }
    feuille.addRow({
      nom: 'Diallo',
      prenoms: 'Aminata',
      sexe: 'F',
      dateNaissance: '08/10/2011',
      lieuNaissance: 'Conakry',
      nationalite: 'Guinéenne',
      classe: '3e A',
      redoublant: 'non',
      tuteurNom: 'Fatoumata Diallo',
      tuteurLien: 'Mère',
      tuteurTelephone: '+224 622 14 87 30',
    })
    const aide = classeur.addWorksheet('Aide')
    aide.addRow(['Liens de parenté acceptés'])
    for (const l of Object.values(LIENS_PARENTE)) aide.addRow([l])
    return Buffer.from(await classeur.xlsx.writeBuffer())
  }

  /** Analyse du fichier : rien n'est encore écrit dans les tables métier. */
  static async analyser(chemin: string, nomFichier: string, annee: AnneeScolaire, auteur: Auteur) {
    const classeur = new ExcelJS.Workbook()
    try {
      await classeur.xlsx.readFile(chemin)
    } catch {
      throw new RegleGestionException(
        'Fichier illisible : utilisez le modèle Excel fourni (.xlsx).'
      )
    }
    const feuille = classeur.worksheets[0]
    if (!feuille) throw new RegleGestionException('Le fichier ne contient aucune feuille.')

    const classes = await Classe.query().where('annee_id', annee.id).whereNull('deleted_at')
    const parLibelle = new Map(classes.map((c) => [c.libelle.toLowerCase(), c]))
    const lignes: LigneImport[] = []
    const erreurs: ErreurImport[] = []
    const matriculesVus = new Set<string>()

    feuille.eachRow((row, numero) => {
      if (numero === 1) return
      const v = Object.fromEntries(
        COLONNES_IMPORT.map(([cle], i) => [cle, texte(row.getCell(i + 1).value)])
      ) as Record<(typeof COLONNES_IMPORT)[number][0], string>
      if (Object.values(v).every((x) => x === '')) return

      const avant = erreurs.length
      const erreur = (colonne: string, message: string) =>
        erreurs.push({ ligne: numero, colonne, message })

      for (const [cle, titre] of COLONNES_IMPORT) {
        if (titre.endsWith('*') && !v[cle]) erreur(titre.replace(' *', ''), 'Valeur obligatoire.')
      }
      const sexe = v.sexe.toUpperCase()
      if (v.sexe && !['F', 'M'].includes(sexe)) erreur('Sexe', 'F ou M attendu.')
      const naissance = DateTime.fromFormat(v.dateNaissance, 'dd/MM/yyyy')
      if (v.dateNaissance && (!naissance.isValid || naissance > DateTime.now())) {
        erreur('Date de naissance', 'Date invalide (JJ/MM/AAAA).')
      }
      const classe = parLibelle.get(v.classe.toLowerCase())
      if (v.classe && !classe)
        erreur('Classe', `Classe « ${v.classe} » inconnue en ${annee.libelle}.`)
      const lien = LIENS_PAR_LIBELLE[v.tuteurLien.toLowerCase()]
      if (v.tuteurLien && !lien)
        erreur('Lien de parenté', 'Valeur non reconnue (voir la feuille Aide).')
      if (v.tuteurTelephone && !/^[+\d][\d ]{7,}$/.test(v.tuteurTelephone)) {
        erreur('Téléphone', 'Numéro invalide, ex. +224 622 00 00 00.')
      }
      if (v.redoublant && !['oui', 'non'].includes(v.redoublant.toLowerCase())) {
        erreur('Redoublant', 'oui ou non attendu.')
      }
      if (v.matricule) {
        if (!FORMAT_MATRICULE.test(v.matricule))
          erreur('Matricule', 'Format AAAA-NNNNN attendu (RG4).')
        else if (matriculesVus.has(v.matricule))
          erreur('Matricule', 'Matricule en double dans le fichier.')
        matriculesVus.add(v.matricule)
      }
      const anneeEntree = v.anneeEntree ? Number(v.anneeEntree) : null
      if (
        v.anneeEntree &&
        (!Number.isInteger(anneeEntree) ||
          anneeEntree! < 1950 ||
          anneeEntree! > annee.dateDebut.year)
      ) {
        erreur('Année de première inscription', 'Année invalide.')
      }

      if (erreurs.length === avant) {
        lignes.push({
          ligne: numero,
          matricule: v.matricule || null,
          anneeEntree,
          nom: v.nom,
          prenoms: v.prenoms,
          sexe: sexe as 'F' | 'M',
          dateNaissance: naissance.toISODate()!,
          lieuNaissance: v.lieuNaissance,
          nationalite: v.nationalite || null,
          numeroActe: v.numeroActe || null,
          classeId: classe!.id,
          classe: classe!.libelle,
          redoublant: v.redoublant.toLowerCase() === 'oui',
          etablissementOrigine: v.etablissementOrigine || null,
          tuteurNom: v.tuteurNom,
          tuteurLien: lien,
          tuteurTelephone: v.tuteurTelephone,
          tuteurProfession: v.tuteurProfession || null,
          tuteurAdresse: v.tuteurAdresse || null,
        })
      }
    })

    // Matricules déjà attribués en base (RG4 : unique).
    const repris = lignes.filter((l) => l.matricule).map((l) => l.matricule!)
    if (repris.length) {
      const existants = await db.from('eleves').whereIn('matricule', repris).select('matricule')
      const pris = new Set(existants.map((r) => r.matricule))
      for (const l of [...lignes]) {
        if (l.matricule && pris.has(l.matricule)) {
          erreurs.push({
            ligne: l.ligne,
            colonne: 'Matricule',
            message: 'Matricule déjà attribué à un élève.',
          })
          lignes.splice(lignes.indexOf(l), 1)
        }
      }
    }
    if (lignes.length === 0 && erreurs.length === 0) {
      throw new RegleGestionException('Le fichier ne contient aucune ligne d’élève.')
    }

    return ImportEleves.create({
      userId: auteur.id,
      anneeId: annee.id,
      nomFichier: nomFichier.slice(0, 200),
      lignes,
      erreurs: erreurs.sort((a, b) => a.ligne - b.ligne),
      etat: 'analyse',
    })
  }

  /** Import en cours d'un utilisateur : on ne lit que ses propres imports. */
  static trouver(id: number, userId: number) {
    return ImportEleves.query()
      .where('id', id)
      .where('user_id', userId)
      .whereNull('deleted_at')
      .firstOrFail()
  }

  /** Abandon du rapport : rien n'est enregistré. */
  static async abandonner(imp: ImportEleves) {
    if (imp.etat !== 'analyse') throw new RegleGestionException('Cet import est déjà traité.')
    imp.etat = 'abandonne'
    await imp.save()
  }

  /**
   * Acceptation du rapport : enregistre les lignes valides, tout ou rien.
   * Les lignes en erreur sont écartées (à corriger et réimporter).
   */
  static async accepter(imp: ImportEleves, auteur: Auteur) {
    if (imp.etat !== 'analyse') throw new RegleGestionException('Cet import est déjà traité.')
    if (imp.lignes.length === 0) throw new RegleGestionException('Aucune ligne valide à importer.')

    return db.transaction(async (trx) => {
      const annee = await AnneeScolaire.findOrFail(imp.anneeId, { client: trx })
      if (annee.etat !== 'active') {
        throw new RegleGestionException('L’import se fait sur l’année active.', 'RG1')
      }
      const classes = await Classe.query({ client: trx }).whereIn('id', [
        ...new Set(imp.lignes.map((l) => l.classeId)),
      ])
      const niveauDe = new Map(classes.map((c) => [c.id, c.niveauId]))

      for (const l of imp.lignes) {
        const matricule =
          l.matricule ??
          (await MatriculeService.attribuer(l.anneeEntree ?? annee.dateDebut.year, trx))
        const eleve = await Eleve.create(
          {
            matricule,
            nom: l.nom,
            prenoms: l.prenoms,
            sexe: l.sexe,
            dateNaissance: DateTime.fromISO(l.dateNaissance),
            lieuNaissance: l.lieuNaissance,
            nationalite: l.nationalite,
            numeroActe: l.numeroActe,
            statut: null,
          },
          { client: trx }
        )
        // Fratrie : un tuteur déjà connu (même nom et même téléphone) est réutilisé.
        const tuteur =
          (await Tuteur.query({ client: trx })
            .whereRaw('sans_accent(lower(nom)) = sans_accent(lower(?))', [l.tuteurNom])
            .where('telephone', l.tuteurTelephone)
            .whereNull('deleted_at')
            .first()) ??
          (await Tuteur.create(
            {
              nom: l.tuteurNom,
              lienParente: l.tuteurLien as LienParente,
              telephone: l.tuteurTelephone,
              profession: l.tuteurProfession,
              adresse: l.tuteurAdresse,
            },
            { client: trx }
          ))
        await trx.table('eleve_tuteur').insert({
          eleve_id: eleve.id,
          tuteur_id: tuteur.id,
          principal: true,
          created_at: new Date(),
        })

        const inscription = await Inscription.create(
          {
            eleveId: eleve.id,
            anneeId: annee.id,
            niveauId: niveauDe.get(l.classeId)!,
            classeId: l.classeId,
            dateInscription: DateTime.now(),
            etat: 'soumis',
            redoublant: l.redoublant,
            etablissementOrigine: l.etablissementOrigine,
          },
          { client: trx }
        )
        await DocumentInscription.createMany(
          (Object.keys(TYPES_DOCUMENT) as TypeDocument[]).map((type) => ({
            inscriptionId: inscription.id,
            type,
            fourni: false,
          })),
          { client: trx }
        )
      }

      imp.useTransaction(trx)
      imp.etat = 'accepte'
      await imp.save()
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: 'Import initial des élèves',
          entite: 'imports',
          entiteId: imp.id,
          apres: {
            fichier: imp.nomFichier,
            importes: imp.lignes.length,
            ecartes: imp.erreurs.length,
          },
          ip: auteur.ip,
        },
        trx
      )
      return imp.lignes.length
    })
  }
}

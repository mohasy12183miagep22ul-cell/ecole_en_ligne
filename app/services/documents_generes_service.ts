import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import FichierGenere, { type FormatFichier, type TypeFichierGenere } from '#models/fichier_genere'
import AnneeScolaire from '#models/annee_scolaire'
import GenererDocumentJob from '#jobs/generer_document_job'
import PdfService from '#services/pdf_service'
import ExcelService from '#services/excel_service'
import StockageService from '#services/stockage_service'
import EleveService, { type FiltresEleves } from '#services/eleve_service'
import EtablissementService from '#services/etablissement_service'
import { COLONNES_ELEVES, valeurColonne, type ColonneEleve } from '#services/colonnes_eleves'
import RegleGestionException from '#exceptions/regle_gestion_exception'

type Demande = {
  type: TypeFichierGenere
  format: FormatFichier
  libelle: string
  parametres: Record<string, unknown>
}

const aujourdhui = () => DateTime.now().setZone('Africa/Conakry').toFormat('dd/MM/yyyy')

/**
 * Documents produits en file d'attente (§ 9) : certificats de scolarité,
 * listes d'élèves et listes de classe, registre des inscriptions. La demande
 * rend la main tout de suite ; le fichier apparaît dans « Mes documents »
 * quand il est prêt.
 */
export default class DocumentsGeneresService {
  static async demander(demande: Demande, userId: number) {
    const fichier = await FichierGenere.create({ ...demande, userId, etat: 'en_attente' })
    await GenererDocumentJob.dispatch({ fichierId: fichier.id })
    return fichier
  }

  static mesDocuments(userId: number) {
    return FichierGenere.query()
      .where('user_id', userId)
      .whereNull('deleted_at')
      .orderBy('id', 'desc')
      .limit(30)
  }

  /** Exécution par le travailleur de la file d'attente. */
  static async traiter(fichierId: number) {
    const f = await FichierGenere.findOrFail(fichierId)
    if (f.etat !== 'en_attente') return
    try {
      const contenu = await this.#produire(f)
      const cle = `generes/${randomUUID()}.${f.format}`
      await StockageService.ecrire(cle, contenu)
      f.merge({ etat: 'pret', fichier: cle, erreur: null })
    } catch (erreur) {
      f.merge({ etat: 'echec', erreur: String((erreur as Error).message).slice(0, 500) })
    }
    await f.save()
  }

  static async #produire(f: FichierGenere): Promise<Buffer> {
    const etablissement = await EtablissementService.parametres()
    switch (f.type) {
      case 'certificats':
        return this.#certificats(f.parametres.inscriptionIds as number[], etablissement)
      case 'liste_eleves':
        return this.#listeEleves(
          f,
          f.parametres.filtres as FiltresEleves,
          f.parametres.colonnes as ColonneEleve[],
          (f.parametres.inscriptionIds as number[] | null) ?? null,
          etablissement
        )
      case 'registre':
        return this.#registre(f, Number(f.parametres.anneeId), etablissement)
    }
  }

  /**
   * Certificats de scolarité : uniquement pour une inscription validée
   * (le certificat atteste une scolarité réelle).
   */
  static async #certificats(inscriptionIds: number[], etablissement: unknown) {
    const lignes = await db
      .from('inscriptions as i')
      .join('eleves as e', 'e.id', 'i.eleve_id')
      .join('classes as c', 'c.id', 'i.classe_id')
      .join('annees_scolaires as a', 'a.id', 'i.annee_id')
      .whereIn('i.id', inscriptionIds)
      .where('i.etat', 'valide')
      .whereNull('i.deleted_at')
      .select(
        'e.nom',
        'e.prenoms',
        'e.sexe',
        'e.matricule',
        'e.date_naissance',
        'e.lieu_naissance',
        'c.libelle as classe',
        'a.libelle as annee'
      )
      .orderBy('e.nom')
    if (lignes.length === 0) {
      throw new RegleGestionException('Aucune inscription validée : pas de certificat à éditer.')
    }
    return PdfService.depuisGabarit('certificats', {
      etablissement,
      date: aujourdhui(),
      eleves: lignes.map((l) => ({
        ...l,
        nomComplet: `${l.prenoms} ${String(l.nom).toUpperCase()}`,
        naissance: DateTime.fromJSDate(l.date_naissance).toFormat('dd/MM/yyyy'),
      })),
    })
  }

  static async #listeEleves(
    f: FichierGenere,
    filtres: FiltresEleves,
    colonnes: ColonneEleve[],
    selection: number[] | null,
    etablissement: unknown
  ) {
    const valides = colonnes.filter((c) => c in COLONNES_ELEVES)
    const requete = EleveService.requete(filtres)
    if (selection?.length) requete.whereIn('i.id', selection)
    const lignes = await requete
    if (f.format === 'xlsx') {
      return ExcelService.classeur(
        'Élèves',
        valides.map((c) => ({
          cle: c,
          titre: COLONNES_ELEVES[c],
          largeur: c === 'eleve' ? 32 : 16,
        })),
        lignes.map((l: Record<string, unknown>) =>
          Object.fromEntries(valides.map((c) => [c, valeurColonne(l, c)]))
        )
      )
    }
    return PdfService.depuisGabarit('liste', {
      etablissement,
      titre: f.libelle,
      date: aujourdhui(),
      colonnes: valides.map((c) => COLONNES_ELEVES[c]),
      lignes: lignes.map((l: Record<string, unknown>) => valides.map((c) => valeurColonne(l, c))),
    })
  }

  /** Registre des inscriptions validées de l'année, dans l'ordre de validation. */
  static async #registre(f: FichierGenere, anneeId: number, etablissement: unknown) {
    const annee = await AnneeScolaire.findOrFail(anneeId)
    const lignes = await db
      .from('inscriptions as i')
      .join('eleves as e', 'e.id', 'i.eleve_id')
      .join('classes as c', 'c.id', 'i.classe_id')
      .where('i.annee_id', anneeId)
      .where('i.etat', 'valide')
      .whereNull('i.deleted_at')
      .select(
        'i.valide_le',
        'e.matricule',
        'e.nom',
        'e.prenoms',
        'e.sexe',
        'e.date_naissance',
        'c.libelle as classe',
        'i.redoublant',
        'i.etablissement_origine'
      )
      .orderBy('i.valide_le')
    const colonnes = [
      { cle: 'numero', titre: 'N°', largeur: 6 },
      { cle: 'date', titre: 'Date', largeur: 12 },
      { cle: 'matricule', titre: 'Matricule', largeur: 12 },
      { cle: 'nom', titre: 'Nom', largeur: 18 },
      { cle: 'prenoms', titre: 'Prénoms', largeur: 22 },
      { cle: 'sexe', titre: 'Sexe', largeur: 6 },
      { cle: 'naissance', titre: 'Naissance', largeur: 12 },
      { cle: 'classe', titre: 'Classe', largeur: 10 },
      { cle: 'redoublant', titre: 'Redoublant', largeur: 11 },
      { cle: 'origine', titre: 'Établissement d’origine', largeur: 26 },
    ]
    const donnees = lignes.map((l, n) => ({
      numero: n + 1,
      date: DateTime.fromJSDate(l.valide_le).toFormat('dd/MM/yyyy'),
      matricule: l.matricule,
      nom: String(l.nom).toUpperCase(),
      prenoms: l.prenoms,
      sexe: l.sexe,
      naissance: DateTime.fromJSDate(l.date_naissance).toFormat('dd/MM/yyyy'),
      classe: l.classe,
      redoublant: l.redoublant ? 'Oui' : 'Non',
      origine: l.etablissement_origine ?? '',
    }))
    if (f.format === 'xlsx')
      return ExcelService.classeur(`Registre ${annee.libelle}`, colonnes, donnees)
    return PdfService.depuisGabarit('liste', {
      etablissement,
      titre: `Registre des inscriptions ${annee.libelle}`,
      date: aujourdhui(),
      colonnes: colonnes.map((c) => c.titre),
      lignes: donnees.map((d) => colonnes.map((c) => String(d[c.cle as keyof typeof d] ?? ''))),
    })
  }
}

import { DateTime } from 'luxon'
import User from '#models/user'
import Eleve from '#models/eleve'
import Tuteur, { type LienParente } from '#models/tuteur'
import Classe from '#models/classe'
import Inscription from '#models/inscription'
import AnneeScolaire from '#models/annee_scolaire'
import DocumentInscription, {
  TYPES_DOCUMENT,
  type TypeDocument,
} from '#models/document_inscription'
import MatriculeService from '#services/matricule_service'
import StockageService from '#services/stockage_service'
import db from '@adonisjs/lucid/services/db'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

/**
 * Élèves de démonstration (consigne du projet : 200 élèves) répartis dans
 * les 6 classes de l'année active, avec tuteurs (dont des fratries),
 * inscriptions et pièces. Pour exercer tous les écrans :
 * - 188 inscriptions validées, dont 2 élèves transférés en cours d'année ;
 * - 9 dossiers soumis à la direction (complets, incomplets, sans classe) ;
 * - 3 brouillons.
 * Les pièces pointent vers deux fichiers d'exemple du stockage privé.
 * S'exécute après structure_demo_seeder (ordre alphabétique). Ne fait rien
 * si des élèves existent déjà.
 */
const PRENOMS_F = [
  'Aminata',
  'Mariama',
  'Fatoumata',
  'Kadiatou',
  'Hawa',
  'Aïssatou',
  'Djénabou',
  'Oumou',
  'Nènè',
  'Fanta',
  'Mabinty',
  'Kadidja',
  'Safiatou',
  'Ramatoulaye',
  'Bintou',
  'Saran',
]
const PRENOMS_M = [
  'Mamadou',
  'Ibrahima',
  'Alpha',
  'Ousmane',
  'Thierno',
  'Sekou',
  'Lansana',
  'Moussa',
  'Abdoulaye',
  'Boubacar',
  'Mohamed',
  'Amadou',
  'Souleymane',
  'Karamo',
  'Fodé',
  'Aboubacar',
]
const NOMS = [
  'Diallo',
  'Barry',
  'Bah',
  'Camara',
  'Sylla',
  'Soumah',
  'Condé',
  'Keïta',
  'Touré',
  'Kourouma',
  'Bangoura',
  'Kaba',
  'Cissé',
  'Sow',
  'Fofana',
  'Doumbouya',
  'Haïdara',
  'Kanté',
  'Baldé',
  'Traoré',
]
const LIEUX = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Boké', 'Mamou', 'Nzérékoré', 'Faranah']
const QUARTIERS = ['Kipé, Ratoma', 'Matoto', 'Kaloum', 'Dixinn', 'Lambanyi', 'Sonfonia', 'Cosa']
const METIERS = [
  'Commerçante',
  'Enseignant',
  'Infirmière',
  'Chauffeur',
  'Fonctionnaire',
  'Ingénieur',
  'Couturière',
  'Agriculteur',
]
const ORIGINES = ['Collège Sainte-Marie', 'Groupe scolaire La Source', 'Collège de Kipé']
const CLASSES = ['6e A', '6e B', '4e A', '4e B', '3e A', '3e B']
/** Années de naissance par niveau. */
const NAISSANCE: Record<string, number> = { '6': 2015, '4': 2013, '3': 2012 }

/** PDF d'une page, vide : sert de pièce d'exemple. */
const PDF_EXEMPLE = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'
)
/** Image PNG d'un pixel : photo d'exemple. */
const PNG_EXEMPLE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
)
/** Tirage pseudo-aléatoire reproductible (mêmes élèves à chaque peuplement). */
const tirage = (i: number, graine: number) =>
  Math.imul(i * 31 + graine * 7919 + 1, 2654435761) >>> 16

const CLE_PDF = 'pieces/exemple-demonstration.pdf'
const CLE_PNG = 'photos/exemple-demonstration.png'

export default class extends BaseSeeder {
  static environment = ['development']

  async run() {
    const annee = await AnneeScolaire.query()
      .where('etat', 'active')
      .whereNull('deleted_at')
      .first()
    if (!annee) return
    const deja = await Eleve.query().whereNull('deleted_at').count('* as total')
    if (Number(deja[0].$extras.total) > 0) return

    await StockageService.ecrire(CLE_PDF, PDF_EXEMPLE)
    await StockageService.ecrire(CLE_PNG, PNG_EXEMPLE)

    const direction = await User.findByOrFail('email', 'm.camara@flamboyants.edu.gn')
    const famille = await User.findBy('email', 'f.diallo@mail.gn')
    const classes = await Classe.query().where('annee_id', annee.id).whereNull('deleted_at')
    const parLibelle = new Map(classes.map((c) => [c.libelle, c]))

    await db.transaction(async (trx) => {
      let tuteurPrecedent: Tuteur | null = null

      for (let i = 0; i < 200; i++) {
        const classe = parLibelle.get(CLASSES[i % CLASSES.length])
        if (!classe) continue
        const fille = i % 2 === 0
        const premier = i === 0
        const nom = premier ? 'Diallo' : NOMS[tirage(i, 1) % NOMS.length]
        const prenoms = premier
          ? 'Aminata'
          : fille
            ? PRENOMS_F[tirage(i, 2) % PRENOMS_F.length]
            : PRENOMS_M[tirage(i, 3) % PRENOMS_M.length]
        const niveau = classe.libelle[0]
        const naissance = DateTime.fromObject({
          year: NAISSANCE[niveau] - (i % 9 === 0 ? 1 : 0),
          month: (i % 12) + 1,
          day: (i % 27) + 1,
        })
        // Les anciens élèves gardent le matricule de leur première inscription (RG4).
        const entree = 2026 - (niveau === '3' ? 3 : niveau === '4' ? 2 : 0) + (i % 10 === 0 ? 1 : 0)

        const etat: Inscription['etat'] =
          i < 188 ? 'valide' : i < 194 || i >= 197 ? 'soumis' : 'brouillon'
        const transfere = i === 50 || i === 121
        const origine = i % 11 === 5 ? ORIGINES[i % ORIGINES.length] : null

        const eleve = await Eleve.create(
          {
            matricule: await MatriculeService.attribuer(Math.min(entree, 2026), trx),
            nom,
            prenoms,
            sexe: fille ? 'F' : 'M',
            dateNaissance: naissance,
            lieuNaissance: LIEUX[i % LIEUX.length],
            nationalite: 'Guinéenne',
            numeroActe: `CKY-${naissance.year}-${String(4000 + i * 13).padStart(5, '0')}`,
            // Pas de photo affichée : l'image d'exemple n'est qu'un pixel.
            photo: null,
            statut: etat === 'valide' ? (transfere ? 'transfere' : 'inscrit') : null,
            statutMotif: transfere ? 'Déménagement de la famille' : null,
            statutDate: transfere ? DateTime.fromISO('2026-11-04') : null,
          },
          { client: trx }
        )

        // Fratries : un élève sur sept partage le tuteur du précédent.
        const fratrie = i % 7 === 6 && tuteurPrecedent !== null
        const tuteur: Tuteur = fratrie
          ? tuteurPrecedent!
          : await Tuteur.create(
              {
                nom: premier
                  ? 'Fatoumata Diallo'
                  : `${fille ? PRENOMS_F[tirage(i, 4) % 16] : PRENOMS_M[tirage(i, 5) % 16]} ${nom}`,
                lienParente: (['mere', 'pere', 'oncle', 'tante'] as LienParente[])[i % 4],
                telephone: `+224 62${i % 10} ${String(10 + (i % 90)).padStart(2, '0')} ${String((i * 37) % 100).padStart(2, '0')} ${String((i * 53) % 100).padStart(2, '0')}`,
                profession: METIERS[i % METIERS.length],
                adresse: `${QUARTIERS[i % QUARTIERS.length]}, Conakry`,
                email: premier ? (famille?.email ?? null) : null,
                userId: premier ? (famille?.id ?? null) : null,
              },
              { client: trx }
            )
        tuteurPrecedent = tuteur
        await trx.table('eleve_tuteur').insert({
          eleve_id: eleve.id,
          tuteur_id: tuteur.id,
          principal: true,
          created_at: new Date(),
        })

        const date = DateTime.fromISO('2026-07-01').plus({ days: i % 60 })
        const inscription = await Inscription.create(
          {
            eleveId: eleve.id,
            anneeId: annee.id,
            niveauId: classe.niveauId,
            classeId: i >= 197 ? null : classe.id,
            dateInscription: date,
            etat,
            redoublant: i % 13 === 4,
            etablissementOrigine: origine,
            validePar: etat === 'valide' ? direction.id : null,
            valideLe: etat === 'valide' ? date.plus({ days: 5 }) : null,
          },
          { client: trx }
        )

        // Dossiers incomplets : deux soumis et les brouillons.
        const manquantes: TypeDocument[] =
          i === 192 || i === 193
            ? ['acte_naissance', 'photo']
            : etat === 'brouillon'
              ? ['bulletin_precedent']
              : []
        await DocumentInscription.createMany(
          (Object.keys(TYPES_DOCUMENT) as TypeDocument[]).map((type) => {
            const exige = type !== 'certificat_transfert' || origine !== null
            const fourni = exige && !manquantes.includes(type)
            const photo = type === 'photo'
            return {
              inscriptionId: inscription.id,
              type,
              fourni,
              fichier: fourni ? (photo ? CLE_PNG : CLE_PDF) : null,
              nomOrigine: fourni ? (photo ? 'photo_identite.png' : `${type}.pdf`) : null,
              mime: fourni ? (photo ? 'image/png' : 'application/pdf') : null,
              taille: fourni ? (photo ? PNG_EXEMPLE.length : PDF_EXEMPLE.length) : null,
            }
          }),
          { client: trx }
        )
      }
    })
  }
}

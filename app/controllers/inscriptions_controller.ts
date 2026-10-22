import { DateTime } from 'luxon'
import InscriptionPolicy from '#policies/inscription_policy'
import type Inscription from '#models/inscription'
import DocumentInscription, {
  TYPES_DOCUMENT,
  type TypeDocument,
} from '#models/document_inscription'
import { LIENS_PARENTE } from '#models/tuteur'
import EleveService from '#services/eleve_service'
import TuteurService from '#services/tuteur_service'
import PiecesService from '#services/pieces_service'
import StockageService from '#services/stockage_service'
import StructureService from '#services/structure_service'
import InscriptionService, { type FichiersDossier } from '#services/inscription_service'
import {
  changerClasseValidator,
  dossierValidator,
  motifValidator,
  pieceValidator,
} from '#validators/scolarite'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

const ETATS: Record<string, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  valide: 'Validé',
  refuse: 'Refusé',
  annule: 'Annulé',
}

export default class InscriptionsController {
  /** Assistant d'inscription en trois étapes (§ 3). */
  async create(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer')
    const annee = ctx.anneeActive
    const qEleve = String(ctx.request.input('qEleve', '')).trim()
    const qTuteur = String(ctx.request.input('qTuteur', '')).trim()

    const niveaux = await StructureService.niveaux()
    const eleves = qEleve.length >= 2 ? await EleveService.rechercherConnus(qEleve) : []
    const tuteurs = qTuteur.length >= 2 ? await TuteurService.rechercher(qTuteur) : []

    return ctx.inertia.render('scolarite/inscription', {
      annee: annee ? { id: annee.id, libelle: annee.libelle } : null,
      niveaux: niveaux.map((n) => ({ id: n.id, libelle: n.libelle })),
      classes: annee ? await InscriptionService.classesAvecEffectif(annee.id) : [],
      liens: Object.entries(LIENS_PARENTE).map(([cle, libelle]) => ({ cle, libelle })),
      elevesConnus: eleves.map((e) => ({
        id: e.id,
        matricule: e.matricule,
        nom: e.nom,
        prenoms: e.prenoms,
        sexe: e.sexe,
        dateNaissance: e.dateNaissance.toISODate()!,
        lieuNaissance: e.lieuNaissance,
        statut: e.statut,
        sorti: e.estSorti,
      })),
      tuteursConnus: tuteurs.map((t) => ({
        id: t.id,
        nom: t.nom,
        lien: LIENS_PARENTE[t.lienParente],
        telephone: t.telephone,
      })),
    })
  }

  /** Enregistrement du dossier, pièces comprises, en une transaction. */
  async store(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer')
    const d = await ctx.request.validateUsing(dossierValidator)

    const fichiers: FichiersDossier = {}
    if (d.photo) fichiers.photo = await StockageService.deposer(d.photo, 'photos', 'image')
    for (const type of ['acte_naissance', 'bulletin_precedent', 'certificat_transfert'] as const) {
      const f = d[type]
      if (f) fichiers[type] = await StockageService.deposer(f, 'pieces', 'pdf_ou_image')
    }

    const { eleve } = await InscriptionService.creerDossier(
      {
        eleveId: d.eleveId ?? null,
        identite: d.eleveId
          ? null
          : {
              nom: d.nom!,
              prenoms: d.prenoms!,
              sexe: d.sexe!,
              dateNaissance: d.dateNaissance!,
              lieuNaissance: d.lieuNaissance!,
              nationalite: d.nationalite ?? null,
              numeroActe: d.numeroActe ?? null,
            },
        tuteurId: d.tuteurId ?? null,
        tuteur: d.tuteurNom
          ? {
              nom: d.tuteurNom,
              lienParente: d.tuteurLien!,
              telephone: d.tuteurTelephone!,
              profession: d.tuteurProfession ?? null,
              adresse: d.tuteurAdresse ?? null,
            }
          : null,
        niveauId: d.niveauId,
        classeId: d.classeId ?? null,
        redoublant: d.redoublant,
        etablissementOrigine: d.etablissementOrigine ?? null,
        soumettre: d.soumettre,
      },
      fichiers,
      auteur(ctx)
    )

    ctx.session.flash(
      'success',
      d.soumettre
        ? `Dossier de ${eleve.nomComplet} soumis à la direction`
        : `Brouillon enregistré pour ${eleve.nomComplet}`
    )
    return ctx.response
      .redirect()
      .toRoute('scolarite.fiche', { id: eleve.id }, { qs: { onglet: 'inscriptions' } })
  }

  /** Fiche d'inscription imprimable (HTML, à imprimer ou enregistrer en PDF). */
  async fiche(ctx: HttpContext) {
    const inscription = await InscriptionService.trouver(ctx.params.id)
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer', inscription)
    await inscription.load('annee')
    await inscription.load('niveau')
    await inscription.load('classe')
    const eleve = await EleveService.trouver(inscription.eleveId)
    const obligatoires = PiecesService.obligatoires(inscription)

    ctx.response.header('Cache-Control', 'private, no-store')
    return ctx.view.render('fiche_inscription', {
      annee: inscription.annee.libelle,
      niveau: inscription.niveau.libelle,
      classe: inscription.classe?.libelle ?? null,
      etat: ETATS[inscription.etat],
      dateDossier: inscription.dateInscription.toFormat('dd/MM/yyyy'),
      redoublant: inscription.redoublant,
      origine: inscription.etablissementOrigine,
      eleve,
      naissance: eleve.dateNaissance.toFormat('dd/MM/yyyy'),
      tuteurs: eleve.tuteurs.map((t) => ({
        nom: t.nom,
        lien: LIENS_PARENTE[t.lienParente],
        telephone: t.telephone,
        profession: t.profession,
        adresse: t.adresse,
        principal: Boolean(t.$extras.pivot_principal),
      })),
      pieces: (Object.keys(TYPES_DOCUMENT) as TypeDocument[]).map((type) => ({
        libelle: TYPES_DOCUMENT[type],
        etat: inscription.documents.some((x) => x.type === type && x.fourni)
          ? 'Fournie'
          : obligatoires.includes(type)
            ? 'Manquante'
            : 'Non exigée',
      })),
    })
  }

  async soumettre(ctx: HttpContext) {
    const inscription = await InscriptionService.trouver(ctx.params.id)
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer', inscription)
    await InscriptionService.soumettre(inscription, auteur(ctx))
    ctx.session.flash('success', 'Dossier soumis à la direction')
    return ctx.response.redirect().back()
  }

  async annuler(ctx: HttpContext) {
    const inscription = await InscriptionService.trouver(ctx.params.id)
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer', inscription)
    const { motif } = await ctx.request.validateUsing(motifValidator)
    await InscriptionService.annuler(inscription, motif, auteur(ctx))
    ctx.session.flash('success', 'Dossier annulé')
    return ctx.response.redirect().back()
  }

  /** Dépôt ou remplacement d'une pièce (5 Mo, type vérifié sur le contenu). */
  async deposerPiece(ctx: HttpContext) {
    const inscription = await InscriptionService.trouver(ctx.params.id)
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer', inscription)
    const type = ctx.params.type as TypeDocument
    if (!(type in TYPES_DOCUMENT)) return ctx.response.notFound()
    const { fichier } = await ctx.request.validateUsing(pieceValidator)
    const stocke =
      type === 'photo'
        ? await StockageService.deposer(fichier, 'photos', 'image')
        : await StockageService.deposer(fichier, 'pieces', 'pdf_ou_image')
    await InscriptionService.deposerPiece(inscription, type, stocke, auteur(ctx))
    ctx.session.flash('success', `${TYPES_DOCUMENT[type]} enregistrée`)
    return ctx.response.redirect().back()
  }

  /** Lecture d'une pièce : route authentifiée, droits vérifiés, jamais d'URL publique. */
  async lirePiece(ctx: HttpContext) {
    const document = await DocumentInscription.query()
      .where('id', ctx.params.id)
      .whereNull('deleted_at')
      .where('fourni', true)
      .firstOrFail()
    const inscription = await InscriptionService.trouver(document.inscriptionId)
    await ctx.bouncer.with(InscriptionPolicy).authorize('lirePiece', inscription)
    const flux = await InscriptionService.lirePiece(document)
    if (!flux) return ctx.response.notFound()

    const extension =
      document.mime === 'application/pdf' ? 'pdf' : document.mime === 'image/png' ? 'png' : 'jpg'
    ctx.response.header('Content-Type', document.mime!)
    ctx.response.header('Cache-Control', 'private, no-store')
    ctx.response.header('X-Content-Type-Options', 'nosniff')
    ctx.response.header(
      'Content-Disposition',
      `inline; filename="${document.type}-${inscription.eleve.matricule}.${extension}"`
    )
    return ctx.response.stream(flux)
  }

  /** Changement de classe d'une sélection d'élèves (§ 4, RG7). */
  async changerClasse(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer')
    const d = await ctx.request.validateUsing(changerClasseValidator)
    if (d.forcer) await ctx.bouncer.with(InscriptionPolicy).authorize('forcerCapacite')
    const nombre = await InscriptionService.changerClasse(
      d.inscriptionIds,
      d.classeId,
      d.forcer ? { motif: d.motifDepassement ?? '' } : null,
      auteur(ctx)
    )
    ctx.session.flash(
      'success',
      nombre
        ? `${nombre} élève${nombre > 1 ? 's' : ''} changé${nombre > 1 ? 's' : ''} de classe`
        : 'Aucun changement : les élèves sont déjà dans cette classe'
    )
    return ctx.response.redirect().back()
  }

  /** Dossiers à compléter : soumis ou validés avec des pièces manquantes (§ 3). */
  async dossiers(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer')
    const annee = ctx.anneeActive
    const page = Math.max(1, Number(ctx.request.input('page', 1)) || 1)
    if (!annee) {
      return ctx.inertia.render('scolarite/dossiers', {
        annee: null,
        dossiers: [],
        pagination: { page: 1, dernierePage: 1, total: 0 },
      })
    }
    const resultat = await InscriptionService.dossiers(
      annee.id,
      ['brouillon', 'soumis', 'valide'],
      true,
      page
    )
    return ctx.inertia.render('scolarite/dossiers', {
      annee: { id: annee.id, libelle: annee.libelle },
      dossiers: resultat.all().map((i) => versDossier(i)),
      pagination: {
        page: resultat.currentPage,
        dernierePage: resultat.lastPage,
        total: resultat.total,
      },
    })
  }
}

/** Ligne de dossier commune aux écrans « à compléter » et « à valider ». */
export function versDossier(i: Inscription) {
  const eleve = i.eleve
  return {
    id: i.id,
    eleveId: eleve.id,
    matricule: eleve.matricule,
    nom: eleve.nom,
    prenoms: eleve.prenoms,
    sexe: eleve.sexe,
    niveauId: i.niveauId,
    niveau: i.niveau.libelle,
    classeId: i.classeId,
    classe: i.classe?.libelle ?? null,
    etat: i.etat,
    redoublant: i.redoublant,
    origine: i.etablissementOrigine,
    date: i.dateInscription.toFormat('dd/MM/yyyy'),
    depuis: Math.max(0, Math.floor(DateTime.now().diff(i.dateInscription, 'days').days)),
    manquantes: PiecesService.manquantes(i).map((t) => TYPES_DOCUMENT[t]),
  }
}

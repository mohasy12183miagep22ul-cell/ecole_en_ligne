import { DateTime } from 'luxon'
import ElevePolicy from '#policies/eleve_policy'
import InscriptionPolicy from '#policies/inscription_policy'
import EleveService, { type FiltresEleves } from '#services/eleve_service'
import ChoixService from '#services/choix_service'
import StructureService from '#services/structure_service'
import PiecesService from '#services/pieces_service'
import StockageService from '#services/stockage_service'
import MoyenneService from '#services/moyenne_service'
import InscriptionService from '#services/inscription_service'
import AnneeScolaireService from '#services/annee_scolaire_service'
import { COLONNES_ELEVES } from '#services/colonnes_eleves'
import { TYPES_DOCUMENT } from '#models/document_inscription'
import { LIENS_PARENTE } from '#models/tuteur'
import type { StatutEleve } from '#models/eleve'
import type Inscription from '#models/inscription'
import {
  identiteValidator,
  listeElevesValidator,
  motifValidator,
  statutValidator,
} from '#validators/scolarite'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

const iso = (d: unknown) =>
  d instanceof Date ? DateTime.fromJSDate(d).toISODate()! : d ? String(d) : null

export default class ElevesController {
  /** Liste des élèves : recherche, filtres cumulables, pagination serveur (§ 4). */
  async index(ctx: HttpContext) {
    await ctx.bouncer.with(ElevePolicy).authorize('voir')
    const q = await listeElevesValidator.validate(ctx.request.qs())
    const annee = await AnneeScolaireService.selectionner(q.annee, ctx.anneeActive)
    const niveaux = await StructureService.niveaux()
    const base = {
      annees: await ChoixService.annees(),
      niveaux: niveaux.map((n) => ({ id: n.id, libelle: n.libelle })),
      colonnes: Object.entries(COLONNES_ELEVES).map(([cle, libelle]) => ({ cle, libelle })),
    }
    if (!annee) {
      return ctx.inertia.render('scolarite/eleves', {
        ...base,
        annee: null,
        classes: [],
        filtres: {},
        eleves: [],
        pagination: { page: 1, dernierePage: 1, total: 0 },
      })
    }

    const filtres: FiltresEleves = {
      anneeId: annee.id,
      q: q.q ?? undefined,
      niveauId: q.niveau,
      classeId: q.classe,
      sexe: q.sexe,
      statut: q.statut,
      redoublant: q.redoublant,
      incomplet: q.incomplet,
    }
    const resultat = await EleveService.lister(filtres, q.page ?? 1)
    const meta = resultat.getMeta()

    return ctx.inertia.render('scolarite/eleves', {
      ...base,
      annee: { id: annee.id, libelle: annee.libelle, etat: annee.etat },
      classes: await InscriptionService.classesAvecEffectif(annee.id),
      filtres: {
        q: filtres.q ?? '',
        niveau: filtres.niveauId ?? null,
        classe: filtres.classeId ?? null,
        sexe: filtres.sexe ?? null,
        statut: filtres.statut ?? null,
        redoublant: filtres.redoublant ?? null,
        incomplet: filtres.incomplet ?? false,
      },
      eleves: resultat.all().map((l: Record<string, unknown>) => ({
        id: l.id as number,
        inscriptionId: l.inscription_id as number,
        matricule: l.matricule as string,
        nom: l.nom as string,
        prenoms: l.prenoms as string,
        sexe: l.sexe as string,
        dateNaissance: iso(l.date_naissance),
        niveau: l.niveau as string,
        classe: (l.classe as string | null) ?? null,
        statut: (l.statut as StatutEleve | null) ?? null,
        etat: l.etat as Inscription['etat'],
        redoublant: Boolean(l.redoublant),
        incomplet: Boolean(l.incomplet),
      })),
      pagination: { page: meta.currentPage, dernierePage: meta.lastPage, total: meta.total },
    })
  }

  /** Fiche élève en onglets (§ 4). */
  async show(ctx: HttpContext) {
    const eleve = await EleveService.trouver(ctx.params.id)
    await ctx.bouncer.with(ElevePolicy).authorize('voir', eleve)
    const journal = await EleveService.journal(eleve.id)
    const peutValider = await ctx.bouncer.with(InscriptionPolicy).allows('valider')
    const peutReactiver = await ctx.bouncer.with(ElevePolicy).allows('reactiver', eleve)
    const courante = eleve.inscriptions.find(
      (i) => i.etat === 'valide' && i.annee.etat === 'active' && i.classeId
    )
    const resultats = courante
      ? await MoyenneService.resultatsEleve(eleve.id, courante.classeId!, courante.anneeId)
      : []

    return ctx.inertia.render('scolarite/fiche', {
      onglet: String(ctx.request.input('onglet', 'identite')),
      droits: { valider: peutValider, reactiver: peutReactiver },
      resultats,
      eleve: {
        id: eleve.id,
        matricule: eleve.matricule,
        nom: eleve.nom,
        prenoms: eleve.prenoms,
        sexe: eleve.sexe,
        dateNaissance: eleve.dateNaissance.toISODate()!,
        lieuNaissance: eleve.lieuNaissance,
        nationalite: eleve.nationalite,
        numeroActe: eleve.numeroActe,
        aPhoto: Boolean(eleve.photo),
        statut: eleve.statut,
        statutMotif: eleve.statutMotif,
        statutDate: eleve.statutDate?.toISODate() ?? null,
        sorti: eleve.estSorti,
      },
      tuteurs: eleve.tuteurs.map((t) => ({
        id: t.id,
        nom: t.nom,
        lienParente: t.lienParente,
        lien: LIENS_PARENTE[t.lienParente],
        telephone: t.telephone,
        profession: t.profession,
        adresse: t.adresse,
        email: t.email,
        principal: Boolean(t.$extras.pivot_principal),
        accesPortail: Boolean(t.userId),
      })),
      inscriptions: eleve.inscriptions.map((i) => ({
        id: i.id,
        annee: i.annee.libelle,
        anneeEtat: i.annee.etat,
        niveau: i.niveau.libelle,
        classe: i.classe?.libelle ?? null,
        etat: i.etat,
        redoublant: i.redoublant,
        etablissementOrigine: i.etablissementOrigine,
        motif: i.motif,
        motifDepassement: i.motifDepassement,
        date: i.dateInscription.toISODate()!,
        manquantes: PiecesService.manquantes(i).map((t) => TYPES_DOCUMENT[t]),
        pieces: (Object.keys(TYPES_DOCUMENT) as Array<keyof typeof TYPES_DOCUMENT>).map((type) => {
          const d = i.documents.find((x) => x.type === type)
          return {
            type,
            libelle: TYPES_DOCUMENT[type],
            obligatoire: PiecesService.obligatoires(i).includes(type),
            documentId: d?.fourni ? d.id : null,
            nomOrigine: d?.nomOrigine ?? null,
            taille: d?.taille ?? null,
          }
        }),
      })),
      journal: journal.map((j) => ({
        id: Number(j.id),
        action: j.action,
        avant: j.avant as Record<string, string | number | boolean | null> | null,
        apres: j.apres as Record<string, string | number | boolean | null> | null,
        auteur: j.auteur ?? 'Système',
        date: DateTime.fromJSDate(j.created_at)
          .setZone('Africa/Conakry')
          .toFormat("dd/MM/yyyy 'à' HH:mm"),
      })),
    })
  }

  async update(ctx: HttpContext) {
    const eleve = await EleveService.trouver(ctx.params.id)
    await ctx.bouncer.with(ElevePolicy).authorize('modifier', eleve)
    const donnees = await ctx.request.validateUsing(identiteValidator)
    await EleveService.modifierIdentite(eleve, donnees, auteur(ctx))
    ctx.session.flash('success', 'Fiche élève enregistrée')
    return ctx.response.redirect().back()
  }

  async statut(ctx: HttpContext) {
    const eleve = await EleveService.trouver(ctx.params.id)
    const { statut, motif, date } = await ctx.request.validateUsing(statutValidator)
    await ctx.bouncer.with(ElevePolicy).authorize('changerStatut', eleve, statut)
    await EleveService.changerStatut(eleve, statut, motif ?? null, date ?? null, auteur(ctx))
    ctx.session.flash('success', 'Statut de l’élève enregistré')
    return ctx.response.redirect().back()
  }

  async reactiver(ctx: HttpContext) {
    const eleve = await EleveService.trouver(ctx.params.id)
    await ctx.bouncer.with(ElevePolicy).authorize('reactiver', eleve)
    const { motif } = await ctx.request.validateUsing(motifValidator)
    await EleveService.reactiver(eleve, motif, auteur(ctx))
    ctx.session.flash('success', 'Élève réactivé : il peut être réinscrit')
    return ctx.response.redirect().back()
  }

  /** Photo d'identité : servie par route authentifiée, jamais par URL publique. */
  async photo(ctx: HttpContext) {
    const eleve = await EleveService.trouver(ctx.params.id)
    await ctx.bouncer.with(ElevePolicy).authorize('voir', eleve)
    if (!eleve.photo || !(await StockageService.existe(eleve.photo))) return ctx.response.notFound()
    ctx.response.header('Cache-Control', 'private, no-store')
    ctx.response.header('Content-Type', eleve.photo.endsWith('.png') ? 'image/png' : 'image/jpeg')
    return ctx.response.stream(await StockageService.lire(eleve.photo))
  }
}

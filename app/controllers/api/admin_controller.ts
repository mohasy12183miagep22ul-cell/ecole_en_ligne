import { gererComptes, gererStructure, consulterJournal } from '#abilities/main'
import ChoixService from '#services/choix_service'
import CompteService from '#services/compte_service'
import ClasseService from '#services/classe_service'
import JournalService from '#services/journal_service'
import StructureService from '#services/structure_service'
import AffectationService from '#services/affectation_service'
import EtablissementService from '#services/etablissement_service'
import AnneeScolaireService from '#services/annee_scolaire_service'
import DocumentsGeneresService from '#services/documents_generes_service'
import CompteTransformer from '#transformers/compte_transformer'
import type { HttpContext } from '@adonisjs/core/http'
import type AnneeScolaire from '#models/annee_scolaire'

const page = (ctx: HttpContext) => Math.max(1, Number(ctx.request.input('page', 1)) || 1)

/** Année consultée : `?annee=`, sinon l'année active, sinon la plus récente. */
const anneeConsultee = (ctx: HttpContext) =>
  AnneeScolaireService.selectionner(
    Number(ctx.request.input('annee')) || undefined,
    ctx.anneeActive
  )

const versPeriodes = (annee: AnneeScolaire) =>
  annee.periodes.map((p) => ({
    id: p.id,
    libelle: p.libelle,
    ordre: p.ordre,
    debutSaisie: p.debutSaisie.toISODate(),
    finSaisie: p.finSaisie.toISODate(),
    etatSaisie: AnneeScolaireService.etatSaisie(annee, p),
  }))

/**
 * API mobile · administrateur : consultation seule. Les opérations de
 * paramétrage (années, structure, coefficients, classes, affectations) et la
 * gestion des comptes (création, rôles, activation) restent sur le web, où
 * elles sont journalisées (RG22) et confirmées à l'écran.
 */
export default class AdminController {
  /** Tableau de bord : compteurs, années et périodes de l'année active. */
  async accueil(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const annees = await AnneeScolaireService.lister().withCount('classes', (q) =>
      q.whereNull('deleted_at')
    )
    const active = annees.find((a) => a.id === ctx.anneeActive?.id)
    const compteurs = await StructureService.compteurs()
    return {
      statistiques: {
        ...compteurs,
        classes: active ? Number(active.$extras.classes_count) : 0,
      },
      annees: annees.map((a) => ({
        id: a.id,
        libelle: a.libelle,
        etat: a.etat,
        decoupage: a.decoupage,
        classes: Number(a.$extras.classes_count),
      })),
      periodes: active ? versPeriodes(active) : [],
    }
  }

  async annees(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const annees = await AnneeScolaireService.lister().withCount('classes', (q) =>
      q.whereNull('deleted_at')
    )
    return {
      annees: annees.map((a) => ({
        id: a.id,
        libelle: a.libelle,
        etat: a.etat,
        decoupage: a.decoupage,
        dateDebut: a.dateDebut.toISODate(),
        dateFin: a.dateFin.toISODate(),
        classes: Number(a.$extras.classes_count),
        periodes: versPeriodes(a),
      })),
    }
  }

  /** Niveaux, matières et coefficients du couple niveau + matière (RG3). */
  async structure(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const [niveaux, matieres, programme] = await Promise.all([
      StructureService.niveaux(),
      StructureService.matieres(),
      StructureService.programme(),
    ])
    return {
      niveaux: niveaux.map((n) => ({
        id: n.id,
        code: n.code,
        libelle: n.libelle,
        ordre: n.ordre,
        cycle: n.cycle,
      })),
      matieres: matieres.map((m) => ({
        id: m.id,
        code: m.code,
        libelle: m.libelle,
        famille: m.famille,
        noteMaxDefaut: m.noteMaxDefaut,
      })),
      coefficients: programme.map((p) => ({
        niveauId: p.niveauId,
        matiereId: p.matiereId,
        coefficient: p.coefficient,
        obligatoire: p.obligatoire,
      })),
    }
  }

  async etablissement(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const p = await EtablissementService.parametres()
    return {
      etablissement: {
        nom: p.nom,
        // Paramètres jamais enregistrés : champs absents, renvoyés à null.
        adresse: p.adresse ?? null,
        ville: p.ville ?? null,
        pays: p.pays ?? null,
        telephone: p.telephone ?? null,
        email: p.email ?? null,
        chefEtablissement: p.chefEtablissement ?? null,
        titreChef: p.titreChef,
      },
    }
  }

  /** Classes d'une année (`?annee=`, l'année active par défaut). */
  async classes(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const annee = await anneeConsultee(ctx)
    const classes = annee ? await ClasseService.lister(annee.id) : []
    return {
      annee: annee ? { id: annee.id, libelle: annee.libelle, etat: annee.etat } : null,
      annees: await ChoixService.annees(),
      classes: classes.map((c) => ({
        id: c.id,
        libelle: c.libelle,
        niveauId: c.niveauId,
        niveau: c.niveau.libelle,
        capacite: c.capacite,
        salle: c.salle,
        professeurPrincipal: c.professeurPrincipal?.fullName ?? null,
      })),
    }
  }

  /** Affectations d'une année (`?annee=`), filtrables par classe (`?classe=`). */
  async affectations(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererStructure)
    const annee = await anneeConsultee(ctx)
    const classeId = Number(ctx.request.input('classe')) || null
    const affectations = annee ? await AffectationService.lister(annee.id) : []
    return {
      annee: annee ? { id: annee.id, libelle: annee.libelle, etat: annee.etat } : null,
      annees: await ChoixService.annees(),
      classes: annee ? await ChoixService.classes(annee.id) : [],
      affectations: affectations
        .filter((a) => !classeId || a.classeId === classeId)
        .map((a) => ({
          id: a.id,
          enseignantId: a.enseignantId,
          enseignant: a.enseignant.fullName ?? a.enseignant.email,
          classeId: a.classeId,
          classe: a.classe.libelle,
          matiere: a.matiere.libelle,
          matiereCode: a.matiere.code,
        })),
    }
  }

  /** Comptes paginés, recherche par nom ou adresse (`?q=`). */
  async comptes(ctx: HttpContext) {
    await ctx.bouncer.authorize(gererComptes)
    const recherche = String(ctx.request.input('q', '')).trim().slice(0, 80)
    const resultat = await CompteService.lister(page(ctx), recherche || undefined)
    const meta = resultat.getMeta()
    return {
      // Même forme que l'écran web, mise à plat ici : seul Inertia résout
      // les collections de transformers.
      comptes: resultat.all().map((u) => new CompteTransformer(u).toObject()),
      pagination: { page: meta.currentPage, dernierePage: meta.lastPage, total: meta.total },
    }
  }

  /** Journal d'activité (RG22), lecture seule, ouvert aussi à la direction. */
  async journal(ctx: HttpContext) {
    await ctx.bouncer.authorize(consulterJournal)
    const resultat = await JournalService.lister(page(ctx))
    const meta = resultat.getMeta()
    return {
      entrees: resultat.all().map((e) => ({
        id: Number(e.id),
        action: e.action,
        entite: e.entite,
        entiteId: e.entiteId,
        avant: e.avant,
        apres: e.apres,
        ip: e.ip,
        auteur: (e.$extras.auteur as string | null) ?? 'Système',
        date: e.createdAt.toISO(),
      })),
      pagination: { page: meta.currentPage, dernierePage: meta.lastPage, total: meta.total },
    }
  }

  /** « Mes documents » : fichiers générés en file d'attente par le compte connecté. */
  async documents(ctx: HttpContext) {
    const fichiers = await DocumentsGeneresService.mesDocuments(ctx.auth.getUserOrFail().id)
    return {
      documents: fichiers.map((f) => ({
        id: f.id,
        libelle: f.libelle,
        format: f.format,
        etat: f.etat,
        date: f.createdAt.toISO(),
      })),
    }
  }
}

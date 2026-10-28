import db from '@adonisjs/lucid/services/db'
import Periode from '#models/periode'
import Affectation from '#models/affectation'
import EvaluationPolicy from '#policies/evaluation_policy'
import InscriptionPolicy from '#policies/inscription_policy'
import NoteService from '#services/note_service'
import ChoixService from '#services/choix_service'
import MoyenneService from '#services/moyenne_service'
import EvaluationService from '#services/evaluation_service'
import InscriptionService from '#services/inscription_service'
import { enIso } from '#controllers/api/enseignant_controller'
import { versDossier } from '#controllers/inscriptions_controller'
import { derogationValidator } from '#validators/notes'
import { motifValidator, validerInscriptionValidator } from '#validators/scolarite'
import type { HttpContext } from '@adonisjs/core/http'
import type Evaluation from '#models/evaluation'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

const etat = (ev: Evaluation) => ({ id: ev.id, titre: ev.titre, etat: ev.etat })

const page = (ctx: HttpContext) => Math.max(1, Number(ctx.request.input('page', 1)) || 1)

/**
 * API mobile · direction : validation des évaluations (RG12), suivi des
 * saisies et dérogations (RG13), validation des inscriptions (RG5 à RG8).
 */
export default class DirectionController {
  /** Évaluations soumises (`etat=soumise`, par défaut) ou validées (`etat=validee`). */
  async evaluations(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('valider')
    const annee = ctx.anneeActive
    const filtre = ctx.request.input('etat') === 'validee' ? 'validee' : 'soumise'
    if (!annee) {
      return {
        compteurs: { aValider: 0, validees: 0 },
        evaluations: [],
        pagination: { page: 1, dernierePage: 1, total: 0 },
      }
    }
    const { evaluations, pagination } = await EvaluationService.listerAvecStatistiques({
      anneeId: annee.id,
      etats: [filtre],
      page: page(ctx),
    })
    const compte = async (e: string) => {
      const [ligne] = await db
        .from('evaluations as ev')
        .join('affectations as a', 'a.id', 'ev.affectation_id')
        .where('a.annee_id', annee.id)
        .where('ev.etat', e)
        .whereNull('ev.deleted_at')
        .count('* as n')
      return Number(ligne.n)
    }
    return {
      compteurs: { aValider: await compte('soumise'), validees: await compte('validee') },
      evaluations: enIso(evaluations),
      pagination,
    }
  }

  /** Détail d'une évaluation en lecture : notes de la classe et statistiques. */
  async evaluation(ctx: HttpContext) {
    const ev = await EvaluationService.trouver(ctx.params.id)
    await ctx.bouncer.with(EvaluationPolicy).authorize('voir', ev)
    const lignes = await NoteService.grille(ev)
    return {
      evaluation: {
        id: ev.id,
        titre: ev.titre,
        type: ev.type,
        date: ev.date.toISODate(),
        noteMax: ev.noteMax,
        poids: ev.poids,
        etat: ev.etat,
        motifRetour: ev.motifRetour,
        classe: ev.affectation.classe.libelle,
        matiere: ev.affectation.matiere.libelle,
        enseignant: ev.affectation.enseignant.fullName,
        periode: ev.periode.libelle,
      },
      lignes,
      statistiques: MoyenneService.statistiquesEvaluation(lignes, lignes.length),
    }
  }

  async valider(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('valider')
    const ev = await EvaluationService.trouver(ctx.params.id)
    await EvaluationService.valider(ev, auteur(ctx))
    return { evaluation: etat(await EvaluationService.trouver(ev.id)) }
  }

  async renvoyer(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('valider')
    const ev = await EvaluationService.trouver(ctx.params.id)
    const { motif } = await ctx.request.validateUsing(motifValidator)
    await EvaluationService.renvoyer(ev, motif, auteur(ctx))
    return { evaluation: etat(await EvaluationService.trouver(ev.id)) }
  }

  async deverrouiller(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('deverrouiller')
    const ev = await EvaluationService.trouver(ctx.params.id)
    const { motif } = await ctx.request.validateUsing(motifValidator)
    await EvaluationService.deverrouiller(ev, motif, auteur(ctx))
    return { evaluation: etat(await EvaluationService.trouver(ev.id)) }
  }

  /** Suivi des saisies : une ligne par affectation de l'année, pour la période choisie. */
  async suivi(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('valider')
    const annee = ctx.anneeActive
    if (!annee) return { periodes: [], periode: null, classes: [], lignes: [] }
    const periodes = await EvaluationService.periodes(annee.id)
    const periode =
      periodes.find((p) => p.id === Number(ctx.request.input('periode'))) ??
      EvaluationService.periodeCourante(periodes)
    const classes = await ChoixService.classes(annee.id)
    const classeId = Number(ctx.request.input('classe')) || null

    const lignes = await EvaluationService.suiviSaisies(annee.id, periode, classeId)

    return {
      periodes: periodes.map((p) => ({ id: p.id, libelle: p.libelle })),
      periode: periode
        ? {
            id: periode.id,
            libelle: periode.libelle,
            debutSaisie: periode.debutSaisie.toISODate(),
            finSaisie: periode.finSaisie.toISODate(),
          }
        : null,
      classes: classes.map((c) => ({ id: c.id, libelle: c.libelle })),
      lignes: lignes.map(({ id, derogation, ...l }) => ({
        affectationId: id,
        ...l,
        derogationJusquAu: derogation ? derogation.toISODate() : null,
      })),
    }
  }

  async derogation(ctx: HttpContext) {
    await ctx.bouncer.with(EvaluationPolicy).authorize('valider')
    const d = await ctx.request.validateUsing(derogationValidator)
    const affectation = await Affectation.query()
      .where('id', d.affectationId)
      .whereNull('deleted_at')
      .firstOrFail()
    const periode = await Periode.query()
      .where('id', d.periodeId)
      .whereNull('deleted_at')
      .firstOrFail()
    await EvaluationService.accorderDerogation(
      affectation,
      periode,
      d.jusquAu,
      d.motif,
      auteur(ctx)
    )
    return ctx.response.created({ jusquAu: d.jusquAu.toISODate() })
  }

  /** Dossiers d'inscription soumis, à valider ou refuser. */
  async inscriptions(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('valider')
    const annee = ctx.anneeActive
    if (!annee) {
      return { classes: [], dossiers: [], pagination: { page: 1, dernierePage: 1, total: 0 } }
    }
    const resultat = await InscriptionService.dossiers(annee.id, ['soumis'], false, page(ctx))
    return {
      classes: await InscriptionService.classesAvecEffectif(annee.id),
      dossiers: resultat.all().map((i) => ({
        ...versDossier(i),
        date: i.dateInscription.toISODate(),
      })),
      pagination: {
        page: resultat.currentPage,
        dernierePage: resultat.lastPage,
        total: resultat.total,
      },
    }
  }

  async validerInscription(ctx: HttpContext) {
    const inscription = await InscriptionService.trouver(ctx.params.id)
    await ctx.bouncer.with(InscriptionPolicy).authorize('valider', inscription)
    const d = await ctx.request.validateUsing(validerInscriptionValidator)
    await InscriptionService.valider(
      inscription,
      { classeId: d.classeId, forcer: Boolean(d.forcer), motifDepassement: d.motifDepassement },
      auteur(ctx)
    )
    return { inscription: { id: inscription.id, etat: 'valide' as const } }
  }

  async refuserInscription(ctx: HttpContext) {
    const inscription = await InscriptionService.trouver(ctx.params.id)
    await ctx.bouncer.with(InscriptionPolicy).authorize('valider', inscription)
    const { motif } = await ctx.request.validateUsing(motifValidator)
    await InscriptionService.refuser(inscription, motif, auteur(ctx))
    return { inscription: { id: inscription.id, etat: 'refuse' as const } }
  }
}

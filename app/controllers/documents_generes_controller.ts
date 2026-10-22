import FichierGenere from '#models/fichier_genere'
import FichierGenerePolicy from '#policies/fichier_genere_policy'
import InscriptionPolicy from '#policies/inscription_policy'
import DocumentsGeneresService from '#services/documents_generes_service'
import StockageService from '#services/stockage_service'
import AnneeScolaireService from '#services/annee_scolaire_service'
import { demandeDocumentValidator } from '#validators/scolarite'
import type { HttpContext } from '@adonisjs/core/http'

const LIBELLES = {
  certificats: 'Certificats de scolarité',
  liste_eleves: 'Liste des élèves',
  registre: 'Registre des inscriptions',
} as const

const TYPES_MIME = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const

/**
 * Documents produits en file d'attente (§ 9) : la demande rend la main tout
 * de suite, le fichier apparaît dans « Mes documents » quand il est prêt.
 */
export default class DocumentsGeneresController {
  async index(ctx: HttpContext) {
    const user = ctx.auth.getUserOrFail()
    const fichiers = await DocumentsGeneresService.mesDocuments(user.id)
    return ctx.inertia.render('documents', {
      fichiers: fichiers.map((f) => ({
        id: f.id,
        libelle: f.libelle,
        format: f.format,
        etat: f.etat,
        erreur: f.etat === 'echec' ? 'La génération a échoué. Relancez la demande.' : null,
        date: f.createdAt.setZone('Africa/Conakry').toFormat("dd/MM/yyyy 'à' HH:mm"),
      })),
    })
  }

  async store(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer')
    const d = await ctx.request.validateUsing(demandeDocumentValidator)
    const annee = await AnneeScolaireService.selectionner(
      d.anneeId ?? d.filtres?.anneeId,
      ctx.anneeActive
    )
    if (!annee) {
      ctx.session.flash('error', 'Aucune année scolaire sélectionnée.')
      return ctx.response.redirect().back()
    }

    const parametres =
      d.type === 'certificats'
        ? { inscriptionIds: d.inscriptionIds ?? [] }
        : d.type === 'registre'
          ? { anneeId: annee.id }
          : {
              filtres: { ...(d.filtres ?? {}), anneeId: annee.id },
              colonnes: d.colonnes ?? [
                'eleve',
                'matricule',
                'classe',
                'sexe',
                'naissance',
                'statut',
              ],
              inscriptionIds: d.inscriptionIds ?? null,
            }
    if (d.type === 'certificats' && !d.inscriptionIds?.length) {
      ctx.session.flash('error', 'Sélectionnez au moins un élève.')
      return ctx.response.redirect().back()
    }

    await DocumentsGeneresService.demander(
      {
        type: d.type,
        format: d.type === 'certificats' ? 'pdf' : d.format,
        libelle: `${LIBELLES[d.type]} · ${annee.libelle}`,
        parametres,
      },
      ctx.auth.getUserOrFail().id
    )
    ctx.session.flash(
      'success',
      'Demande enregistrée : le document sera prêt dans « Mes documents »'
    )
    return ctx.response.redirect().back()
  }

  async telecharger(ctx: HttpContext) {
    const fichier = await FichierGenere.query()
      .where('id', ctx.params.id)
      .whereNull('deleted_at')
      .firstOrFail()
    await ctx.bouncer.with(FichierGenerePolicy).authorize('telecharger', fichier)
    if (
      fichier.etat !== 'pret' ||
      !fichier.fichier ||
      !(await StockageService.existe(fichier.fichier))
    ) {
      return ctx.response.notFound()
    }
    const nom = fichier.libelle
      .replace(/[^\p{L}\p{N} -]+/gu, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
    ctx.response.header('Content-Type', TYPES_MIME[fichier.format])
    ctx.response.header('Cache-Control', 'private, no-store')
    ctx.response.header(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(nom)}.${fichier.format}"`
    )
    return ctx.response.stream(await StockageService.lire(fichier.fichier))
  }
}

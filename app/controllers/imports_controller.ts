import InscriptionPolicy from '#policies/inscription_policy'
import ImportService, { COLONNES_IMPORT } from '#services/import_service'
import InscriptionService from '#services/inscription_service'
import { importValidator } from '#validators/scolarite'
import type { HttpContext } from '@adonisjs/core/http'

const auteur = ({ auth, request }: HttpContext) => ({
  id: auth.getUserOrFail().id,
  ip: request.ip(),
})

/**
 * Import initial des élèves (§ 4) : modèle Excel fourni, analyse, rapport
 * d'erreurs ligne par ligne, rien d'enregistré avant acceptation.
 */
export default class ImportsController {
  async index(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer')
    const id = Number(ctx.request.input('rapport')) || null
    const imp = id ? await ImportService.trouver(id, ctx.auth.getUserOrFail().id) : null

    return ctx.inertia.render('scolarite/import', {
      annee: ctx.anneeActive ? { id: ctx.anneeActive.id, libelle: ctx.anneeActive.libelle } : null,
      colonnes: COLONNES_IMPORT.map(([, libelle]) => libelle),
      rapport: imp
        ? {
            id: imp.id,
            fichier: imp.nomFichier,
            etat: imp.etat,
            valides: imp.lignes.length,
            lignes: imp.lignes.slice(0, 200).map((l) => ({
              ligne: l.ligne,
              matricule: l.matricule,
              nom: l.nom,
              prenoms: l.prenoms,
              classe: l.classe,
              tuteur: l.tuteurNom,
            })),
            erreurs: imp.erreurs,
          }
        : null,
    })
  }

  async modele(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer')
    const contenu = await ImportService.modele()
    ctx.response.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    ctx.response.header('Content-Disposition', 'attachment; filename="modele-import-eleves.xlsx"')
    return ctx.response.send(contenu)
  }

  async analyser(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer')
    const { fichier } = await ctx.request.validateUsing(importValidator)
    const annee = await InscriptionService.anneeActive()
    const imp = await ImportService.analyser(
      fichier.tmpPath!,
      fichier.clientName,
      annee,
      auteur(ctx)
    )
    return ctx.response.redirect().toRoute('scolarite.import', {}, { qs: { rapport: imp.id } })
  }

  async accepter(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer')
    const imp = await ImportService.trouver(ctx.params.id, ctx.auth.getUserOrFail().id)
    const nombre = await ImportService.accepter(imp, auteur(ctx))
    ctx.session.flash(
      'success',
      `${nombre} dossier${nombre > 1 ? 's' : ''} importé${nombre > 1 ? 's' : ''}, soumis à la validation de la direction`
    )
    return ctx.response.redirect().toRoute('scolarite.eleves')
  }

  async abandonner(ctx: HttpContext) {
    await ctx.bouncer.with(InscriptionPolicy).authorize('gerer')
    const imp = await ImportService.trouver(ctx.params.id, ctx.auth.getUserOrFail().id)
    await ImportService.abandonner(imp)
    ctx.session.flash('success', 'Import abandonné : rien n’a été enregistré')
    return ctx.response.redirect().toRoute('scolarite.import')
  }
}

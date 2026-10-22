import { gererStructure } from '#abilities/main'
import EtablissementService from '#services/etablissement_service'
import { etablissementValidator } from '#validators/structure'
import type { HttpContext } from '@adonisjs/core/http'

export default class EtablissementController {
  async edit({ inertia, bouncer }: HttpContext) {
    await bouncer.authorize(gererStructure)
    const p = await EtablissementService.parametres()
    return inertia.render('admin/etablissement', {
      parametres: {
        nom: p.nom,
        adresse: p.adresse ?? '',
        ville: p.ville ?? '',
        pays: p.pays ?? '',
        telephone: p.telephone ?? '',
        email: p.email ?? '',
        chefEtablissement: p.chefEtablissement ?? '',
        titreChef: p.titreChef,
      },
    })
  }

  async update({ request, response, session, auth, bouncer }: HttpContext) {
    await bouncer.authorize(gererStructure)
    const donnees = await request.validateUsing(etablissementValidator)
    await EtablissementService.enregistrer(donnees, {
      id: auth.getUserOrFail().id,
      ip: request.ip(),
    })
    session.flash('success', 'Paramètres de l’établissement enregistrés')
    return response.redirect().back()
  }
}

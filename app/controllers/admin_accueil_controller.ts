import { gererStructure } from '#abilities/main'
import StructureService from '#services/structure_service'
import AnneeScolaireService from '#services/annee_scolaire_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class AdminAccueilController {
  async index({ inertia, bouncer, anneeActive }: HttpContext) {
    await bouncer.authorize(gererStructure)
    const annees = await AnneeScolaireService.lister().withCount('classes', (q) =>
      q.whereNull('deleted_at')
    )
    const active = annees.find((a) => a.id === anneeActive?.id)

    const { niveaux, matieres, comptesActifs } = await StructureService.compteurs()

    return inertia.render('admin/accueil', {
      statistiques: {
        niveaux,
        classes: active ? Number(active.$extras.classes_count) : 0,
        matieres,
        comptesActifs,
      },
      annees: annees.map((a) => ({
        id: a.id,
        libelle: a.libelle,
        etat: a.etat,
        decoupage: a.decoupage,
        classes: Number(a.$extras.classes_count),
      })),
      periodes:
        active?.periodes.map((p) => ({
          id: p.id,
          libelle: p.libelle,
          debutSaisie: p.debutSaisie.toISODate()!,
          finSaisie: p.finSaisie.toISODate()!,
          etatSaisie: AnneeScolaireService.etatSaisie(active, p),
        })) ?? [],
    })
  }
}

import { DateTime } from 'luxon'
import User from '#models/user'
import Niveau from '#models/niveau'
import Classe from '#models/classe'
import Matiere, { type Famille } from '#models/matiere'
import Periode from '#models/periode'
import Affectation from '#models/affectation'
import NiveauMatiere from '#models/niveau_matiere'
import AnneeScolaire from '#models/annee_scolaire'
import db from '@adonisjs/lucid/services/db'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

/**
 * Structure de démonstration (consigne du projet : 1 année, 3 niveaux,
 * 6 classes) : 2026-2027 active en trimestres, niveaux 6e, 4e et 3e (ceux du
 * prototype), 7 matières et leurs coefficients par niveau, 2 classes par
 * niveau, affectations des enseignants. Idempotent.
 * S'exécute après comptes_demo_seeder (ordre alphabétique).
 */
const NIVEAUX: Array<[string, string, number]> = [
  ['6E', '6e', 1],
  ['4E', '4e', 3],
  ['3E', '3e', 4],
]

/** Code, libellé, famille et coefficients 6e, 4e, 3e (prototype). */
const MATIERES: Array<[string, string, Famille, number[]]> = [
  ['FR', 'Français', 'litteraire', [4, 4, 4]],
  ['MA', 'Mathématiques', 'scientifique', [4, 4, 4]],
  ['AN', 'Anglais', 'langue', [2, 2, 2]],
  ['HG', 'Histoire-Géographie', 'litteraire', [2, 3, 3]],
  ['SVT', 'SVT', 'scientifique', [2, 2, 2]],
  ['PC', 'Physique-Chimie', 'scientifique', [1, 2, 2]],
  ['EPS', 'EPS', 'sportive', [1, 1, 1]],
]

/** Classe, niveau, capacité, salle. */
const CLASSES: Array<[string, string, number, string]> = [
  ['6e A', '6E', 40, 'Salle 1'],
  ['6e B', '6E', 40, 'Salle 2'],
  ['4e A', '4E', 40, 'Salle 3'],
  ['4e B', '4E', 40, 'Salle 4'],
  ['3e A', '3E', 40, 'Salle 5'],
  ['3e B', '3E', 40, 'Salle 6'],
]

/** Enseignant (identifiant), classes, matière. */
const AFFECTATIONS: Array<[string, string[], string]> = [
  ['i.sow', ['3e A', '3e B', '4e A'], 'MA'],
  ['a.keita', ['3e A', '6e A'], 'FR'],
  ['l.kaba', ['3e A', '4e A'], 'AN'],
  ['s.conde', ['3e A'], 'HG'],
  ['h.toure', ['3e A'], 'SVT'],
  ['m.fofana', ['3e A'], 'PC'],
  ['o.barry', ['3e A', '3e B'], 'EPS'],
]

const jour = (iso: string) => DateTime.fromISO(iso)

export default class extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    await db.transaction(async (client) => {
      const annee = async (
        libelle: string,
        debut: string,
        fin: string,
        etat: AnneeScolaire['etat'],
        periodes: Array<[string, string, string]>
      ) => {
        const a = await AnneeScolaire.updateOrCreate(
          { libelle },
          { libelle, dateDebut: jour(debut), dateFin: jour(fin), decoupage: 'trimestres', etat },
          { client }
        )
        for (const [i, [nom, d, f]] of periodes.entries()) {
          await Periode.updateOrCreate(
            { anneeId: a.id, ordre: i + 1 },
            { anneeId: a.id, ordre: i + 1, libelle: nom, debutSaisie: jour(d), finSaisie: jour(f) },
            { client }
          )
        }
        return a
      }

      const active = await annee('2026-2027', '2026-09-01', '2027-06-30', 'active', [
        ['1er trimestre', '2026-09-01', '2026-12-15'],
        ['2e trimestre', '2027-01-05', '2027-03-27'],
        ['3e trimestre', '2027-04-06', '2027-06-26'],
      ])

      const niveaux = new Map<string, Niveau>()
      for (const [code, libelle, ordre] of NIVEAUX) {
        niveaux.set(
          code,
          await Niveau.updateOrCreate(
            { code },
            { code, libelle, ordre, cycle: 'college' },
            { client }
          )
        )
      }

      const matieres = new Map<string, Matiere>()
      for (const [code, libelle, famille, coefs] of MATIERES) {
        const m = await Matiere.updateOrCreate(
          { code },
          { code, libelle, famille, noteMaxDefaut: 20 },
          { client }
        )
        matieres.set(code, m)
        for (const [i, [codeNiveau]] of NIVEAUX.entries()) {
          const niveauId = niveaux.get(codeNiveau)!.id
          await NiveauMatiere.updateOrCreate(
            { niveauId, matiereId: m.id },
            { niveauId, matiereId: m.id, coefficient: coefs[i], obligatoire: true },
            { client }
          )
        }
      }

      const sow = await User.findByOrFail('email', 'i.sow@flamboyants.edu.gn', { client })
      const classes = new Map<string, Classe>()
      for (const [libelle, codeNiveau, capacite, salle] of CLASSES) {
        classes.set(
          libelle,
          await Classe.updateOrCreate(
            { anneeId: active.id, libelle },
            {
              anneeId: active.id,
              libelle,
              niveauId: niveaux.get(codeNiveau)!.id,
              capacite,
              salle,
              professeurPrincipalId: libelle === '3e A' ? sow.id : null,
            },
            { client }
          )
        )
      }

      for (const [identifiant, libelles, codeMatiere] of AFFECTATIONS) {
        const enseignant = await User.findByOrFail('email', `${identifiant}@flamboyants.edu.gn`, {
          client,
        })
        for (const libelle of libelles) {
          const ligne = {
            enseignantId: enseignant.id,
            classeId: classes.get(libelle)!.id,
            matiereId: matieres.get(codeMatiere)!.id,
            anneeId: active.id,
          }
          await Affectation.updateOrCreate(ligne, ligne, { client })
        }
      }
    })
  }
}

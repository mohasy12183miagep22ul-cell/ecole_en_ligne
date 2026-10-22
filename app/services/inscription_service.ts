import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Eleve, { STATUTS_SORTIS, type Sexe } from '#models/eleve'
import Classe from '#models/classe'
import Tuteur, { type LienParente } from '#models/tuteur'
import Inscription from '#models/inscription'
import AnneeScolaire from '#models/annee_scolaire'
import DocumentInscription, {
  TYPES_DOCUMENT,
  type TypeDocument,
} from '#models/document_inscription'
import JournalService from '#services/journal_service'
import PiecesService from '#services/pieces_service'
import MatriculeService from '#services/matricule_service'
import StockageService, { type FichierStocke } from '#services/stockage_service'
import AnneeScolaireService, { type Auteur } from '#services/annee_scolaire_service'
import RegleGestionException from '#exceptions/regle_gestion_exception'

export type IdentiteEleve = {
  nom: string
  prenoms: string
  sexe: Sexe
  dateNaissance: DateTime
  lieuNaissance: string
  nationalite?: string | null
  numeroActe?: string | null
}

export type DonneesTuteur = {
  nom: string
  lienParente: LienParente
  telephone: string
  profession?: string | null
  adresse?: string | null
  email?: string | null
}

export type NouveauDossier = {
  /** Élève déjà connu (retour après une absence : il garde son matricule). */
  eleveId?: number | null
  identite?: IdentiteEleve | null
  /** Tuteur existant (fratrie) ou nouveau tuteur ; au moins un (§ 3). */
  tuteurId?: number | null
  tuteur?: DonneesTuteur | null
  niveauId: number
  classeId?: number | null
  redoublant: boolean
  etablissementOrigine?: string | null
  soumettre: boolean
}

export type FichiersDossier = Partial<Record<TypeDocument, FichierStocke>>

/**
 * Inscriptions (§ 3) : brouillon → soumis → validé | refusé ; annulé.
 * Une inscription n'existe que pour un couple élève + année, et rattache
 * l'élève à une classe.
 *
 * RG1 : toute écriture porte sur l'année active.
 * RG5 : une seule inscription validée par élève et par année.
 * RG6 : validation seulement si les pièces obligatoires sont fournies et
 *       qu'une classe est affectée.
 * RG7 : affectation refusée quand la classe est pleine ; seule la direction
 *       force, avec un motif enregistré.
 * RG8 : un élève transféré, en abandon ou exclu n'est réinscrit qu'après
 *       réactivation par la direction.
 */
export default class InscriptionService {
  /** Année active, exigée pour toute écriture (RG1). */
  static async anneeActive(trx?: TransactionClientContract) {
    const annee = await AnneeScolaire.query({ client: trx })
      .where('etat', 'active')
      .whereNull('deleted_at')
      .first()
    if (!annee) {
      throw new RegleGestionException(
        'Aucune année scolaire active : les inscriptions sont fermées.',
        'RG1'
      )
    }
    return annee
  }

  /**
   * Effectif d'une classe à une date : inscriptions validées dont l'élève
   * n'est pas sorti (transfert, abandon, exclusion) à cette date (§ 4 : le
   * départ retire l'élève des listes à compter de sa date d'effet).
   */
  static async effectif(classeId: number, date = DateTime.now(), trx?: TransactionClientContract) {
    const resultat = await (trx ?? db)
      .from('inscriptions as i')
      .join('eleves as e', 'e.id', 'i.eleve_id')
      .where('i.classe_id', classeId)
      .where('i.etat', 'valide')
      .whereNull('i.deleted_at')
      .whereNull('e.deleted_at')
      .where((q) =>
        q
          .whereNull('e.statut')
          .orWhereNotIn('e.statut', STATUTS_SORTIS)
          .orWhere('e.statut_date', '>', date.toISODate()!)
      )
      .count('* as total')
    return Number(resultat[0].total)
  }

  /** Classes de l'année avec leur effectif du jour et leur capacité (RG7). */
  static async classesAvecEffectif(anneeId: number) {
    const jour = DateTime.now().toISODate()!
    const lignes = await db
      .from('classes as c')
      .join('niveaux as n', 'n.id', 'c.niveau_id')
      .leftJoin('inscriptions as i', (j) =>
        j.on('i.classe_id', 'c.id').andOnVal('i.etat', 'valide').andOnNull('i.deleted_at')
      )
      .leftJoin('eleves as e', 'e.id', 'i.eleve_id')
      .where('c.annee_id', anneeId)
      .whereNull('c.deleted_at')
      .groupBy('c.id', 'n.ordre')
      .select('c.id', 'c.libelle', 'c.niveau_id', 'c.capacite')
      .select(
        db.raw(
          `COUNT(i.id) FILTER (WHERE e.statut IS NULL OR e.statut NOT IN ('transfere','abandon','exclu') OR e.statut_date > ?) AS effectif`,
          [jour]
        )
      )
      .orderBy('n.ordre')
      .orderBy('c.libelle')
    return lignes.map((l) => ({
      id: l.id as number,
      libelle: l.libelle as string,
      niveauId: l.niveau_id as number,
      capacite: l.capacite as number,
      effectif: Number(l.effectif),
    }))
  }

  /** RG7 : la classe peut-elle accueillir `nombre` élèves de plus ? */
  static async verifierCapacite(
    classe: Classe,
    nombre: number,
    forcage: { motif: string } | null,
    trx?: TransactionClientContract
  ) {
    const effectif = await this.effectif(classe.id, DateTime.now(), trx)
    if (effectif + nombre <= classe.capacite) return null
    if (!forcage) {
      throw new RegleGestionException(
        `La ${classe.libelle} est complète (${effectif} / ${classe.capacite}). Seule la direction peut forcer l’affectation, avec un motif.`,
        'RG7'
      )
    }
    if (forcage.motif.trim().length < 5) {
      throw new RegleGestionException(
        'Indiquez le motif du dépassement de capacité (5 caractères minimum).',
        'RG7'
      )
    }
    return forcage.motif.trim()
  }

  static async #classeDeLAnnee(
    classeId: number,
    annee: AnneeScolaire,
    niveauId: number,
    trx: TransactionClientContract
  ) {
    const classe = await Classe.query({ client: trx })
      .where('id', classeId)
      .where('annee_id', annee.id)
      .whereNull('deleted_at')
      .first()
    if (!classe) {
      throw new RegleGestionException(`Cette classe n’appartient pas à l’année ${annee.libelle}.`)
    }
    if (classe.niveauId !== niveauId) {
      throw new RegleGestionException(`La ${classe.libelle} ne correspond pas au niveau demandé.`)
    }
    return classe
  }

  /** RG8 et RG5 : l'élève peut-il recevoir un dossier sur cette année ? */
  static async #verifierEleveInscriptible(
    eleve: Eleve,
    annee: AnneeScolaire,
    trx: TransactionClientContract
  ) {
    if (eleve.estSorti) {
      throw new RegleGestionException(
        `${eleve.nomComplet} est sorti de l’établissement (${eleve.statut}) : sa réinscription demande une réactivation par la direction.`,
        'RG8'
      )
    }
    const existant = await Inscription.query({ client: trx })
      .where('eleve_id', eleve.id)
      .where('annee_id', annee.id)
      .whereIn('etat', ['brouillon', 'soumis', 'valide'])
      .whereNull('deleted_at')
      .first()
    if (existant) {
      throw new RegleGestionException(
        existant.etat === 'valide'
          ? `${eleve.nomComplet} est déjà inscrit pour ${annee.libelle}.`
          : `${eleve.nomComplet} a déjà un dossier en cours pour ${annee.libelle}.`,
        'RG5'
      )
    }
  }

  /**
   * Création d'un dossier (formulaire en trois étapes) : élève nouveau ou
   * connu, tuteur nouveau ou existant, scolarité demandée, pièces jointes.
   * Les fichiers sont déjà déposés dans le stockage privé.
   */
  static async creerDossier(donnees: NouveauDossier, fichiers: FichiersDossier, auteur: Auteur) {
    return db.transaction(async (trx) => {
      const annee = await this.anneeActive(trx)

      let eleve: Eleve
      if (donnees.eleveId) {
        eleve = await Eleve.query({ client: trx })
          .where('id', donnees.eleveId)
          .whereNull('deleted_at')
          .forUpdate()
          .firstOrFail()
      } else {
        if (!donnees.identite) throw new RegleGestionException('Identité de l’élève manquante.')
        eleve = await Eleve.create(
          {
            ...donnees.identite,
            matricule: await MatriculeService.attribuer(annee.dateDebut.year, trx),
            statut: null,
          },
          { client: trx }
        )
      }
      await this.#verifierEleveInscriptible(eleve, annee, trx)

      // Tuteur : au moins un, réutilisable pour une fratrie.
      let tuteurId = donnees.tuteurId ?? null
      if (!tuteurId && donnees.tuteur) {
        const nouveau = await Tuteur.create(donnees.tuteur, { client: trx })
        tuteurId = nouveau.id
      }
      const dejaRattaches = await trx
        .from('eleve_tuteur')
        .where('eleve_id', eleve.id)
        .whereNull('deleted_at')
      if (!tuteurId && dejaRattaches.length === 0) {
        throw new RegleGestionException('Au moins un tuteur est requis.')
      }
      if (tuteurId && !dejaRattaches.some((r) => r.tuteur_id === tuteurId)) {
        await Tuteur.query({ client: trx })
          .where('id', tuteurId)
          .whereNull('deleted_at')
          .firstOrFail()
        await trx.table('eleve_tuteur').insert({
          eleve_id: eleve.id,
          tuteur_id: tuteurId,
          principal: dejaRattaches.length === 0,
          created_at: new Date(),
        })
      }

      let classeId: number | null = null
      if (donnees.classeId) {
        const classe = await this.#classeDeLAnnee(donnees.classeId, annee, donnees.niveauId, trx)
        // Le secrétariat ne peut pas affecter dans une classe pleine (RG7).
        await this.verifierCapacite(classe, 1, null, trx)
        classeId = classe.id
      }

      const inscription = await Inscription.create(
        {
          eleveId: eleve.id,
          anneeId: annee.id,
          niveauId: donnees.niveauId,
          classeId,
          dateInscription: DateTime.now(),
          etat: donnees.soumettre ? 'soumis' : 'brouillon',
          redoublant: donnees.redoublant,
          etablissementOrigine: donnees.etablissementOrigine || null,
        },
        { client: trx }
      )

      for (const type of Object.keys(TYPES_DOCUMENT) as TypeDocument[]) {
        const f = fichiers[type]
        await DocumentInscription.create(
          {
            inscriptionId: inscription.id,
            type,
            fichier: f?.cle ?? null,
            nomOrigine: f?.nomOrigine ?? null,
            mime: f?.mime ?? null,
            taille: f?.taille ?? null,
            fourni: Boolean(f),
          },
          { client: trx }
        )
      }
      if (fichiers.photo) {
        eleve.useTransaction(trx)
        eleve.photo = fichiers.photo.cle
        await eleve.save()
      }

      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: donnees.soumettre ? 'Dossier d’inscription soumis' : 'Dossier d’inscription créé',
          entite: 'eleves',
          entiteId: eleve.id,
          apres: { inscription: inscription.id, annee: annee.libelle, etat: inscription.etat },
          ip: auteur.ip,
        },
        trx
      )
      return { eleve, inscription }
    })
  }

  /**
   * Dossiers de l'année dans les états donnés, avec ce qu'il faut pour
   * afficher les pièces manquantes (dossiers à compléter, inscriptions à
   * valider). `incomplets` ne garde que les dossiers où il manque une pièce.
   */
  static dossiers(
    anneeId: number,
    etats: Inscription['etat'][],
    incomplets: boolean,
    page: number
  ) {
    const q = Inscription.query()
      .where('annee_id', anneeId)
      .whereIn('etat', etats)
      .whereNull('deleted_at')
      .preload('eleve')
      .preload('niveau')
      .preload('classe')
      .preload('documents')
      .orderBy('date_inscription')
      .orderBy('id')
    if (incomplets) q.whereRaw(PiecesService.sqlIncomplet('inscriptions'))
    return q.paginate(page, 25)
  }

  static async trouver(id: number, trx?: TransactionClientContract) {
    return Inscription.query({ client: trx })
      .where('id', id)
      .whereNull('deleted_at')
      .preload('documents')
      .preload('eleve')
      .firstOrFail()
  }

  static async #changerEtat(
    inscription: Inscription,
    etat: Inscription['etat'],
    action: string,
    auteur: Auteur,
    trx: TransactionClientContract,
    extra: Record<string, unknown> = {}
  ) {
    const avant = inscription.etat
    inscription.useTransaction(trx)
    inscription.etat = etat
    await inscription.save()
    await JournalService.enregistrer(
      {
        userId: auteur.id,
        action,
        entite: 'eleves',
        entiteId: inscription.eleveId,
        avant: { inscription: inscription.id, etat: avant },
        apres: { inscription: inscription.id, etat, ...extra },
        ip: auteur.ip,
      },
      trx
    )
  }

  /** Brouillon → soumis (un dossier peut être soumis incomplet, § 3). */
  static async soumettre(inscription: Inscription, auteur: Auteur) {
    if (inscription.etat !== 'brouillon') {
      throw new RegleGestionException('Seul un brouillon peut être soumis.')
    }
    await db.transaction((trx) =>
      this.#changerEtat(inscription, 'soumis', 'Dossier d’inscription soumis', auteur, trx)
    )
  }

  /** Abandon d'un dossier en cours (brouillon ou soumis), avec motif. */
  static async annuler(inscription: Inscription, motif: string, auteur: Auteur) {
    if (!['brouillon', 'soumis'].includes(inscription.etat)) {
      throw new RegleGestionException('Seul un dossier en cours peut être annulé.')
    }
    await db.transaction(async (trx) => {
      inscription.motif = motif
      await this.#changerEtat(inscription, 'annule', 'Dossier d’inscription annulé', auteur, trx, {
        motif,
      })
    })
  }

  /** Refus par la direction, avec motif. */
  static async refuser(inscription: Inscription, motif: string, auteur: Auteur) {
    if (inscription.etat !== 'soumis') {
      throw new RegleGestionException('Seul un dossier soumis peut être refusé.')
    }
    await db.transaction(async (trx) => {
      inscription.motif = motif
      await this.#changerEtat(inscription, 'refuse', 'Inscription refusée', auteur, trx, { motif })
    })
  }

  /**
   * Validation par la direction (RG5, RG6, RG7, RG8). La direction confirme
   * ou choisit la classe ; elle seule peut forcer une classe pleine, avec un
   * motif enregistré.
   */
  static async valider(
    inscription: Inscription,
    choix: { classeId: number; forcer: boolean; motifDepassement?: string | null },
    auteur: Auteur
  ) {
    await db.transaction(async (trx) => {
      const i = await Inscription.query({ client: trx })
        .where('id', inscription.id)
        .whereNull('deleted_at')
        .forUpdate()
        .preload('documents')
        .firstOrFail()
      if (i.etat !== 'soumis') {
        throw new RegleGestionException('Seul un dossier soumis peut être validé.')
      }
      const annee = await AnneeScolaire.findOrFail(i.anneeId, { client: trx })
      AnneeScolaireService.verifierModifiable(annee)
      if (annee.etat !== 'active') {
        throw new RegleGestionException(
          'Les inscriptions ne se valident que sur l’année active.',
          'RG1'
        )
      }

      const eleve = await Eleve.query({ client: trx })
        .where('id', i.eleveId)
        .forUpdate()
        .firstOrFail()
      if (eleve.estSorti) {
        throw new RegleGestionException(
          `${eleve.nomComplet} est sorti de l’établissement : réactivation par la direction requise.`,
          'RG8'
        )
      }

      const manquantes = PiecesService.manquantes(i)
      if (manquantes.length) {
        throw new RegleGestionException(
          `Validation impossible, pièces manquantes : ${manquantes.map((t) => TYPES_DOCUMENT[t]).join(', ')}.`,
          'RG6'
        )
      }

      const classe = await this.#classeDeLAnnee(choix.classeId, annee, i.niveauId, trx)
      const motifDepassement = await this.verifierCapacite(
        classe,
        1,
        choix.forcer ? { motif: choix.motifDepassement ?? '' } : null,
        trx
      )

      const dejaValidee = await Inscription.query({ client: trx })
        .where('eleve_id', i.eleveId)
        .where('annee_id', i.anneeId)
        .where('etat', 'valide')
        .whereNull('deleted_at')
        .first()
      if (dejaValidee) {
        throw new RegleGestionException(`${eleve.nomComplet} est déjà inscrit cette année.`, 'RG5')
      }

      i.classeId = classe.id
      i.validePar = auteur.id
      i.valideLe = DateTime.now()
      i.motifDepassement = motifDepassement
      await this.#changerEtat(i, 'valide', 'Inscription validée', auteur, trx, {
        classe: classe.libelle,
        ...(motifDepassement ? { depassementCapacite: motifDepassement } : {}),
      })

      eleve.useTransaction(trx)
      eleve.statut = 'inscrit'
      eleve.statutMotif = null
      eleve.statutDate = null
      await eleve.save()
    })
  }

  /**
   * Changement de classe d'une sélection d'élèves inscrits (§ 4). RG7 :
   * refusé si la classe cible ne peut pas les accueillir tous ; seule la
   * direction force, avec un motif.
   */
  static async changerClasse(
    inscriptionIds: number[],
    classeId: number,
    forcage: { motif: string } | null,
    auteur: Auteur
  ) {
    return db.transaction(async (trx) => {
      const annee = await this.anneeActive(trx)
      const classe = await Classe.query({ client: trx })
        .where('id', classeId)
        .where('annee_id', annee.id)
        .whereNull('deleted_at')
        .forUpdate()
        .firstOrFail()
      const inscriptions = await Inscription.query({ client: trx })
        .whereIn('id', inscriptionIds)
        .where('annee_id', annee.id)
        .where('etat', 'valide')
        .whereNull('deleted_at')
      const aDeplacer = inscriptions.filter((i) => i.classeId !== classe.id)
      if (aDeplacer.length === 0) return 0
      if (aDeplacer.some((i) => i.niveauId !== classe.niveauId)) {
        throw new RegleGestionException(
          `La ${classe.libelle} ne correspond pas au niveau de tous les élèves sélectionnés.`
        )
      }
      const motif = await this.verifierCapacite(classe, aDeplacer.length, forcage, trx)

      for (const i of aDeplacer) {
        const avant = i.classeId
        i.useTransaction(trx)
        i.classeId = classe.id
        if (motif) i.motifDepassement = motif
        await i.save()
        await JournalService.enregistrer(
          {
            userId: auteur.id,
            action: 'Changement de classe',
            entite: 'eleves',
            entiteId: i.eleveId,
            avant: { inscription: i.id, classeId: avant },
            apres: {
              inscription: i.id,
              classe: classe.libelle,
              ...(motif ? { depassementCapacite: motif } : {}),
            },
            ip: auteur.ip,
          },
          trx
        )
      }
      return aDeplacer.length
    })
  }

  /** Dépôt ou remplacement d'une pièce (le précédent fichier reste archivé). */
  static async deposerPiece(
    inscription: Inscription,
    type: TypeDocument,
    fichier: FichierStocke,
    auteur: Auteur
  ) {
    if (['refuse', 'annule'].includes(inscription.etat)) {
      throw new RegleGestionException('Ce dossier est clos : il ne reçoit plus de pièces.')
    }
    await db.transaction(async (trx) => {
      const ancien = await DocumentInscription.query({ client: trx })
        .where('inscription_id', inscription.id)
        .where('type', type)
        .whereNull('deleted_at')
        .forUpdate()
        .first()
      if (ancien) {
        ancien.useTransaction(trx)
        ancien.deletedAt = DateTime.now()
        await ancien.save()
      }
      await DocumentInscription.create(
        {
          inscriptionId: inscription.id,
          type,
          fichier: fichier.cle,
          nomOrigine: fichier.nomOrigine,
          mime: fichier.mime,
          taille: fichier.taille,
          fourni: true,
        },
        { client: trx }
      )
      if (type === 'photo') {
        await Eleve.query({ client: trx })
          .where('id', inscription.eleveId)
          .update({ photo: fichier.cle })
      }
      await JournalService.enregistrer(
        {
          userId: auteur.id,
          action: ancien?.fourni ? 'Pièce remplacée' : 'Pièce ajoutée',
          entite: 'eleves',
          entiteId: inscription.eleveId,
          avant: { piece: TYPES_DOCUMENT[type], fourni: Boolean(ancien?.fourni) },
          apres: { piece: TYPES_DOCUMENT[type], fourni: true },
          ip: auteur.ip,
        },
        trx
      )
    })
  }

  /** Lecture d'une pièce : le fichier n'est jamais servi directement. */
  static async lirePiece(document: DocumentInscription) {
    if (!document.fichier || !(await StockageService.existe(document.fichier))) return null
    return StockageService.lire(document.fichier)
  }
}

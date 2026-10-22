import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import ExcelJS from 'exceljs'
import db from '@adonisjs/lucid/services/db'
import Eleve from '#models/eleve'
import Niveau from '#models/niveau'
import Classe from '#models/classe'
import Periode from '#models/periode'
import Inscription from '#models/inscription'
import AnneeScolaire from '#models/annee_scolaire'
import FichierGenere from '#models/fichier_genere'
import DocumentInscription, { type TypeDocument } from '#models/document_inscription'
import InscriptionService from '#services/inscription_service'
import ImportService from '#services/import_service'
import StockageService from '#services/stockage_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { creerCompte } from '#tests/aides'

const jour = (iso: string) => DateTime.fromISO(iso)
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n')

/** Année active, un niveau 3e et une classe de capacité donnée. */
async function contexte(capacite = 40) {
  const annee = await AnneeScolaire.create({
    libelle: '2026-2027',
    dateDebut: jour('2026-09-01'),
    dateFin: jour('2027-06-30'),
    decoupage: 'trimestres',
    etat: 'active',
  })
  await Periode.create({
    anneeId: annee.id,
    libelle: '1er trimestre',
    ordre: 1,
    debutSaisie: jour('2026-09-01'),
    finSaisie: jour('2026-12-15'),
  })
  const niveau = await Niveau.create({ code: '3E', libelle: '3e', ordre: 4, cycle: 'college' })
  const classe = await Classe.create({
    anneeId: annee.id,
    niveauId: niveau.id,
    libelle: '3e A',
    capacite,
  })
  const secretariat = await creerCompte(['secretariat'])
  const direction = await creerCompte(['direction'])
  return { annee, niveau, classe, secretariat, direction }
}

let n = 0
/** Dossier soumis ; `pieces` : les pièces fournies (toutes par défaut). */
async function dossier(
  ctx: Awaited<ReturnType<typeof contexte>>,
  pieces: TypeDocument[] = ['acte_naissance', 'bulletin_precedent', 'photo'],
  eleveId?: number
) {
  n++
  const fichiers = Object.fromEntries(
    pieces.map((t) => [
      t,
      {
        cle: `pieces/test-${n}-${t}.pdf`,
        mime: 'application/pdf',
        taille: PDF.length,
        nomOrigine: `${t}.pdf`,
      },
    ])
  )
  return InscriptionService.creerDossier(
    {
      eleveId: eleveId ?? null,
      identite: eleveId
        ? null
        : {
            nom: `Diallo${n}`,
            prenoms: 'Aminata',
            sexe: 'F',
            dateNaissance: jour('2012-10-08'),
            lieuNaissance: 'Conakry',
          },
      tuteur: { nom: 'Fatoumata Diallo', lienParente: 'mere', telephone: '+224 622 14 87 30' },
      niveauId: ctx.niveau.id,
      redoublant: false,
      soumettre: true,
    },
    fichiers,
    { id: ctx.secretariat.id, ip: null }
  )
}

const envoyer = (client: any, user: any, url: string, corps: object = {}) =>
  client.post(url).json(corps).withCsrfToken().loginAs(user).redirects(0)

/** Refus d'autorisation : 403, ou retour arrière avec message pour un formulaire. */
function refuse(assert: any, reponse: any) {
  if (reponse.status() === 403) return
  assert.equal(reponse.status(), 302)
  assert.exists(
    reponse.flashMessages().errorsBag?.E_AUTHORIZATION_FAILURE,
    'refus d’autorisation attendu'
  )
}

const nomDe = (chemin: string) => basename(chemin)

async function fichierTemporaire(nom: string, contenu: Buffer) {
  const dossierTmp = await mkdtemp(join(tmpdir(), 'ecole-'))
  const chemin = join(dossierTmp, nom)
  await writeFile(chemin, contenu)
  return chemin
}

test.group('RG4 · matricule unique et immuable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un nouvel élève reçoit un matricule AAAA-NNNNN de l’année, sans doublon', async ({
    assert,
  }) => {
    const ctx = await contexte()
    const { eleve: a } = await dossier(ctx)
    const { eleve: b } = await dossier(ctx)
    assert.match(a.matricule, /^2026-\d{5}$/)
    assert.match(b.matricule, /^2026-\d{5}$/)
    assert.notEqual(a.matricule, b.matricule)
  })

  test('la modification de la fiche ne touche pas au matricule ; la base refuse tout changement', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const { eleve } = await dossier(ctx)
    const matricule = eleve.matricule

    await client
      .put(`/scolarite/eleves/${eleve.id}`)
      .json({
        nom: 'Camara',
        prenoms: 'Aminata',
        sexe: 'F',
        dateNaissance: '2012-10-08',
        lieuNaissance: 'Kindia',
        matricule: '1999-00001',
      })
      .withCsrfToken()
      .loginAs(ctx.secretariat)
      .redirects(0)
    await eleve.refresh()
    assert.equal(eleve.nom, 'Camara')
    assert.equal(eleve.matricule, matricule)

    await assert.rejects(() =>
      db.from('eleves').where('id', eleve.id).update({ matricule: '2026-99999' })
    )
  })
})

test.group('RG5 · une seule inscription validée par élève et par année', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un second dossier sur la même année est refusé', async ({ assert }) => {
    const ctx = await contexte()
    const { eleve } = await dossier(ctx)
    await assert.rejects(() => dossier(ctx, undefined, eleve.id), /déjà un dossier en cours/)
  })

  test('la base refuse deux inscriptions validées, même en SQL direct', async ({ assert }) => {
    const ctx = await contexte()
    const { eleve, inscription } = await dossier(ctx)
    await InscriptionService.valider(
      inscription,
      { classeId: ctx.classe.id, forcer: false },
      { id: ctx.direction.id, ip: null }
    )
    await assert.rejects(() =>
      db.table('inscriptions').insert({
        eleve_id: eleve.id,
        annee_id: ctx.annee.id,
        niveau_id: ctx.niveau.id,
        classe_id: ctx.classe.id,
        etat: 'valide',
        date_inscription: '2026-09-02',
        redoublant: false,
        created_at: new Date(),
      })
    )
  })
})

test.group('RG6 · pas de validation sans pièces obligatoires', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un dossier incomplet ne se valide pas', async ({ client, assert }) => {
    const ctx = await contexte()
    const { inscription } = await dossier(ctx, ['acte_naissance'])
    const reponse = await envoyer(
      client,
      ctx.direction,
      `/direction/inscriptions/${inscription.id}/valider`,
      {
        classeId: ctx.classe.id,
      }
    )
    assert.match(reponse.flashMessages().error, /pièces manquantes/)
    await inscription.refresh()
    assert.equal(inscription.etat, 'soumis')
  })

  test('un dossier complet se valide : élève inscrit, classe affectée, action journalisée', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const { eleve, inscription } = await dossier(ctx)
    await envoyer(client, ctx.direction, `/direction/inscriptions/${inscription.id}/valider`, {
      classeId: ctx.classe.id,
    })
    await inscription.refresh()
    await eleve.refresh()
    assert.equal(inscription.etat, 'valide')
    assert.equal(inscription.classeId, ctx.classe.id)
    assert.equal(inscription.validePar, ctx.direction.id)
    assert.equal(eleve.statut, 'inscrit')
    const trace = await db
      .from('journal')
      .where('action', 'Inscription validée')
      .where('entite_id', String(eleve.id))
      .first()
    assert.equal(trace.user_id, ctx.direction.id)
  })

  test('le certificat de transfert n’est exigé que pour un élève venant d’ailleurs', async ({
    assert,
  }) => {
    const ctx = await contexte()
    const { inscription } = await dossier(ctx)
    inscription.etablissementOrigine = 'Collège de Kipé'
    await inscription.save()
    await assert.rejects(
      () =>
        InscriptionService.valider(
          inscription,
          { classeId: ctx.classe.id, forcer: false },
          { id: ctx.direction.id, ip: null }
        ),
      /Certificat de transfert/
    )
  })
})

test.group('RG7 · capacité de la classe', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('une classe pleine refuse la validation ; la direction force avec un motif enregistré', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte(1)
    const premier = await dossier(ctx)
    const second = await dossier(ctx)
    await envoyer(
      client,
      ctx.direction,
      `/direction/inscriptions/${premier.inscription.id}/valider`,
      { classeId: ctx.classe.id }
    )

    const refus = await envoyer(
      client,
      ctx.direction,
      `/direction/inscriptions/${second.inscription.id}/valider`,
      {
        classeId: ctx.classe.id,
      }
    )
    assert.match(refus.flashMessages().error, /capacité|complète|pleine/i)

    await envoyer(
      client,
      ctx.direction,
      `/direction/inscriptions/${second.inscription.id}/valider`,
      {
        classeId: ctx.classe.id,
        forcer: true,
        motifDepassement: 'Fratrie déjà dans la classe',
      }
    )
    await second.inscription.refresh()
    assert.equal(second.inscription.etat, 'valide')
    assert.equal(second.inscription.motifDepassement, 'Fratrie déjà dans la classe')
  })

  test('le secrétariat ne peut pas forcer un dépassement', async ({ client, assert }) => {
    const ctx = await contexte(1)
    const autre = await Classe.create({
      anneeId: ctx.annee.id,
      niveauId: ctx.niveau.id,
      libelle: '3e B',
      capacite: 40,
    })
    const a = await dossier(ctx)
    const b = await dossier(ctx)
    await InscriptionService.valider(
      a.inscription,
      { classeId: ctx.classe.id, forcer: false },
      { id: ctx.direction.id, ip: null }
    )
    await InscriptionService.valider(
      b.inscription,
      { classeId: autre.id, forcer: false },
      { id: ctx.direction.id, ip: null }
    )

    const reponse = await envoyer(
      client,
      ctx.secretariat,
      '/scolarite/inscriptions/changer-classe',
      {
        inscriptionIds: [b.inscription.id],
        classeId: ctx.classe.id,
        forcer: true,
        motifDepassement: 'Tentative du secrétariat',
      }
    )
    refuse(assert, reponse)
    await b.inscription.refresh()
    assert.equal(b.inscription.classeId, autre.id)
  })
})

test.group('RG8 · élève sorti : réactivation par la direction', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un élève transféré ne reçoit pas de nouveau dossier ; seule la direction le réactive', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const { eleve, inscription } = await dossier(ctx)
    await InscriptionService.valider(
      inscription,
      { classeId: ctx.classe.id, forcer: false },
      { id: ctx.direction.id, ip: null }
    )
    await envoyer(client, ctx.secretariat, `/scolarite/eleves/${eleve.id}/statut`, {
      statut: 'transfere',
      motif: 'Déménagement',
      date: '2026-11-04',
    })
    await eleve.refresh()
    assert.equal(eleve.statut, 'transfere')

    // L'inscription validée de l'année est close par le transfert : le dossier suivant (année suivante) bute sur RG8.
    await Inscription.query().where('id', inscription.id).update({ etat: 'annule' })
    await assert.rejects(() => dossier(ctx, undefined, eleve.id), /réactivation/)

    const refus = await envoyer(
      client,
      ctx.secretariat,
      `/scolarite/eleves/${eleve.id}/reactiver`,
      { motif: 'Retour de la famille' }
    )
    refuse(assert, refus)

    await envoyer(client, ctx.direction, `/scolarite/eleves/${eleve.id}/reactiver`, {
      motif: 'Retour de la famille',
    })
    await eleve.refresh()
    assert.isFalse(eleve.estSorti)
    await dossier(ctx, undefined, eleve.id)
  })

  test('l’exclusion relève de la direction', async ({ client, assert }) => {
    const ctx = await contexte()
    const { eleve, inscription } = await dossier(ctx)
    await InscriptionService.valider(
      inscription,
      { classeId: ctx.classe.id, forcer: false },
      { id: ctx.direction.id, ip: null }
    )
    const reponse = await envoyer(client, ctx.secretariat, `/scolarite/eleves/${eleve.id}/statut`, {
      statut: 'exclu',
      motif: 'Conseil de discipline',
      date: '2026-11-04',
    })
    refuse(assert, reponse)
    await eleve.refresh()
    assert.equal(eleve.statut, 'inscrit')
  })
})

test.group('Pièces jointes · type vérifié, 5 Mo, lecture authentifiée', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un faux PDF (texte renommé) est refusé sur son contenu réel', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const { inscription } = await dossier(ctx, [])
    const chemin = await fichierTemporaire('acte.pdf', Buffer.from('ceci n’est pas un PDF'))
    const reponse = await client
      .post(`/scolarite/inscriptions/${inscription.id}/pieces/acte_naissance`)
      .file('fichier', chemin, { filename: nomDe(chemin) })
      .withCsrfToken()
      .loginAs(ctx.secretariat)
      .redirects(0)
    assert.match(
      (reponse.flashMessages() as any).inputErrorsBag?.fichier?.[0],
      /Type de fichier non accepté/
    )
    const doc = await DocumentInscription.query()
      .where('inscription_id', inscription.id)
      .where('type', 'acte_naissance')
      .whereNull('deleted_at')
      .firstOrFail()
    assert.isFalse(doc.fourni)
  })

  test('un fichier de plus de 5 Mo est refusé', async ({ client, assert }) => {
    const ctx = await contexte()
    const { inscription } = await dossier(ctx, [])
    const gros = Buffer.concat([PDF, Buffer.alloc(5 * 1024 * 1024 + 10)])
    const chemin = await fichierTemporaire('acte.pdf', gros)
    const reponse = await client
      .post(`/scolarite/inscriptions/${inscription.id}/pieces/acte_naissance`)
      .file('fichier', chemin, { filename: nomDe(chemin) })
      .withCsrfToken()
      .loginAs(ctx.secretariat)
      .redirects(0)
    assert.match((reponse.flashMessages() as any).inputErrorsBag?.fichier?.[0], /5 Mo/)
  })

  test('un vrai PDF est stocké sous un nom généré et lu par une route authentifiée, jamais par les autres profils', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const { inscription } = await dossier(ctx, [])
    const chemin = await fichierTemporaire('acte de naissance.pdf', PDF)
    await client
      .post(`/scolarite/inscriptions/${inscription.id}/pieces/acte_naissance`)
      .file('fichier', chemin, { filename: nomDe(chemin) })
      .withCsrfToken()
      .loginAs(ctx.secretariat)
      .redirects(0)

    const doc = await DocumentInscription.query()
      .where('inscription_id', inscription.id)
      .where('type', 'acte_naissance')
      .whereNull('deleted_at')
      .firstOrFail()
    assert.isTrue(doc.fourni)
    assert.match(doc.fichier!, /^pieces\/[0-9a-f-]{36}\.pdf$/)
    assert.equal(doc.mime, 'application/pdf')
    assert.isTrue(await StockageService.existe(doc.fichier!))

    const lecture = await client.get(`/scolarite/pieces/${doc.id}`).loginAs(ctx.secretariat)
    lecture.assertStatus(200)
    lecture.assertHeader('content-type', 'application/pdf')

    for (const role of ['enseignant', 'tuteur'] as const) {
      const autre = await creerCompte([role])
      const refus = await client.get(`/scolarite/pieces/${doc.id}`).loginAs(autre).redirects(0)
      assert.equal(refus.status(), 302, `${role} ne lit pas une pièce`)
    }
    const anonyme = await client.get(`/scolarite/pieces/${doc.id}`).redirects(0)
    anonyme.assertHeader('location', '/login')
    const directe = await client.get(`/${doc.fichier}`).loginAs(ctx.secretariat).redirects(0)
    assert.notEqual(directe.status(), 200, 'le stockage n’est jamais servi directement')
  })
})

test.group('Import initial des élèves', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('analyse : rien n’est enregistré avant acceptation ; les lignes en erreur sont écartées', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const classeur = new ExcelJS.Workbook()
    await classeur.xlsx.load((await ImportService.modele()) as any)
    classeur.worksheets[0].addRow([
      '',
      '',
      'Barry',
      'Ibrahima',
      'X',
      '31/02/2012',
      'Labé',
      '',
      '',
      '9e Z',
    ])
    const chemin = await fichierTemporaire(
      'eleves.xlsx',
      Buffer.from(await classeur.xlsx.writeBuffer())
    )

    const analyse = await client
      .post('/scolarite/import')
      .file('fichier', chemin, { filename: nomDe(chemin) })
      .withCsrfToken()
      .loginAs(ctx.secretariat)
      .redirects(0)
    const rapport = new URL(analyse.header('location')!, 'http://x').searchParams.get('rapport')
    assert.exists(rapport)
    assert.equal(
      await Eleve.query()
        .count('* as n')
        .then((r) => Number(r[0].$extras.n)),
      0
    )

    const page = await client
      .get(`/scolarite/import?rapport=${rapport}`)
      .loginAs(ctx.secretariat)
      .withInertia()
    const props = page.inertiaProps as any
    assert.equal(props.rapport.valides, 1)
    assert.isAbove(props.rapport.erreurs.length, 0)

    // Un autre utilisateur ne peut pas accepter cet import.
    const intrus = await creerCompte(['secretariat'])
    const refus = await envoyer(client, intrus, `/scolarite/import/${rapport}/accepter`)
    refus.assertStatus(404)

    await envoyer(client, ctx.secretariat, `/scolarite/import/${rapport}/accepter`)
    const inscriptions = await Inscription.query().where('annee_id', ctx.annee.id)
    assert.lengthOf(inscriptions, 1)
    assert.equal(inscriptions[0].etat, 'soumis')
  })
})

test.group('Exports en file d’attente', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la liste Excel est produite et ne se télécharge que par son demandeur', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const { inscription } = await dossier(ctx)
    await InscriptionService.valider(
      inscription,
      { classeId: ctx.classe.id, forcer: false },
      { id: ctx.direction.id, ip: null }
    )

    await envoyer(client, ctx.secretariat, '/scolarite/documents', {
      type: 'liste_eleves',
      format: 'xlsx',
      filtres: { anneeId: ctx.annee.id },
      colonnes: ['eleve', 'matricule', 'classe'],
    })
    const fichier = await FichierGenere.query().where('user_id', ctx.secretariat.id).firstOrFail()
    assert.equal(fichier.etat, 'pret')

    const telechargement = await client.get(`/documents/${fichier.id}`).loginAs(ctx.secretariat)
    telechargement.assertStatus(200)
    telechargement.assertHeader(
      'content-type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    const refus = await client.get(`/documents/${fichier.id}`).loginAs(ctx.direction)
    refus.assertStatus(403)
  })
})

test.group('Scolarité · accès refusés par manipulation d’URL', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('enseignant et tuteur n’ouvrent pas une fiche élève', async ({ client, assert }) => {
    const ctx = await contexte()
    const { eleve } = await dossier(ctx)
    for (const role of ['enseignant', 'tuteur', 'admin'] as const) {
      const user = await creerCompte([role])
      const reponse = await client.get(`/scolarite/eleves/${eleve.id}`).loginAs(user).redirects(0)
      assert.equal(reponse.status(), 302, `${role} ne doit pas ouvrir la fiche`)
    }
    const ok = await client.get(`/scolarite/eleves/${eleve.id}`).loginAs(ctx.secretariat)
    ok.assertStatus(200)
  })

  test('le secrétariat ne valide pas une inscription', async ({ client, assert }) => {
    const ctx = await contexte()
    const { inscription } = await dossier(ctx)
    const reponse = await envoyer(
      client,
      ctx.secretariat,
      `/direction/inscriptions/${inscription.id}/valider`,
      {
        classeId: ctx.classe.id,
      }
    )
    assert.equal(reponse.status(), 302)
    await inscription.refresh()
    assert.equal(inscription.etat, 'soumis')
  })

  test('un identifiant inexistant renvoie 404', async ({ client }) => {
    const ctx = await contexte()
    const reponse = await client.get('/scolarite/eleves/999999').loginAs(ctx.secretariat)
    reponse.assertStatus(404)
  })
})

import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Niveau from '#models/niveau'
import Classe from '#models/classe'
import Matiere from '#models/matiere'
import Periode from '#models/periode'
import Affectation from '#models/affectation'
import NiveauMatiere from '#models/niveau_matiere'
import AnneeScolaire from '#models/annee_scolaire'
import testUtils from '@adonisjs/core/services/test_utils'
import { creerCompte } from '#tests/aides'

const jour = (iso: string) => DateTime.fromISO(iso)

async function annee(libelle: string, etat: AnneeScolaire['etat']) {
  const debut = Number(libelle.slice(0, 4))
  const a = await AnneeScolaire.create({
    libelle,
    dateDebut: jour(`${debut}-09-01`),
    dateFin: jour(`${debut + 1}-06-30`),
    decoupage: 'trimestres',
    etat,
  })
  await Periode.create({
    anneeId: a.id,
    libelle: '1er trimestre',
    ordre: 1,
    debutSaisie: jour(`${debut}-09-01`),
    finSaisie: jour(`${debut}-12-15`),
  })
  return a
}

/** Structure minimale : niveaux 6e/3e, maths (coef 4 en 3e, 2 en 6e), une classe. */
async function structure(a: AnneeScolaire) {
  const sixieme = await Niveau.create({ code: '6E', libelle: '6e', ordre: 1, cycle: 'college' })
  const troisieme = await Niveau.create({ code: '3E', libelle: '3e', ordre: 4, cycle: 'college' })
  const maths = await Matiere.create({
    code: 'MA',
    libelle: 'Mathématiques',
    famille: 'scientifique',
    noteMaxDefaut: 20,
  })
  await NiveauMatiere.create({
    niveauId: sixieme.id,
    matiereId: maths.id,
    coefficient: 2,
    obligatoire: true,
  })
  await NiveauMatiere.create({
    niveauId: troisieme.id,
    matiereId: maths.id,
    coefficient: 4,
    obligatoire: true,
  })
  const classe = await Classe.create({
    anneeId: a.id,
    niveauId: troisieme.id,
    libelle: '3e A',
    capacite: 40,
  })
  return { sixieme, troisieme, maths, classe }
}

const post = (client: any, admin: any, url: string, corps: object = {}) =>
  client.post(url).json(corps).withCsrfToken().loginAs(admin).redirects(0)

test.group('RG1 · une seule année active', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('activer une année est refusé tant qu’une autre est active', async ({ client, assert }) => {
    const admin = await creerCompte(['admin'])
    await annee('2026-2027', 'active')
    const suivante = await annee('2027-2028', 'preparation')

    const reponse = await post(client, admin, `/admin/annees/${suivante.id}/activer`)
    assert.match(reponse.flashMessages().error, /encore active/)
    await suivante.refresh()
    assert.equal(suivante.etat, 'preparation')
  })

  test('la base refuse deux années actives, même en SQL direct', async ({ assert }) => {
    await annee('2026-2027', 'active')
    const autre = await annee('2027-2028', 'preparation')
    await assert.rejects(() =>
      db.from('annees_scolaires').where('id', autre.id).update({ etat: 'active' })
    )
  })

  test('après clôture de l’active, la suivante s’active ; journalisé', async ({
    client,
    assert,
  }) => {
    const admin = await creerCompte(['admin'])
    const courante = await annee('2026-2027', 'active')
    const suivante = await annee('2027-2028', 'preparation')

    await post(client, admin, `/admin/annees/${courante.id}/cloturer`)
    await post(client, admin, `/admin/annees/${suivante.id}/activer`)

    const active = await AnneeScolaire.active()
    assert.equal(active?.id, suivante.id)
    const traces = await db
      .from('journal')
      .whereIn('action', ['Clôture d’année scolaire', 'Activation d’année scolaire'])
    assert.lengthOf(traces, 2)
  })

  test('l’année active est injectée dans chaque page', async ({ client }) => {
    const tuteur = await creerCompte(['tuteur'])
    const a = await annee('2026-2027', 'active')
    const reponse = await client.get('/portail').loginAs(tuteur).withInertia()
    reponse.assertInertiaPropsContains({ anneeActive: { id: a.id, libelle: '2026-2027' } })
  })
})

test.group('RG2 · année clôturée en lecture seule', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('ni classe, ni période, ni affectation ne se modifient ; pas de réactivation', async ({
    client,
    assert,
  }) => {
    const admin = await creerCompte(['admin'])
    const prof = await creerCompte(['enseignant'])
    const close = await annee('2025-2026', 'cloturee')
    const { troisieme, maths, classe } = await structure(close)
    const periode = await Periode.findByOrFail('annee_id', close.id)

    const essais = [
      await post(client, admin, `/admin/annees/${close.id}/classes`, {
        niveauId: troisieme.id,
        libelle: '3e B',
        capacite: 30,
      }),
      await client
        .put(`/admin/classes/${classe.id}`)
        .json({ niveauId: troisieme.id, libelle: '3e A', capacite: 10 })
        .withCsrfToken()
        .loginAs(admin)
        .redirects(0),
      await client
        .put(`/admin/periodes/${periode.id}`)
        .json({ libelle: 'Modifié', debutSaisie: '2025-09-02', finSaisie: '2025-12-10' })
        .withCsrfToken()
        .loginAs(admin)
        .redirects(0),
      await post(client, admin, `/admin/annees/${close.id}/affectations`, {
        enseignantId: prof.id,
        classeId: classe.id,
        matiereId: maths.id,
      }),
    ]
    for (const r of essais) assert.match(r.flashMessages().error, /lecture seule/)

    await classe.refresh()
    await periode.refresh()
    assert.equal(classe.capacite, 40)
    assert.equal(periode.libelle, '1er trimestre')
    assert.lengthOf(await Classe.query().where('annee_id', close.id), 1)
    assert.lengthOf(await Affectation.all(), 0)

    const reactivation = await post(client, admin, `/admin/annees/${close.id}/activer`)
    assert.exists(reactivation.flashMessages().error)
    await close.refresh()
    assert.equal(close.etat, 'cloturee')
  })
})

test.group('RG3 · coefficient du couple niveau + matière', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('une même matière a un coefficient différent selon le niveau', async ({
    client,
    assert,
  }) => {
    const admin = await creerCompte(['admin'])
    const { sixieme, troisieme, maths } = await structure(await annee('2026-2027', 'active'))

    await client
      .put('/admin/coefficients')
      .json({ niveauId: troisieme.id, matiereId: maths.id, coefficient: 5 })
      .withCsrfToken()
      .loginAs(admin)

    const ligne = (niveauId: number) =>
      NiveauMatiere.query()
        .where({ niveau_id: niveauId, matiere_id: maths.id })
        .whereNull('deleted_at')
        .firstOrFail()
    const [en3e, en6e] = await Promise.all([ligne(troisieme.id), ligne(sixieme.id)])
    assert.equal(en3e.coefficient, 5)
    assert.equal(en6e.coefficient, 2)
    const trace = await db.from('journal').where('action', 'Coefficient modifié').first()
    assert.deepEqual(trace.apres, { coefficient: 5 })
  })

  test('un couple niveau + matière n’a qu’un coefficient (contrainte en base)', async ({
    assert,
  }) => {
    const { troisieme, maths } = await structure(await annee('2026-2027', 'active'))
    await assert.rejects(() =>
      NiveauMatiere.create({
        niveauId: troisieme.id,
        matiereId: maths.id,
        coefficient: 3,
        obligatoire: true,
      })
    )
  })

  test('coefficient nul ou négatif refusé ; retirer la matière bloque les affectations', async ({
    client,
    assert,
  }) => {
    const admin = await creerCompte(['admin'])
    const prof = await creerCompte(['enseignant'])
    const a = await annee('2026-2027', 'active')
    const { troisieme, maths, classe } = await structure(a)

    await client
      .put('/admin/coefficients')
      .json({ niveauId: troisieme.id, matiereId: maths.id, coefficient: 0 })
      .withCsrfToken()
      .loginAs(admin)
    const inchange = await NiveauMatiere.query()
      .where({ niveau_id: troisieme.id, matiere_id: maths.id })
      .whereNull('deleted_at')
      .firstOrFail()
    assert.equal(inchange.coefficient, 4)

    await client
      .put('/admin/coefficients')
      .json({ niveauId: troisieme.id, matiereId: maths.id, coefficient: null })
      .withCsrfToken()
      .loginAs(admin)
    const retiree = await NiveauMatiere.query()
      .where({ niveau_id: troisieme.id, matiere_id: maths.id })
      .firstOrFail()
    assert.isNotNull(retiree.deletedAt, 'suppression logique, pas physique (RG21)')

    const reponse = await post(client, admin, `/admin/annees/${a.id}/affectations`, {
      enseignantId: prof.id,
      classeId: classe.id,
      matiereId: maths.id,
    })
    assert.match(reponse.flashMessages().error, /pas au programme/)
  })
})

test.group('Affectations des enseignants', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('affectation créée et journalisée ; doublon refusé', async ({ client, assert }) => {
    const admin = await creerCompte(['admin'])
    const prof = await creerCompte(['enseignant'])
    const a = await annee('2026-2027', 'active')
    const { maths, classe } = await structure(a)
    const corps = { enseignantId: prof.id, classeId: classe.id, matiereId: maths.id }

    await post(client, admin, `/admin/annees/${a.id}/affectations`, corps)
    const doublon = await post(client, admin, `/admin/annees/${a.id}/affectations`, corps)

    assert.lengthOf(await Affectation.query().whereNull('deleted_at'), 1)
    assert.match(doublon.flashMessages().error, /déjà affecté/)
    assert.exists(await db.from('journal').where('action', 'Affectation d’enseignant').first())
  })

  test('refus : compte non enseignant, classe d’une autre année', async ({ client, assert }) => {
    const admin = await creerCompte(['admin'])
    const tuteur = await creerCompte(['tuteur'])
    const prof = await creerCompte(['enseignant'])
    const a = await annee('2026-2027', 'active')
    const autre = await annee('2027-2028', 'preparation')
    const { maths, classe } = await structure(a)

    const nonEnseignant = await post(client, admin, `/admin/annees/${a.id}/affectations`, {
      enseignantId: tuteur.id,
      classeId: classe.id,
      matiereId: maths.id,
    })
    const mauvaiseAnnee = await post(client, admin, `/admin/annees/${autre.id}/affectations`, {
      enseignantId: prof.id,
      classeId: classe.id,
      matiereId: maths.id,
    })
    assert.match(nonEnseignant.flashMessages().error, /enseignant actif/)
    assert.match(mauvaiseAnnee.flashMessages().error, /n’appartient pas/)
    assert.lengthOf(await Affectation.all(), 0)
  })

  test('retrait : suppression logique, journalisée', async ({ client, assert }) => {
    const admin = await creerCompte(['admin'])
    const prof = await creerCompte(['enseignant'])
    const a = await annee('2026-2027', 'active')
    const { maths, classe } = await structure(a)
    const aff = await Affectation.create({
      enseignantId: prof.id,
      classeId: classe.id,
      matiereId: maths.id,
      anneeId: a.id,
    })

    await client.delete(`/admin/affectations/${aff.id}`).withCsrfToken().loginAs(admin)
    await aff.refresh()
    assert.isNotNull(aff.deletedAt)
  })
})

test.group('Duplication et périodes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('dupliquer reprend classes, professeur principal et affectations', async ({
    client,
    assert,
  }) => {
    const admin = await creerCompte(['admin'])
    const prof = await creerCompte(['enseignant'])
    const source = await annee('2026-2027', 'active')
    const { maths, classe } = await structure(source)
    classe.professeurPrincipalId = prof.id
    await classe.save()
    await Affectation.create({
      enseignantId: prof.id,
      classeId: classe.id,
      matiereId: maths.id,
      anneeId: source.id,
    })

    await post(client, admin, `/admin/annees/${source.id}/dupliquer`, {
      libelle: '2027-2028',
      dateDebut: '2027-09-01',
      dateFin: '2028-06-30',
      decoupage: 'semestres',
    })

    const cible = await AnneeScolaire.findByOrFail('libelle', '2027-2028')
    assert.equal(cible.etat, 'preparation')
    const copies = await Classe.query().where('annee_id', cible.id)
    assert.lengthOf(copies, 1)
    assert.equal(copies[0].professeurPrincipalId, prof.id)
    assert.lengthOf(await Affectation.query().where('annee_id', cible.id), 1)
    assert.lengthOf(await Periode.query().where('annee_id', cible.id), 2, 'deux semestres')
  })

  test('fenêtre de saisie hors de l’année refusée', async ({ client, assert }) => {
    const admin = await creerCompte(['admin'])
    const a = await annee('2026-2027', 'active')
    const periode = await Periode.findByOrFail('annee_id', a.id)
    const reponse = await client
      .put(`/admin/periodes/${periode.id}`)
      .json({ libelle: '1er trimestre', debutSaisie: '2026-08-01', finSaisie: '2026-12-15' })
      .withCsrfToken()
      .loginAs(admin)
      .redirects(0)
    assert.match(String(reponse.flashMessages().error), /rester dans l’année/)
  })
})

test.group('Accès à la structure', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('chaque écran de structure s’affiche avec des données : {url}')
    .with([
      { url: '/admin', page: 'admin/accueil' },
      { url: '/admin/annees', page: 'admin/annees' },
      { url: '/admin/structure', page: 'admin/structure' },
      { url: '/admin/classes', page: 'admin/classes' },
      { url: '/admin/affectations', page: 'admin/affectations' },
    ])
    .run(async ({ client }, { url, page }) => {
      const admin = await creerCompte(['admin'])
      const prof = await creerCompte(['enseignant'])
      const a = await annee('2026-2027', 'active')
      const { maths, classe } = await structure(a)
      await Affectation.create({
        enseignantId: prof.id,
        classeId: classe.id,
        matiereId: maths.id,
        anneeId: a.id,
      })
      const reponse = await client.get(url).loginAs(admin).withInertia()
      reponse.assertStatus(200)
      reponse.assertInertiaComponent(page)
    })

  test('seul l’administrateur paramètre la structure, même en appelant l’URL', async ({
    client,
    assert,
  }) => {
    const direction = await creerCompte(['direction'])
    for (const url of [
      '/admin/annees',
      '/admin/structure',
      '/admin/classes',
      '/admin/affectations',
    ]) {
      const r = await client.get(url).loginAs(direction).redirects(0)
      assert.equal(r.header('location'), '/direction', url)
    }
    const creation = await post(client, direction, '/admin/annees', {
      libelle: '2030-2031',
      dateDebut: '2030-09-01',
      dateFin: '2031-06-30',
      decoupage: 'trimestres',
    })
    assert.equal(creation.header('location'), '/direction')
    assert.isNull(await AnneeScolaire.findBy('libelle', '2030-2031'))
  })
})

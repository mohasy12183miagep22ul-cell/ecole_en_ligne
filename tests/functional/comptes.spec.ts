import { test } from '@japa/runner'
import User from '#models/user'
import EntreeJournal from '#models/entree_journal'
import ace from '@adonisjs/core/services/ace'
import testUtils from '@adonisjs/core/services/test_utils'
import CreerAdministrateur from '#commands/creer_administrateur'
import { creerCompte } from '#tests/aides'

const trace = (action: string, entiteId: number) =>
  EntreeJournal.query().where('action', action).where('entite_id', String(entiteId)).first()

test.group('Comptes et rôles (administrateur)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la liste vient de la base, paginée côté serveur', async ({ client }) => {
    const admin = await creerCompte(['admin'])
    await creerCompte(['enseignant'], { fullName: 'Aïssatou Keïta' })
    const reponse = await client.get('/admin/comptes').loginAs(admin).withInertia()
    reponse.assertStatus(200)
    reponse.assertInertiaComponent('admin/comptes')
    reponse.assertInertiaPropsContains({ pagination: { page: 1 } })
  })

  test('création : mot de passe provisoire, changement imposé, journalisé', async ({
    client,
    assert,
  }) => {
    const admin = await creerCompte(['admin'])
    const reponse = await client
      .post('/admin/comptes')
      .json({
        fullName: 'Lansana Kaba',
        email: 'L.Kaba@Flamboyants.edu.gn',
        roles: ['enseignant', 'professeur_principal'],
      })
      .withCsrfToken()
      .loginAs(admin)
      .redirects(0)
    reponse.assertHeader('location', '/admin/comptes')

    const cree = await User.findByOrFail('email', 'l.kaba@flamboyants.edu.gn')
    await cree.load('rolesUtilisateur')
    assert.sameMembers(cree.roles, ['enseignant', 'professeur_principal'])
    assert.isTrue(cree.doitChangerMotDePasse)
    assert.isFalse(cree.doubleFacteur)

    const { motDePasse } = reponse.flashMessages().compteCree as { motDePasse: string }
    assert.lengthOf(motDePasse, 14)
    assert.notEqual(cree.password, motDePasse)
    assert.exists(await trace('Création de compte', cree.id))
  })

  test('création : second facteur activé pour un compte direction', async ({ client, assert }) => {
    const admin = await creerCompte(['admin'])
    await client
      .post('/admin/comptes')
      .json({ fullName: 'Mamadou Sylla', email: 'm.sylla@test.gn', roles: ['direction'] })
      .withCsrfToken()
      .loginAs(admin)
    const cree = await User.findByOrFail('email', 'm.sylla@test.gn')
    assert.isTrue(cree.doubleFacteur)
  })

  test('création refusée : e-mail déjà pris ou aucun rôle', async ({ client, assert }) => {
    const admin = await creerCompte(['admin'])
    const existant = await creerCompte(['tuteur'])
    for (const corps of [
      { fullName: 'Doublon', email: existant.email, roles: ['tuteur'] },
      { fullName: 'Sans rôle', email: 'sans.role@test.gn', roles: [] },
    ]) {
      await client.post('/admin/comptes').json(corps).withCsrfToken().loginAs(admin).redirects(0)
    }
    assert.isNull(await User.findBy('email', 'sans.role@test.gn'))
    const homonymes = await User.query().where('email', existant.email)
    assert.lengthOf(homonymes, 1)
  })

  test('changement de rôle : ancien rôle supprimé logiquement, journalisé', async ({
    client,
    assert,
  }) => {
    const admin = await creerCompte(['admin'])
    const prof = await creerCompte(['enseignant'])
    await client
      .put(`/admin/comptes/${prof.id}/roles`)
      .json({ roles: ['direction'] })
      .withCsrfToken()
      .loginAs(admin)

    await prof.load('rolesUtilisateur')
    assert.deepEqual(prof.roles, ['direction'])
    const t = await trace('Changement de rôle', prof.id)
    assert.deepEqual(t?.avant, { roles: ['enseignant'] })
    assert.deepEqual(t?.apres, { roles: ['direction'] })
  })

  test('désactivation journalisée ; l’admin ne peut se désactiver lui-même', async ({
    client,
    assert,
  }) => {
    const admin = await creerCompte(['admin'])
    const tuteur = await creerCompte(['tuteur'])
    await client
      .put(`/admin/comptes/${tuteur.id}/activation`)
      .json({ actif: false })
      .withCsrfToken()
      .loginAs(admin)
    await tuteur.refresh()
    assert.isFalse(tuteur.actif)
    assert.exists(await trace('Compte désactivé', tuteur.id))

    await client
      .put(`/admin/comptes/${admin.id}/activation`)
      .json({ actif: false })
      .withCsrfToken()
      .loginAs(admin)
    await admin.refresh()
    assert.isTrue(admin.actif)
  })

  test('un autre profil ne peut pas créer de compte, même en appelant l’URL', async ({
    client,
    assert,
  }) => {
    const direction = await creerCompte(['direction'])
    const reponse = await client
      .post('/admin/comptes')
      .json({ fullName: 'Intrus', email: 'intrus@test.gn', roles: ['admin'] })
      .withCsrfToken()
      .loginAs(direction)
      .redirects(0)
    reponse.assertHeader('location', '/direction')
    assert.isNull(await User.findBy('email', 'intrus@test.gn'))
  })
})

test.group('Journal d’activité (écran)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la direction lit le vrai journal, du plus récent au plus ancien', async ({ client }) => {
    const admin = await creerCompte(['admin'])
    const direction = await creerCompte(['direction'])
    await client
      .post('/admin/comptes')
      .json({ fullName: 'Hawa Konaté', email: 'h.konate@test.gn', roles: ['secretariat'] })
      .withCsrfToken()
      .loginAs(admin)

    const reponse = await client.get('/admin/journal').loginAs(direction).withInertia()
    reponse.assertStatus(200)
    reponse.assertInertiaComponent('admin/journal')
    reponse.assertInertiaPropsContains({
      entrees: [{ action: 'Création de compte' }],
    })
  })
})

test.group('Installation · premier administrateur', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la commande crée un administrateur à mot de passe provisoire, journalisé', async ({
    assert,
  }) => {
    const commande = await ace.create(CreerAdministrateur, [
      '--nom=Kadiatou Barry',
      '--email=Direction.Info@ecole.gn',
    ])
    await commande.exec()
    commande.assertSucceeded()

    const user = await User.findByOrFail('email', 'direction.info@ecole.gn')
    await user.load('rolesUtilisateur')
    assert.isTrue(user.aLeRole('admin'))
    assert.isTrue(user.doitChangerMotDePasse)
    assert.isTrue(user.doubleFacteur)
    assert.exists(await trace('Création de compte', user.id))

    const doublon = await ace.create(CreerAdministrateur, [
      '--nom=Autre',
      '--email=direction.info@ecole.gn',
    ])
    await doublon.exec()
    commande.assertSucceeded()
    assert.equal(doublon.exitCode, 1)
  })
})

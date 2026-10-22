import { test } from '@japa/runner'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import EntreeJournal from '#models/entree_journal'
import testUtils from '@adonisjs/core/services/test_utils'
import { MAX_ECHECS } from '#services/authentification_service'
import { creerCompte, MOT_DE_PASSE } from '#tests/aides'

const connexion = (client: any, email: string, password: string) =>
  client.post('/login').form({ email, password }).withCsrfToken().redirects(0)

test.group('Authentification · connexion', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  // Aucun courriel réel en test : le code du second facteur est intercepté.
  group.each.setup(() => {
    mail.fake()
    return () => mail.restore()
  })

  test('un tuteur arrive sur le portail famille', async ({ client }) => {
    const user = await creerCompte(['tuteur'])
    const reponse = await connexion(client, user.email, MOT_DE_PASSE)
    reponse.assertStatus(302)
    reponse.assertHeader('location', '/portail')
  })

  test('après un échec, aucune saisie n’est renvoyée au formulaire', async ({ client, assert }) => {
    const user = await creerCompte(['tuteur'])
    const reponse = await connexion(client, user.email, 'MauvaisMotDePasse')
    const flash = reponse.flashMessages() as Record<string, any>
    assert.exists(flash.inputErrorsBag?.connexion)
    assert.notProperty(flash, 'email')
    assert.notProperty(flash, 'password')
  })

  test('les rôles se cumulent : enseignant + professeur principal', async ({ client, assert }) => {
    const user = await creerCompte(['enseignant', 'professeur_principal'])
    const reponse = await connexion(client, user.email, MOT_DE_PASSE)
    reponse.assertHeader('location', '/enseignant/classes')
    await user.load('rolesUtilisateur')
    assert.sameMembers(user.roles, ['enseignant', 'professeur_principal'])
  })

  test('identifiants faux : refus et connexion échouée journalisée', async ({ client, assert }) => {
    const user = await creerCompte(['tuteur'])
    const reponse = await connexion(client, user.email, 'mauvais-mot-de-passe')
    reponse.assertStatus(302)
    reponse.assertFlashMessage('inputErrorsBag', {
      connexion: 'Adresse e-mail ou mot de passe incorrect.',
    })
    const trace = await EntreeJournal.query()
      .where('user_id', user.id)
      .where('action', 'Connexion échouée')
      .first()
    assert.exists(trace)
  })

  test('verrouillage temporaire après 5 échecs, même avec le bon mot de passe', async ({
    client,
    assert,
  }) => {
    const user = await creerCompte(['tuteur'])
    for (let i = 0; i < MAX_ECHECS; i++) await connexion(client, user.email, 'faux-mot-de-passe')

    await user.refresh()
    assert.isNotNull(user.verrouilleJusquA)

    // Bon mot de passe, mais compte verrouillé : refus, aucune session ouverte.
    const reponse = await connexion(client, user.email, MOT_DE_PASSE)
    assert.notEqual(reponse.header('location'), '/portail')
    assert.match(
      reponse.flashMessages().inputErrorsBag.connexion,
      /^Compte temporairement verrouillé/
    )
    assert.isTrue(
      await EntreeJournal.query()
        .where('user_id', user.id)
        .where('action', 'Compte verrouillé')
        .first()
        .then(Boolean)
    )
  })

  test('un compte désactivé ne peut pas se connecter', async ({ client }) => {
    const user = await creerCompte(['tuteur'], { actif: false })
    const reponse = await connexion(client, user.email, MOT_DE_PASSE)
    reponse.assertFlashMessage('inputErrorsBag', {
      connexion: 'Adresse e-mail ou mot de passe incorrect.',
    })
  })

  test('direction : second facteur exigé avant l’ouverture de session', async ({ client }) => {
    const user = await creerCompte(['direction'], { doubleFacteur: true })
    const reponse = await connexion(client, user.email, MOT_DE_PASSE)
    reponse.assertHeader('location', '/connexion/verification')

    const sansCode = await client.get('/direction').redirects(0)
    sansCode.assertHeader('location', '/login')
  })
})

test.group('Authentification · mot de passe', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('changement imposé : les espaces renvoient vers le profil', async ({ client }) => {
    const user = await creerCompte(['enseignant'], { doitChangerMotDePasse: true })
    const reponse = await client.get('/enseignant/classes').loginAs(user).redirects(0)
    reponse.assertHeader('location', '/profil')
  })

  test('nouveau mot de passe : 10 caractères minimum', async ({ client, assert }) => {
    const user = await creerCompte(['enseignant'], { doitChangerMotDePasse: true })
    await client
      .post('/profil/mot-de-passe')
      .form({ actuel: MOT_DE_PASSE, nouveau: 'court', confirmation: 'court' })
      .withCsrfToken()
      .loginAs(user)
      .redirects(0)
    await user.refresh()
    assert.isTrue(user.doitChangerMotDePasse)
  })

  test('changement réussi : obligation levée, mot de passe haché, journalisé', async ({
    client,
    assert,
  }) => {
    const user = await creerCompte(['enseignant'], { doitChangerMotDePasse: true })
    const nouveau = 'NouveauSecret2026'
    const reponse = await client
      .post('/profil/mot-de-passe')
      .form({ actuel: MOT_DE_PASSE, nouveau, confirmation: nouveau })
      .withCsrfToken()
      .loginAs(user)
      .redirects(0)
    reponse.assertHeader('location', '/enseignant/classes')

    const relu = await User.findOrFail(user.id)
    assert.isFalse(relu.doitChangerMotDePasse)
    assert.notEqual(relu.password, nouveau)
    assert.isTrue(
      await EntreeJournal.query()
        .where('user_id', user.id)
        .where('action', 'Changement de mot de passe')
        .first()
        .then(Boolean)
    )
  })
})

import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import EntreeJournal from '#models/entree_journal'
import JetonReinitialisation from '#models/jeton_reinitialisation'
import testUtils from '@adonisjs/core/services/test_utils'
import { creerCompte, MOT_DE_PASSE } from '#tests/aides'

const NOUVEAU = 'NouveauSecret2026'

/** Demande un lien et renvoie le jeton extrait du courriel intercepté. */
async function demanderJeton(client: any, email: string) {
  const { messages } = mail.fake()
  await client.post('/mot-de-passe-oublie').form({ email }).withCsrfToken()
  const envoye = messages.sent()[0]
  mail.restore()
  if (!envoye) return null
  const texte = envoye.toJSON()
  const corps = JSON.stringify(texte)
  return corps.match(/reinitialiser\/([\w-]{20,})/)?.[1] ?? null
}

test.group('Mot de passe oublié', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('compte connu : un lien à usage unique est envoyé par courriel', async ({
    client,
    assert,
  }) => {
    const user = await creerCompte(['tuteur'])
    const jeton = await demanderJeton(client, user.email)
    assert.isString(jeton)
    const enBase = await JetonReinitialisation.findByOrFail('user_id', user.id)
    assert.notEqual(enBase.empreinte, jeton, 'seule l’empreinte est stockée')
  })

  test('compte inconnu : même réponse, aucun courriel, aucun jeton', async ({ client, assert }) => {
    const { messages } = mail.fake()
    const reponse = await client
      .post('/mot-de-passe-oublie')
      .form({ email: 'personne@test.gn' })
      .withCsrfToken()
      .withInertia()
    reponse.assertInertiaComponent('auth/lien_envoye')
    messages.assertNoneSent()
    mail.restore()
    assert.lengthOf(await JetonReinitialisation.all(), 0)
  })

  test('le lien fixe le nouveau mot de passe, lève le verrouillage, est journalisé', async ({
    client,
    assert,
  }) => {
    const user = await creerCompte(['tuteur'])
    user.verrouilleJusquA = DateTime.now().plus({ minutes: 10 })
    await user.save()
    const jeton = (await demanderJeton(client, user.email))!

    const reponse = await client
      .post(`/reinitialiser/${jeton}`)
      .form({ nouveau: NOUVEAU, confirmation: NOUVEAU })
      .withCsrfToken()
      .redirects(0)
    reponse.assertHeader('location', '/login')

    const relu = await User.findOrFail(user.id)
    assert.isNull(relu.verrouilleJusquA)
    const connexion = await client
      .post('/login')
      .form({ email: user.email, password: NOUVEAU })
      .withCsrfToken()
      .redirects(0)
    connexion.assertHeader('location', '/portail')
    assert.exists(
      await EntreeJournal.query()
        .where('user_id', user.id)
        .where('action', 'Réinitialisation du mot de passe')
        .first()
    )
  })

  test('un lien ne sert qu’une fois', async ({ client, assert }) => {
    const user = await creerCompte(['tuteur'])
    const jeton = (await demanderJeton(client, user.email))!
    const envoyer = (mdp: string) =>
      client
        .post(`/reinitialiser/${jeton}`)
        .form({ nouveau: mdp, confirmation: mdp })
        .withCsrfToken()
        .redirects(0)

    await envoyer(NOUVEAU)
    const second = await envoyer('EncoreUnAutre2026')
    second.assertHeader('location', '/mot-de-passe-oublie')

    const connexion = await client
      .post('/login')
      .form({ email: user.email, password: NOUVEAU })
      .withCsrfToken()
      .redirects(0)
    assert.equal(connexion.header('location'), '/portail')
  })

  test('un lien expiré est refusé et l’ancien mot de passe reste valable', async ({
    client,
    assert,
  }) => {
    const user = await creerCompte(['tuteur'])
    const jeton = (await demanderJeton(client, user.email))!
    await JetonReinitialisation.query()
      .where('user_id', user.id)
      .update({ expire_le: DateTime.now().minus({ minutes: 1 }).toSQL() })

    const page = await client.get(`/reinitialiser/${jeton}`).withInertia()
    page.assertInertiaPropsContains({ valide: false })

    await client
      .post(`/reinitialiser/${jeton}`)
      .form({ nouveau: NOUVEAU, confirmation: NOUVEAU })
      .withCsrfToken()
    const connexion = await client
      .post('/login')
      .form({ email: user.email, password: MOT_DE_PASSE })
      .withCsrfToken()
      .redirects(0)
    assert.equal(connexion.header('location'), '/portail')
  })

  test('une nouvelle demande invalide le lien précédent', async ({ client }) => {
    const user = await creerCompte(['tuteur'])
    const premier = (await demanderJeton(client, user.email))!
    await demanderJeton(client, user.email)
    const page = await client.get(`/reinitialiser/${premier}`).withInertia()
    page.assertInertiaPropsContains({ valide: false })
  })
})

test.group('Second facteur par courriel', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('le code part par courriel au compte direction', async ({ client, assert }) => {
    const user = await creerCompte(['direction'], { doubleFacteur: true })
    const { messages } = mail.fake()
    await client
      .post('/login')
      .form({ email: user.email, password: MOT_DE_PASSE })
      .withCsrfToken()
      .redirects(0)

    // Vérifier avant `restore()`, qui vide les messages interceptés.
    messages.assertSentCount(1)
    messages.assertSent({ to: user.email, subject: 'Votre code de vérification' })
    assert.match(JSON.stringify(messages.sent()[0].toJSON()), /\b\d{6}\b/)
    mail.restore()
  })
})

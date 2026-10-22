import { test } from '@japa/runner'
import type { Role } from '#models/role_utilisateur'
import testUtils from '@adonisjs/core/services/test_utils'
import { creerCompte } from '#tests/aides'

/**
 * Droits testés par profil, y compris les accès refusés par manipulation
 * d'URL (cahier des charges § 14).
 */
const ESPACES: Array<{ url: string; autorises: Role[] }> = [
  { url: '/portail', autorises: ['tuteur', 'eleve'] },
  { url: '/enseignant/classes', autorises: ['enseignant', 'professeur_principal'] },
  { url: '/direction', autorises: ['direction'] },
  { url: '/scolarite/eleves', autorises: ['secretariat', 'direction'] },
  { url: '/scolarite/inscription', autorises: ['secretariat', 'direction'] },
  { url: '/scolarite/import', autorises: ['secretariat', 'direction'] },
  { url: '/direction/inscriptions', autorises: ['direction'] },
  { url: '/documents', autorises: ['secretariat', 'direction', 'admin'] },
  { url: '/admin', autorises: ['admin'] },
  { url: '/admin/journal', autorises: ['admin', 'direction'] },
]
const ROLES: Role[] = ['tuteur', 'enseignant', 'direction', 'secretariat', 'admin']

test.group('Accès par rôle', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un visiteur non connecté est renvoyé vers la connexion : {url}')
    .with(ESPACES)
    .run(async ({ client }, { url }) => {
      const reponse = await client.get(url).redirects(0)
      reponse.assertHeader('location', '/login')
    })

  for (const role of ROLES) {
    test(`profil ${role} : espaces ouverts et refusés`)
      .with(ESPACES)
      .run(async ({ client, assert }, { url, autorises }) => {
        const user = await creerCompte([role])
        const reponse = await client.get(url).loginAs(user).redirects(0)
        if (autorises.includes(role)) {
          reponse.assertStatus(200)
        } else {
          assert.equal(reponse.status(), 302, `${role} ne doit pas ouvrir ${url}`)
          assert.notEqual(reponse.header('location'), url)
        }
      })
  }

  test('un compte désactivé en cours de session perd l’accès', async ({ client }) => {
    const user = await creerCompte(['admin'])
    user.actif = false
    await user.save()
    const reponse = await client.get('/admin').loginAs(user).redirects(0)
    reponse.assertHeader('location', '/login')
  })
})

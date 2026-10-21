import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import EntreeJournal from '#models/entree_journal'
import JournalService from '#services/journal_service'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('RG22 · journal non modifiable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('une entrée ne peut être ni modifiée ni supprimée, même en SQL direct', async ({
    assert,
  }) => {
    const entree = await JournalService.enregistrer({
      userId: null,
      action: 'Validation',
      entite: 'evaluations',
      entiteId: 42,
      avant: { etat: 'soumise' },
      apres: { etat: 'validée' },
      ip: '127.0.0.1',
    })

    await db.from('journal').where('id', entree.id).update({ action: 'Falsifiée' })
    await db.from('journal').where('id', entree.id).delete()

    const relue = await EntreeJournal.findOrFail(entree.id)
    assert.equal(relue.action, 'Validation')
    assert.deepEqual(relue.apres, { etat: 'validée' })
  })
})

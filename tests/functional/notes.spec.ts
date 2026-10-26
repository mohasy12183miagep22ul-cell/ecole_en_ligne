import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Eleve from '#models/eleve'
import Niveau from '#models/niveau'
import Classe from '#models/classe'
import Matiere from '#models/matiere'
import Periode from '#models/periode'
import Inscription from '#models/inscription'
import Affectation from '#models/affectation'
import NiveauMatiere from '#models/niveau_matiere'
import AnneeScolaire from '#models/annee_scolaire'
import Evaluation from '#models/evaluation'
import MoyenneService from '#services/moyenne_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { creerCompte } from '#tests/aides'

const aujourdhui = DateTime.now().startOf('day')

/** Année active, fenêtre de saisie ouverte, une 3e A de 3 élèves, maths (coef 4) et français (coef 2). */
async function contexte(fenetre: 'ouverte' | 'close' = 'ouverte') {
  const annee = await AnneeScolaire.create({
    libelle: '2026-2027',
    dateDebut: aujourdhui.minus({ months: 2 }),
    dateFin: aujourdhui.plus({ months: 8 }),
    decoupage: 'trimestres',
    etat: 'active',
  })
  const periode = await Periode.create({
    anneeId: annee.id,
    libelle: '1er trimestre',
    ordre: 1,
    debutSaisie: aujourdhui.minus({ days: 40 }),
    finSaisie:
      fenetre === 'ouverte' ? aujourdhui.plus({ days: 30 }) : aujourdhui.minus({ days: 1 }),
  })
  const niveau = await Niveau.create({ code: '3E', libelle: '3e', ordre: 4, cycle: 'college' })
  const maths = await Matiere.create({
    code: 'MA',
    libelle: 'Mathématiques',
    famille: 'scientifique',
    noteMaxDefaut: 20,
  })
  const francais = await Matiere.create({
    code: 'FR',
    libelle: 'Français',
    famille: 'litteraire',
    noteMaxDefaut: 20,
  })
  await NiveauMatiere.create({
    niveauId: niveau.id,
    matiereId: maths.id,
    coefficient: 4,
    obligatoire: true,
  })
  await NiveauMatiere.create({
    niveauId: niveau.id,
    matiereId: francais.id,
    coefficient: 2,
    obligatoire: true,
  })
  const classe = await Classe.create({
    anneeId: annee.id,
    niveauId: niveau.id,
    libelle: '3e A',
    capacite: 40,
  })
  const enseignant = await creerCompte(['enseignant'])
  const collegue = await creerCompte(['enseignant'])
  const direction = await creerCompte(['direction'])
  const affectation = await Affectation.create({
    enseignantId: enseignant.id,
    classeId: classe.id,
    matiereId: maths.id,
    anneeId: annee.id,
  })
  const affFrancais = await Affectation.create({
    enseignantId: collegue.id,
    classeId: classe.id,
    matiereId: francais.id,
    anneeId: annee.id,
  })

  const eleves: Eleve[] = []
  for (const [i, nom] of ['Bah', 'Camara', 'Diallo'].entries()) {
    const e = await Eleve.create({
      matricule: `2026-0000${i + 1}`,
      nom,
      prenoms: 'Test',
      sexe: 'F',
      dateNaissance: DateTime.fromISO('2012-01-01'),
      lieuNaissance: 'Conakry',
      statut: 'inscrit',
    })
    await Inscription.create({
      eleveId: e.id,
      anneeId: annee.id,
      niveauId: niveau.id,
      classeId: classe.id,
      dateInscription: aujourdhui.minus({ months: 3 }),
      etat: 'valide',
      redoublant: false,
      valideLe: aujourdhui.minus({ months: 3 }),
    })
    eleves.push(e)
  }
  return {
    annee,
    periode,
    classe,
    maths,
    francais,
    enseignant,
    collegue,
    direction,
    affectation,
    affFrancais,
    eleves,
  }
}

type Ctx = Awaited<ReturnType<typeof contexte>>

async function evaluation(
  ctx: Ctx,
  options: Partial<{ affectationId: number; noteMax: number; poids: number }> = {}
) {
  return Evaluation.create({
    affectationId: options.affectationId ?? ctx.affectation.id,
    periodeId: ctx.periode.id,
    type: 'devoir',
    titre: 'Devoir n°1',
    date: aujourdhui.minus({ days: 2 }),
    noteMax: options.noteMax ?? 20,
    poids: options.poids ?? 1,
    etat: 'brouillon',
  })
}

/** Enregistrement automatique de la grille, comme le fait l'écran (JSON). */
const saisir = (client: any, user: any, evId: number, saisies: object[]) =>
  client
    .post(`/enseignant/evaluations/${evId}/notes`)
    .json({ saisies })
    .header('accept', 'application/json')
    .withCsrfToken()
    .loginAs(user)

const formulaire = (client: any, user: any, url: string, corps: object = {}) =>
  client.post(url).json(corps).withCsrfToken().loginAs(user).redirects(0)

function refuse(assert: any, reponse: any) {
  if ([403, 404].includes(reponse.status())) return
  assert.equal(reponse.status(), 302, 'refus attendu')
  const flash = reponse.flashMessages()
  assert.isTrue(
    Boolean(flash.errorsBag?.E_AUTHORIZATION_FAILURE) || reponse.header('location') !== undefined
  )
}

test.group('Calcul des moyennes (service unique)', () => {
  test('RG11 : un absent sort du numérateur et du dénominateur, un 0 compte', ({ assert }) => {
    const n = (valeur: number | null, absent = false) => ({ valeur, absent, noteMax: 20, poids: 1 })
    assert.equal(MoyenneService.moyenneMatiere([n(16), n(null, true)]), 16)
    assert.equal(MoyenneService.moyenneMatiere([n(16), n(0)]), 8)
    assert.isNull(MoyenneService.moyenneMatiere([n(null, true)]))
  })

  test('pondération par le poids, notes ramenées sur 20', ({ assert }) => {
    const m = MoyenneService.moyenneMatiere([
      { valeur: 5, absent: false, noteMax: 10, poids: 1 }, // 10/20
      { valeur: 16, absent: false, noteMax: 20, poids: 3 }, // 16/20
    ])
    assert.equal(m, (10 * 1 + 16 * 3) / 4)
  })

  test('RG3 et RG15 : moyenne générale pondérée par les coefficients, jamais arrondie', ({
    assert,
  }) => {
    const g = MoyenneService.moyenneGenerale([
      { moyenne: 10, coefficient: 4 },
      { moyenne: 11, coefficient: 2 },
      { moyenne: null, coefficient: 3 },
    ])
    assert.equal(g, (10 * 4 + 11 * 2) / 6)
    assert.notEqual(g, 10.33)
  })

  test('RG16 : rang sur la valeur non arrondie, égalité → même rang, rang suivant sauté', ({
    assert,
  }) => {
    const r = MoyenneService.rangs([
      { cle: 'a', valeur: 15 },
      { cle: 'b', valeur: 12.004 },
      { cle: 'c', valeur: 12.004 },
      { cle: 'd', valeur: 12.001 },
      { cle: 'e', valeur: null },
    ])
    assert.deepEqual(
      [...r.entries()],
      [
        ['a', 1],
        ['b', 2],
        ['c', 2],
        ['d', 4],
        ['e', null],
      ]
    )
  })
})

test.group('RG9 · un enseignant ne saisit que sur ses affectations', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la grille d’un collègue est refusée, même en appelant l’URL', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx, { affectationId: ctx.affFrancais.id })
    const lecture = await client
      .get(`/enseignant/evaluations/${ev.id}`)
      .loginAs(ctx.enseignant)
      .redirects(0)
    refuse(assert, lecture)
    const ecriture = await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 12, absent: false },
    ])
    assert.equal(ecriture.status(), 403)
    assert.lengthOf(await db.from('notes'), 0)
  })

  test('créer une évaluation sur l’affectation d’un collègue est refusé', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const reponse = await formulaire(client, ctx.enseignant, '/enseignant/evaluations', {
      affectationId: ctx.affFrancais.id,
      periodeId: ctx.periode.id,
      type: 'devoir',
      titre: 'Intrus',
      date: aujourdhui.toISODate(),
      noteMax: 20,
      poids: 1,
    })
    refuse(assert, reponse)
    assert.lengthOf(await db.from('evaluations'), 0)
  })

  test('un élève d’une autre classe ne peut pas recevoir de note', async ({ client, assert }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx)
    const intrus = await Eleve.create({
      matricule: '2026-09999',
      nom: 'Autre',
      prenoms: 'Classe',
      sexe: 'M',
      dateNaissance: DateTime.fromISO('2012-01-01'),
      lieuNaissance: 'Labé',
      statut: 'inscrit',
    })
    const r = await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: intrus.id, valeur: 12, absent: false },
    ])
    r.assertStatus(422)
    assert.match(r.body().message, /n’appartient pas/)
  })

  test('mes classes et mes évaluations ne montrent que mes affectations', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    await evaluation(ctx)
    await evaluation(ctx, { affectationId: ctx.affFrancais.id })
    const page = await client.get('/enseignant/evaluations').loginAs(ctx.enseignant).withInertia()
    const props = page.inertiaProps as any
    assert.lengthOf(props.evaluations, 1)
    assert.equal(props.evaluations[0].matiere, 'Mathématiques')
  })
})

test.group('RG10 et RG11 · bornes et absents', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('une note au-dessus de la note maximale est refusée, en application et en base', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx, { noteMax: 10 })
    const r = await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 12, absent: false },
    ])
    r.assertStatus(422)
    assert.match(r.body().message, /entre 0 et 10/)
    await assert.rejects(() =>
      db.transaction((trx) =>
        trx.table('notes').insert({
          evaluation_id: ev.id,
          eleve_id: ctx.eleves[0].id,
          valeur: 12,
          absent: false,
          created_at: new Date(),
        })
      )
    )
  })

  test('une note négative est refusée', async ({ client }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx)
    const r = await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: -1, absent: false },
    ])
    r.assertStatus(422)
  })

  test('un absent n’a pas de note ; il n’entre pas dans la moyenne, un 0 y entre', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx)
    const refus = await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 0, absent: true },
    ])
    refus.assertStatus(422)

    const ok = await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 16, absent: false },
      { eleveId: ctx.eleves[1].id, valeur: null, absent: true },
      { eleveId: ctx.eleves[2].id, valeur: 0, absent: false },
    ])
    ok.assertStatus(200)
    assert.equal(ok.body().statistiques.moyenne, 8)
    assert.equal(ok.body().statistiques.absents, 1)

    const r = await MoyenneService.resultatsClasse(ctx.classe.id, ctx.periode.id, 'toutes')
    const parEleve = new Map(r.lignes.map((l) => [l.eleveId, l.moyennes[ctx.maths.id]]))
    assert.equal(parEleve.get(ctx.eleves[0].id), 16)
    assert.isNull(parEleve.get(ctx.eleves[1].id))
    assert.equal(parEleve.get(ctx.eleves[2].id), 0)
  })
})

test.group('RG12 · évaluation validée : déverrouillage par la direction seulement', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('soumise puis validée : plus de saisie ; l’enseignant ne valide ni ne déverrouille', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx)
    await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 12, absent: false },
    ])
    await formulaire(client, ctx.enseignant, `/enseignant/evaluations/${ev.id}/soumettre`)
    await ev.refresh()
    assert.equal(ev.etat, 'soumise')

    const fermee = await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 14, absent: false },
    ])
    fermee.assertStatus(422)

    refuse(
      assert,
      await formulaire(client, ctx.enseignant, `/direction/evaluations/${ev.id}/valider`)
    )
    await formulaire(client, ctx.direction, `/direction/evaluations/${ev.id}/valider`)
    await ev.refresh()
    assert.equal(ev.etat, 'validee')
    assert.equal(ev.valideePar, ctx.direction.id)

    // Sous-transaction : l'échec attendu n'interrompt pas la transaction du test.
    await assert.rejects(() =>
      db.transaction((trx) =>
        trx.from('notes').where('evaluation_id', ev.id).update({ valeur: 20 })
      )
    )
    refuse(
      assert,
      await formulaire(client, ctx.enseignant, `/direction/evaluations/${ev.id}/deverrouiller`, {
        motif: 'Erreur de saisie',
      })
    )
  })

  test('le déverrouillage exige un motif, est journalisé, et rouvre la saisie', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx)
    await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 12, absent: false },
    ])
    await formulaire(client, ctx.enseignant, `/enseignant/evaluations/${ev.id}/soumettre`)
    await formulaire(client, ctx.direction, `/direction/evaluations/${ev.id}/valider`)

    const sansMotif = await formulaire(
      client,
      ctx.direction,
      `/direction/evaluations/${ev.id}/deverrouiller`,
      {}
    )
    assert.exists(sansMotif.flashMessages().inputErrorsBag?.motif)
    await formulaire(client, ctx.direction, `/direction/evaluations/${ev.id}/deverrouiller`, {
      motif: 'Copie oubliée',
    })
    await ev.refresh()
    assert.equal(ev.etat, 'brouillon')
    assert.equal(ev.motifRetour, 'Copie oubliée')

    const trace = await db.from('journal').where('action', 'Déverrouillage d’évaluation').first()
    assert.equal(trace.user_id, ctx.direction.id)
    assert.equal(trace.apres.motif, 'Copie oubliée')

    const reprise = await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 15, absent: false },
    ])
    reprise.assertStatus(200)
  })
})

test.group('RG13 · fenêtre de saisie et dérogation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('hors fenêtre, la saisie est refusée ; une dérogation de la direction la rouvre', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte('close')
    const ev = await evaluation(ctx)
    const refus = await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 12, absent: false },
    ])
    refus.assertStatus(422)
    assert.equal(refus.body().regle, 'RG13')

    refuse(
      assert,
      await formulaire(client, ctx.enseignant, '/direction/derogations', {
        affectationId: ctx.affectation.id,
        periodeId: ctx.periode.id,
        jusquAu: aujourdhui.plus({ days: 3 }).toISODate(),
        motif: 'Tentative enseignant',
      })
    )
    await formulaire(client, ctx.direction, '/direction/derogations', {
      affectationId: ctx.affectation.id,
      periodeId: ctx.periode.id,
      jusquAu: aujourdhui.plus({ days: 3 }).toISODate(),
      motif: 'Copies rendues en retard',
    })
    const ok = await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 12, absent: false },
    ])
    ok.assertStatus(200)
    assert.exists(await db.from('journal').where('action', 'Dérogation de saisie').first())
  })
})

test.group('RG14 et RG22 · moyennes recalculées, notes journalisées', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('aucune moyenne stockée : le cache daté suit les notes', async ({ client, assert }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx)
    await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 10, absent: false },
    ])
    await formulaire(client, ctx.enseignant, `/enseignant/evaluations/${ev.id}/soumettre`)
    await formulaire(client, ctx.direction, `/direction/evaluations/${ev.id}/valider`)

    const avant = await MoyenneService.resultatsClasse(ctx.classe.id, ctx.periode.id)
    assert.equal(
      avant.lignes.find((l) => l.eleveId === ctx.eleves[0].id)!.moyennes[ctx.maths.id],
      10
    )

    await formulaire(client, ctx.direction, `/direction/evaluations/${ev.id}/deverrouiller`, {
      motif: 'Correction',
    })
    await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 18, absent: false },
    ])
    await formulaire(client, ctx.enseignant, `/enseignant/evaluations/${ev.id}/soumettre`)
    await formulaire(client, ctx.direction, `/direction/evaluations/${ev.id}/valider`)

    const apres = await MoyenneService.resultatsClasse(ctx.classe.id, ctx.periode.id)
    assert.equal(
      apres.lignes.find((l) => l.eleveId === ctx.eleves[0].id)!.moyennes[ctx.maths.id],
      18
    )
    const colonnes = await db.rawQuery(
      `SELECT column_name FROM information_schema.columns WHERE table_name IN ('notes','evaluations','inscriptions') AND column_name ILIKE '%moyenne%'`
    )
    assert.lengthOf(colonnes.rows, 0)
  })

  test('saisie et modification de note : auteur, avant et après au journal', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx)
    await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 11, absent: false },
    ])
    await saisir(client, ctx.enseignant, ev.id, [
      { eleveId: ctx.eleves[0].id, valeur: 13.5, absent: false },
    ])
    const traces = await db.from('journal').where('entite', 'notes').orderBy('id')
    assert.lengthOf(traces, 2)
    assert.equal(traces[0].action, 'Saisie de note')
    assert.equal(traces[1].action, 'Modification de note')
    assert.equal(traces[1].avant.note, '11')
    assert.equal(traces[1].apres.note, '13,5')
    assert.equal(traces[1].user_id, ctx.enseignant.id)
    assert.exists(traces[1].ip)
  })

  test('les moyennes de la délibération ne comptent que les évaluations validées', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const validee = await evaluation(ctx)
    const brouillon = await evaluation(ctx)
    await saisir(client, ctx.enseignant, validee.id, [
      { eleveId: ctx.eleves[0].id, valeur: 10, absent: false },
    ])
    await saisir(client, ctx.enseignant, brouillon.id, [
      { eleveId: ctx.eleves[0].id, valeur: 20, absent: false },
    ])
    await formulaire(client, ctx.enseignant, `/enseignant/evaluations/${validee.id}/soumettre`)
    await formulaire(client, ctx.direction, `/direction/evaluations/${validee.id}/valider`)

    const officiel = await MoyenneService.resultatsClasse(ctx.classe.id, ctx.periode.id, 'validees')
    const provisoire = await MoyenneService.resultatsClasse(ctx.classe.id, ctx.periode.id, 'toutes')
    const de = (r: typeof officiel) =>
      r.lignes.find((l) => l.eleveId === ctx.eleves[0].id)!.moyennes[ctx.maths.id]
    assert.equal(de(officiel), 10)
    assert.equal(de(provisoire), 15)
  })
})

test.group('Notes · écrans et accès par profil', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('chaque écran enseignant et direction s’affiche avec des données', async ({ client }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx)
    for (const url of [
      '/enseignant/classes',
      '/enseignant/evaluations',
      '/enseignant/evaluations/nouvelle',
      `/enseignant/evaluations/${ev.id}`,
      '/enseignant/appreciations',
      '/enseignant/recapitulatif',
    ]) {
      const r = await client.get(url).loginAs(ctx.enseignant)
      r.assertStatus(200)
    }
    for (const url of [
      '/direction/validation',
      '/direction/validation?onglet=validees',
      '/direction/suivi',
    ]) {
      const r = await client.get(url).loginAs(ctx.direction)
      r.assertStatus(200)
    }
  })

  test('secrétariat, tuteur et administrateur n’ouvrent pas la grille', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const ev = await evaluation(ctx)
    for (const role of ['secretariat', 'tuteur', 'admin'] as const) {
      const user = await creerCompte([role])
      const r = await client.get(`/enseignant/evaluations/${ev.id}`).loginAs(user).redirects(0)
      assert.equal(r.status(), 302, `${role} ne doit pas ouvrir la grille`)
    }
  })

  test('appréciation : 250 caractères, sur un élève de ma classe seulement', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    const envoyer = (user: any, corps: object) =>
      client
        .post('/enseignant/appreciations')
        .json(corps)
        .header('accept', 'application/json')
        .withCsrfToken()
        .loginAs(user)
    const base = {
      affectationId: ctx.affectation.id,
      periodeId: ctx.periode.id,
      eleveId: ctx.eleves[0].id,
    }
    const acceptee = await envoyer(ctx.enseignant, { ...base, texte: 'Bon trimestre.' })
    acceptee.assertStatus(200)
    const tropLongue = await envoyer(ctx.enseignant, { ...base, texte: 'x'.repeat(251) })
    tropLongue.assertStatus(422)
    const intrus = await envoyer(ctx.collegue, { ...base, texte: 'Intrus' })
    intrus.assertStatus(403)
    const a = await db.from('appreciations').whereNull('deleted_at')
    assert.lengthOf(a, 1)
    assert.equal(a[0].texte, 'Bon trimestre.')
  })
})

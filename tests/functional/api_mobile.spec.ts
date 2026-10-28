import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import Eleve from '#models/eleve'
import Niveau from '#models/niveau'
import Classe from '#models/classe'
import Tuteur from '#models/tuteur'
import Matiere from '#models/matiere'
import Periode from '#models/periode'
import Evaluation from '#models/evaluation'
import Inscription from '#models/inscription'
import Affectation from '#models/affectation'
import EntreeJournal from '#models/entree_journal'
import NiveauMatiere from '#models/niveau_matiere'
import AnneeScolaire from '#models/annee_scolaire'
import PortailService from '#services/portail_service'
import { MAX_ECHECS } from '#services/authentification_service'
import { creerCompte, MOT_DE_PASSE } from '#tests/aides'
import type User from '#models/user'

const aujourdhui = DateTime.now().startOf('day')

let courriels: ReturnType<typeof mail.fake>

/** Code du dernier courriel de vérification intercepté (aucun code n'est rendu en test). */
const dernierCode = () => {
  const envoyes = courriels.messages.sent()
  return envoyes[envoyes.length - 1].toJSON().views.html!.data.code as string
}

/** Connexion mobile : renvoie le jeton en clair. */
async function jeton(client: any, user: User) {
  const r = await client
    .post('/api/v1/auth/connexion')
    .json({ email: user.email, password: MOT_DE_PASSE })
  r.assertStatus(200)
  return r.body().jeton.jeton as string
}

const appel = (client: any, methode: string, url: string, j: string, corps?: object) => {
  const r = client[methode](url).bearerToken(j)
  return corps ? r.json(corps) : r
}

/** Année active, fenêtre ouverte, une 3e A de 2 élèves, maths confiées à un enseignant. */
async function contexte() {
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
    finSaisie: aujourdhui.plus({ days: 30 }),
  })
  const niveau = await Niveau.create({ code: '3E', libelle: '3e', ordre: 4, cycle: 'college' })
  const maths = await Matiere.create({
    code: 'MA',
    libelle: 'Mathématiques',
    famille: 'scientifique',
    noteMaxDefaut: 20,
  })
  await NiveauMatiere.create({
    niveauId: niveau.id,
    matiereId: maths.id,
    coefficient: 4,
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
  const eleves: Eleve[] = []
  for (const [i, nom] of ['Bah', 'Camara'].entries()) {
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
  const evaluation = await Evaluation.create({
    affectationId: affectation.id,
    periodeId: periode.id,
    type: 'devoir',
    titre: 'Devoir n°1',
    date: aujourdhui.minus({ days: 2 }),
    noteMax: 20,
    poids: 1,
    etat: 'brouillon',
  })
  return {
    annee,
    periode,
    classe,
    enseignant,
    collegue,
    direction,
    affectation,
    eleves,
    evaluation,
  }
}

/** Compte tuteur rattaché à un élève (RG20). */
async function tuteurDe(eleve: Eleve) {
  const user = await creerCompte(['tuteur'])
  const tuteur = await Tuteur.create({
    nom: user.fullName!,
    lienParente: 'mere',
    telephone: '620000000',
    userId: user.id,
  })
  await eleve.related('tuteurs').attach({ [tuteur.id]: { principal: true } })
  return user
}

test.group('API mobile · santé', () => {
  test('sante et health : réponse sans jeton, base joignable', async ({ client, assert }) => {
    for (const chemin of ['/api/v1/sante', '/api/v1/health']) {
      const r = await client.get(chemin)
      r.assertStatus(200)
      assert.containsSubset(r.body(), { statut: 'ok', base: 'ok' })
    }
  })
})

test.group('API mobile · authentification', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    courriels = mail.fake()
    return () => mail.restore()
  })

  test('connexion : jeton émis, sans cookie ni jeton CSRF', async ({ client, assert }) => {
    const user = await creerCompte(['enseignant', 'professeur_principal'])
    const r = await client
      .post('/api/v1/auth/connexion')
      .json({ email: user.email, password: MOT_DE_PASSE, appareil: 'Test' })
    r.assertStatus(200)
    assert.equal(r.body().statut, 'connecte')
    assert.match(r.body().jeton.jeton, /^eel_/)
    assert.sameMembers(r.body().utilisateur.roles, ['enseignant', 'professeur_principal'])
    assert.deepEqual(r.body().utilisateur.espaces, ['enseignant'])

    const moi = await appel(client, 'get', '/api/v1/moi', r.body().jeton.jeton)
    moi.assertStatus(200)
    assert.equal(moi.body().utilisateur.email, user.email)
  })

  test('identifiants faux : 401 JSON et échec journalisé', async ({ client, assert }) => {
    const user = await creerCompte(['tuteur'])
    const r = await client
      .post('/api/v1/auth/connexion')
      .json({ email: user.email, password: 'mauvais-mot-de-passe' })
    r.assertStatus(401)
    assert.equal(r.body().code, 'E_IDENTIFIANTS')
    const trace = await EntreeJournal.query()
      .where('user_id', user.id)
      .where('action', 'Connexion échouée')
      .first()
    assert.exists(trace)
  })

  test('verrouillage après 5 échecs : 423', async ({ client, assert }) => {
    const user = await creerCompte(['tuteur'])
    for (let i = 0; i < MAX_ECHECS; i++) {
      await client.post('/api/v1/auth/connexion').json({ email: user.email, password: 'faux' })
    }
    const r = await client
      .post('/api/v1/auth/connexion')
      .json({ email: user.email, password: MOT_DE_PASSE })
    r.assertStatus(423)
    assert.equal(r.body().code, 'E_COMPTE_VERROUILLE')
  })

  test('saisie invalide : 422 avec les erreurs par champ', async ({ client, assert }) => {
    const r = await client.post('/api/v1/auth/connexion').json({ email: 'pas-une-adresse' })
    r.assertStatus(422)
    assert.isArray(r.body().errors)
  })

  test('second facteur : défi, code faux puis bon code', async ({ client, assert }) => {
    const user = await creerCompte(['direction'], { doubleFacteur: true })
    const r = await client
      .post('/api/v1/auth/connexion')
      .json({ email: user.email, password: MOT_DE_PASSE })
    r.assertStatus(200)
    assert.equal(r.body().statut, 'double_facteur')
    assert.notProperty(r.body(), 'jeton')
    const { defi } = r.body()
    assert.isNull(r.body().codeDeveloppement)
    const codeDeveloppement = dernierCode()
    assert.match(codeDeveloppement, /^\d{6}$/)

    const faux = codeDeveloppement === '000000' ? '111111' : '000000'
    const mauvais = await client.post('/api/v1/auth/verification').json({ defi, code: faux })
    mauvais.assertStatus(401)
    assert.equal(mauvais.body().code, 'E_CODE_INCORRECT')

    const bon = await client
      .post('/api/v1/auth/verification')
      .json({ defi, code: codeDeveloppement })
    bon.assertStatus(200)
    assert.equal(bon.body().statut, 'connecte')

    // Un défi ne sert qu'une fois.
    const rejoue = await client
      .post('/api/v1/auth/verification')
      .json({ defi, code: codeDeveloppement })
    rejoue.assertStatus(401)
    assert.equal(rejoue.body().code, 'E_DEFI_EXPIRE')
  })

  test('renvoyer un code invalide l’ancien', async ({ client }) => {
    const user = await creerCompte(['admin'], { doubleFacteur: true })
    const r = await client
      .post('/api/v1/auth/connexion')
      .json({ email: user.email, password: MOT_DE_PASSE })
    const { defi } = r.body()
    const ancien = dernierCode()
    const renvoi = await client.post('/api/v1/auth/verification/renvoyer').json({ defi })
    renvoi.assertStatus(200)
    const nouveau = dernierCode()
    if (ancien !== nouveau) {
      const essai = await client.post('/api/v1/auth/verification').json({ defi, code: ancien })
      essai.assertStatus(401)
    }
    const ok = await client.post('/api/v1/auth/verification').json({ defi, code: nouveau })
    ok.assertStatus(200)
  })

  test('sans jeton ou avec un faux jeton : 401 JSON', async ({ client }) => {
    const sans = await client.get('/api/v1/moi')
    sans.assertStatus(401)
    const faux = await client.get('/api/v1/moi').bearerToken('eel_faux.jeton')
    faux.assertStatus(401)
  })

  test('déconnexion : le jeton est révoqué sans suppression (RG21)', async ({ client, assert }) => {
    const user = await creerCompte(['tuteur'])
    const j = await jeton(client, user)
    const r = await appel(client, 'post', '/api/v1/auth/deconnexion', j)
    r.assertStatus(204)
    const apres = await appel(client, 'get', '/api/v1/moi', j)
    apres.assertStatus(401)
    const lignes = await db.from('auth_access_tokens').where('tokenable_id', user.id)
    assert.lengthOf(lignes, 1)
  })

  test('compte désactivé : 401 dès la requête suivante', async ({ client, assert }) => {
    const user = await creerCompte(['tuteur'])
    const j = await jeton(client, user)
    user.actif = false
    await user.save()
    const r = await appel(client, 'get', '/api/v1/moi', j)
    r.assertStatus(401)
    assert.equal(r.body().code, 'E_COMPTE_DESACTIVE')
  })

  test('mot de passe imposé : seuls le profil et son changement répondent', async ({
    client,
    assert,
  }) => {
    const user = await creerCompte(['enseignant'], { doitChangerMotDePasse: true })
    const j = await jeton(client, user)
    const bloque = await appel(client, 'get', '/api/v1/enseignant/affectations', j)
    bloque.assertStatus(403)
    assert.equal(bloque.body().code, 'E_MOT_DE_PASSE_A_CHANGER')

    const change = await appel(client, 'put', '/api/v1/moi/mot-de-passe', j, {
      actuel: MOT_DE_PASSE,
      nouveau: 'NouveauSecret2026',
      confirmation: 'NouveauSecret2026',
    })
    change.assertStatus(200)
    assert.isFalse(change.body().utilisateur.doitChangerMotDePasse)
    const ouvert = await appel(client, 'get', '/api/v1/enseignant/affectations', j)
    ouvert.assertStatus(200)
  })

  test('mot de passe oublié : même réponse que le compte existe ou non', async ({
    client,
    assert,
  }) => {
    const user = await creerCompte(['tuteur'])
    const connu = await client.post('/api/v1/auth/mot-de-passe-oublie').json({ email: user.email })
    const inconnu = await client
      .post('/api/v1/auth/mot-de-passe-oublie')
      .json({ email: 'personne@test.gn' })
    connu.assertStatus(202)
    inconnu.assertStatus(202)
    assert.equal(connu.body().message, inconnu.body().message)
  })

  test('adresse inconnue sous /api : 404 JSON', async ({ client, assert }) => {
    const r = await client.get('/api/v1/nexiste-pas')
    r.assertStatus(404)
    assert.equal(r.body().code, 'E_ROUTE_INTROUVABLE')
  })
})

test.group('API mobile · espaces et rôles', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('chaque espace est fermé aux autres rôles (403 E_ROLE)', async ({ client, assert }) => {
    const tuteur = await creerCompte(['tuteur'])
    const enseignant = await creerCompte(['enseignant'])
    const secretariat = await creerCompte(['secretariat'])
    const cas: Array<[User, string]> = [
      [tuteur, '/api/v1/enseignant/affectations'],
      [tuteur, '/api/v1/direction/evaluations'],
      [enseignant, '/api/v1/direction/evaluations'],
      [enseignant, '/api/v1/portail/enfants'],
      [secretariat, '/api/v1/direction/inscriptions'],
    ]
    for (const [user, url] of cas) {
      const r = await appel(client, 'get', url, await jeton(client, user))
      assert.equal(r.status(), 403, url)
      assert.equal(r.body().code, 'E_ROLE')
    }
  })
})

test.group('API mobile · enseignant', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('mes classes : affectations de l’année active', async ({ client, assert }) => {
    const ctx = await contexte()
    const r = await appel(
      client,
      'get',
      '/api/v1/enseignant/affectations',
      await jeton(client, ctx.enseignant)
    )
    r.assertStatus(200)
    assert.lengthOf(r.body().affectations, 1)
    assert.equal(r.body().affectations[0].effectif, 2)
    assert.isTrue(r.body().affectations[0].saisie.ouverte)
  })

  test('grille et saisie de notes, journalisée (RG22)', async ({ client, assert }) => {
    const ctx = await contexte()
    const j = await jeton(client, ctx.enseignant)
    const grille = await appel(
      client,
      'get',
      `/api/v1/enseignant/evaluations/${ctx.evaluation.id}`,
      j
    )
    grille.assertStatus(200)
    assert.lengthOf(grille.body().lignes, 2)
    assert.equal(grille.body().evaluation.date, aujourdhui.minus({ days: 2 }).toISODate())

    const r = await appel(
      client,
      'post',
      `/api/v1/enseignant/evaluations/${ctx.evaluation.id}/notes`,
      j,
      {
        saisies: [
          { eleveId: ctx.eleves[0].id, valeur: 15, absent: false },
          { eleveId: ctx.eleves[1].id, valeur: null, absent: true },
        ],
      }
    )
    r.assertStatus(200)
    assert.equal(r.body().modifiees, 2)
    const traces = await EntreeJournal.query().where('action', 'Saisie de note')
    assert.lengthOf(traces, 2)
  })

  test('RG10 : note hors bornes refusée en 422 avec la règle', async ({ client, assert }) => {
    const ctx = await contexte()
    const r = await appel(
      client,
      'post',
      `/api/v1/enseignant/evaluations/${ctx.evaluation.id}/notes`,
      await jeton(client, ctx.enseignant),
      { saisies: [{ eleveId: ctx.eleves[0].id, valeur: 21, absent: false }] }
    )
    r.assertStatus(422)
    assert.equal(r.body().regle, 'RG10')
  })

  test('RG9 : un collègue ne lit ni ne saisit l’évaluation (403)', async ({ client }) => {
    const ctx = await contexte()
    const j = await jeton(client, ctx.collegue)
    const lire = await appel(
      client,
      'get',
      `/api/v1/enseignant/evaluations/${ctx.evaluation.id}`,
      j
    )
    lire.assertStatus(403)
    const saisir = await appel(
      client,
      'post',
      `/api/v1/enseignant/evaluations/${ctx.evaluation.id}/notes`,
      j,
      {
        saisies: [{ eleveId: ctx.eleves[0].id, valeur: 10, absent: false }],
      }
    )
    saisir.assertStatus(403)
    const creer = await appel(client, 'post', '/api/v1/enseignant/evaluations', j, {
      affectationId: ctx.affectation.id,
      periodeId: ctx.periode.id,
      type: 'devoir',
      titre: 'Intrusion',
      date: aujourdhui.toISODate(),
      noteMax: 20,
      poids: 1,
    })
    creer.assertStatus(403)
    const periodes = await appel(
      client,
      'get',
      `/api/v1/enseignant/affectations/${ctx.affectation.id}/periodes`,
      j
    )
    periodes.assertStatus(403)
  })

  test('création, soumission puis RG12 : saisie fermée', async ({ client, assert }) => {
    const ctx = await contexte()
    const j = await jeton(client, ctx.enseignant)
    const creee = await appel(client, 'post', '/api/v1/enseignant/evaluations', j, {
      affectationId: ctx.affectation.id,
      periodeId: ctx.periode.id,
      type: 'interrogation',
      titre: 'Interrogation 1',
      date: aujourdhui.toISODate(),
      noteMax: 10,
      poids: 1,
    })
    creee.assertStatus(201)
    const id = creee.body().evaluation.id
    await appel(client, 'post', `/api/v1/enseignant/evaluations/${id}/notes`, j, {
      saisies: ctx.eleves.map((e) => ({ eleveId: e.id, valeur: 8, absent: false })),
    })
    const soumise = await appel(client, 'post', `/api/v1/enseignant/evaluations/${id}/soumettre`, j)
    soumise.assertStatus(200)
    assert.equal(soumise.body().evaluation.etat, 'soumise')
    const apres = await appel(client, 'post', `/api/v1/enseignant/evaluations/${id}/notes`, j, {
      saisies: [{ eleveId: ctx.eleves[0].id, valeur: 9, absent: false }],
    })
    apres.assertStatus(422)
    assert.equal(apres.body().regle, 'RG12')
  })
})

test.group('API mobile · direction', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('valide une évaluation soumise, puis la déverrouille avec motif', async ({
    client,
    assert,
  }) => {
    const ctx = await contexte()
    ctx.evaluation.etat = 'soumise'
    await ctx.evaluation.save()
    const j = await jeton(client, ctx.direction)

    const liste = await appel(client, 'get', '/api/v1/direction/evaluations', j)
    liste.assertStatus(200)
    assert.equal(liste.body().compteurs.aValider, 1)

    const v = await appel(
      client,
      'post',
      `/api/v1/direction/evaluations/${ctx.evaluation.id}/valider`,
      j
    )
    v.assertStatus(200)
    assert.equal(v.body().evaluation.etat, 'validee')

    const sansMotif = await appel(
      client,
      'post',
      `/api/v1/direction/evaluations/${ctx.evaluation.id}/deverrouiller`,
      j,
      {}
    )
    sansMotif.assertStatus(422)
    const d = await appel(
      client,
      'post',
      `/api/v1/direction/evaluations/${ctx.evaluation.id}/deverrouiller`,
      j,
      {
        motif: 'Erreur de saisie signalée',
      }
    )
    d.assertStatus(200)
    assert.equal(d.body().evaluation.etat, 'brouillon')
  })

  test('suivi des saisies de la période courante', async ({ client, assert }) => {
    const ctx = await contexte()
    const r = await appel(
      client,
      'get',
      '/api/v1/direction/suivi',
      await jeton(client, ctx.direction)
    )
    r.assertStatus(200)
    assert.equal(r.body().periode.id, ctx.periode.id)
    assert.lengthOf(r.body().lignes, 1)
    assert.equal(r.body().lignes[0].brouillons, 1)
  })
})

test.group('API mobile · portail famille', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('RG20 : le tuteur voit ses enfants, par identifiant opaque', async ({ client, assert }) => {
    const ctx = await contexte()
    const user = await tuteurDe(ctx.eleves[0])
    const j = await jeton(client, user)
    const r = await appel(client, 'get', '/api/v1/portail/enfants', j)
    r.assertStatus(200)
    assert.lengthOf(r.body().enfants, 1)
    const enfant = r.body().enfants[0]
    assert.equal(enfant.classe, '3e A')
    assert.notEqual(enfant.id, String(ctx.eleves[0].id))

    const dossier = await appel(
      client,
      'get',
      `/api/v1/portail/enfants/${encodeURIComponent(enfant.id)}`,
      j
    )
    dossier.assertStatus(200)
    assert.equal(dossier.body().enfant.matricule, ctx.eleves[0].matricule)
    assert.notProperty(dossier.body().enfant, 'notes')
  })

  test('RG20 : un élève non rattaché ou un identifiant forgé donnent 404', async ({ client }) => {
    const ctx = await contexte()
    const user = await tuteurDe(ctx.eleves[0])
    const j = await jeton(client, user)
    const autre = PortailService.masquer(ctx.eleves[1].id)
    const r1 = await appel(client, 'get', `/api/v1/portail/enfants/${encodeURIComponent(autre)}`, j)
    r1.assertStatus(404)
    const r2 = await appel(client, 'get', `/api/v1/portail/enfants/${ctx.eleves[0].id}`, j)
    r2.assertStatus(404)
  })
})

import Coque from '~/layouts/coque'
import Icone from '~/components/ui/icone'
import Champ from '~/components/ui/champ'
import { Form } from '@adonisjs/inertia/react'
import { sansVides } from '~/lib/formulaire'

type Parametres = {
  nom: string
  adresse: string
  ville: string
  pays: string
  telephone: string
  email: string
  chefEtablissement: string
  titreChef: string
}

export default function Etablissement({ parametres }: { parametres: Parametres }) {
  return (
    <Coque espace="admin" titre="Paramètres de l’établissement">
      <Form
        route="admin.etablissement.update"
        transform={sansVides}
        options={{ preserveScroll: true }}
        className="flex max-w-[720px] flex-col gap-4 rounded-carte border border-bordure bg-white p-5"
      >
        {({ errors, processing }) => (
          <>
            <div className="flex gap-2.5 rounded-bouton bg-info-fond px-3.5 py-3 text-meta leading-[1.45] text-info-fort">
              <Icone nom="circle-info" className="mt-0.5" />
              Ces informations figurent sur les documents officiels : certificats de scolarité,
              fiches d’inscription, bulletins.
            </div>
            <Champ
              libelle="Nom de l’établissement *"
              name="nom"
              defaultValue={parametres.nom}
              erreur={errors.nom && 'Le nom est obligatoire.'}
            />
            <Champ libelle="Adresse" name="adresse" defaultValue={parametres.adresse} />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
              <Champ libelle="Ville" name="ville" defaultValue={parametres.ville} />
              <Champ libelle="Pays" name="pays" defaultValue={parametres.pays} />
              <Champ
                libelle="Téléphone"
                name="telephone"
                type="tel"
                defaultValue={parametres.telephone}
              />
              <Champ
                libelle="Adresse e-mail"
                name="email"
                type="email"
                defaultValue={parametres.email}
                erreur={errors.email && 'Adresse e-mail invalide.'}
              />
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
              <Champ
                libelle="Signataire des documents"
                name="chefEtablissement"
                placeholder="Nom du chef d’établissement"
                defaultValue={parametres.chefEtablissement}
              />
              <Champ
                libelle="Titre du signataire *"
                name="titreChef"
                defaultValue={parametres.titreChef}
                erreur={errors.titreChef && 'Le titre est obligatoire.'}
              />
            </div>
            <button
              type="submit"
              disabled={processing}
              className="h-[46px] self-start rounded-bouton bg-accent px-5 text-corps font-bold text-white disabled:opacity-60"
            >
              Enregistrer
            </button>
          </>
        )}
      </Form>
    </Coque>
  )
}

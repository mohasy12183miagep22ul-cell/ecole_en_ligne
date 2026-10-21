import AuthLayout from '~/layouts/auth'
import Icone from '~/components/ui/icone'
import { Form, Link } from '@adonisjs/inertia/react'
import { useState } from 'react'

export default function DoubleFacteur({
  email,
  codeDeveloppement,
}: {
  email: string
  /** Hors production uniquement : aucun courriel n'est encore envoyé. */
  codeDeveloppement: string | null
}) {
  const [code, setCode] = useState('')
  return (
    <AuthLayout titre="Vérification en deux étapes">
      <div className="flex size-[52px] items-center justify-center rounded-carte bg-accent-doux text-[22px] text-accent">
        <Icone nom="envelope-open-text" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[24px] font-extrabold">Vérification en deux étapes</h1>
        <p className="text-corps leading-normal text-encre-3">
          Un code à 6 chiffres a été envoyé à <strong className="text-encre">{email}</strong>.
        </p>
      </div>
      {codeDeveloppement && (
        <div className="flex items-center gap-2.5 rounded-champ bg-info-fond px-3 py-2.5 text-meta text-info">
          <Icone nom="circle-info" />
          <span>
            Développement — aucun courriel envoyé. Code :{' '}
            <strong className="tracking-[0.2em]">{codeDeveloppement}</strong>
          </span>
        </div>
      )}
      <Form route="double_facteur.store" className="flex flex-col gap-[18px]">
        {({ errors, processing }) => (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-meta font-semibold text-encre-2">Code de vérification</span>
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                aria-invalid={errors.code ? true : undefined}
                className="h-14 rounded-bouton border border-bordure-champ bg-champ px-4 text-center text-[24px] font-bold tracking-[0.4em] text-encre outline-none focus:border-accent focus:bg-white"
              />
            </label>
            {errors.code && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-champ bg-erreur-fond px-3 py-2.5 text-meta text-erreur"
              >
                <Icone nom="circle-exclamation" />
                {errors.code === 'Code incorrect.'
                  ? 'Code incorrect. Vérifiez les 6 chiffres reçus par courriel.'
                  : 'Saisissez les 6 chiffres reçus par courriel.'}
              </div>
            )}
            <button
              type="submit"
              disabled={processing}
              className="h-[50px] rounded-bouton bg-accent text-moyen font-bold text-white hover:brightness-[.94]"
            >
              Valider le code
            </button>
          </>
        )}
      </Form>
      <Form route="double_facteur.renvoyer" className="-mt-2 flex justify-center">
        <button type="submit" className="py-1 text-meta font-semibold text-accent">
          Renvoyer un code
        </button>
      </Form>
      <Link
        route="session.create"
        className="flex h-11 items-center justify-center rounded-bouton border border-bordure-champ bg-white text-corps font-semibold text-encre-2 hover:no-underline"
      >
        Retour
      </Link>
    </AuthLayout>
  )
}

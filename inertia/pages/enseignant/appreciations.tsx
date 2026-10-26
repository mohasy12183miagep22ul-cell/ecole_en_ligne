import Coque from '~/layouts/coque'
import Avatar from '~/components/ui/avatar'
import EtatVide from '~/components/ui/etat_vide'
import { notifier } from '~/components/ui/toast'
import { cx, fmt } from '~/lib/format'
import { envoyerJson } from '~/lib/notes'
import { Selecteurs, type Choix } from '~/components/enseignant/selecteurs'
import { useRef, useState } from 'react'

type Eleve = { id: number; nom: string; prenoms: string; texte: string; moyenne: number | null }

function Carte({ e, choix }: { e: Eleve; choix: Choix }) {
  const [texte, setTexte] = useState(e.texte)
  const [etat, setEtat] = useState<'' | 'enregistrement' | 'enregistre'>('')
  const minuterie = useRef<ReturnType<typeof setTimeout>>(undefined)
  const nom = `${e.prenoms} ${e.nom.toUpperCase()}`

  const enregistrer = (v: string) => {
    clearTimeout(minuterie.current)
    minuterie.current = setTimeout(async () => {
      setEtat('enregistrement')
      try {
        await envoyerJson('/enseignant/appreciations', {
          affectationId: choix.affectation,
          periodeId: choix.periode,
          eleveId: e.id,
          texte: v,
        })
        setEtat('enregistre')
      } catch (err) {
        setEtat('')
        notifier((err as Error).message, true)
      }
    }, 800)
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-bordure bg-white p-3.5">
      <div className="flex items-center gap-2.5">
        <Avatar nom={`${e.prenoms} ${e.nom}`} taille={30} />
        <span className="flex-1 text-corps font-bold">
          {e.nom.toUpperCase()} {e.prenoms}
        </span>
        <span className="text-corps font-extrabold">{fmt(e.moyenne)}</span>
      </div>
      <textarea
        aria-label={`Appréciation de ${nom}`}
        value={texte}
        rows={2}
        maxLength={250}
        placeholder="Appréciation (250 caractères maximum)"
        onChange={(ev) => {
          const v = ev.target.value.slice(0, 250)
          setTexte(v)
          setEtat('')
          enregistrer(v)
        }}
        className="resize-y rounded-champ border border-bordure-champ bg-champ px-3 py-2.5 text-corps leading-[1.45] outline-none focus:border-accent focus:bg-white"
      />
      <div className="flex items-center justify-between text-micro font-semibold">
        <span className="text-succes" role="status">
          {etat === 'enregistrement'
            ? 'Enregistrement…'
            : etat === 'enregistre'
              ? 'Enregistré'
              : ''}
        </span>
        <span className={cx(texte.length >= 230 ? 'text-erreur' : 'text-encre-4')}>
          {texte.length} / 250
        </span>
      </div>
    </div>
  )
}

export default function Appreciations({ choix, eleves }: { choix: Choix | null; eleves: Eleve[] }) {
  return (
    <Coque espace="enseignant" titre="Appréciations">
      <div className="flex max-w-[820px] flex-col gap-3">
        {!choix ? (
          <EtatVide
            icone="comment-dots"
            titre="Aucune classe confiée"
            texte="Les appréciations portent sur vos affectations de l’année active."
          />
        ) : (
          <>
            <Selecteurs choix={choix} url="/enseignant/appreciations" />
            <span className="text-leg text-encre-3">
              Une appréciation par élève et par matière · 250 caractères maximum · enregistrement
              automatique. La moyenne affichée est provisoire tant que toutes les évaluations ne
              sont pas validées.
            </span>
            {eleves.map((e) => (
              <Carte key={`${choix.affectation}-${choix.periode}-${e.id}`} e={e} choix={choix} />
            ))}
            {eleves.length === 0 && (
              <EtatVide icone="users" titre="Aucun élève dans cette classe" />
            )}
          </>
        )}
      </div>
    </Coque>
  )
}

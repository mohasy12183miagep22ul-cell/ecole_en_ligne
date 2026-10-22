import Icone from './icone'

export type InfosPagination = { page: number; dernierePage: number; total: number }

/** Pagination serveur : précédente / suivante, page courante annoncée. */
export default function Pagination({
  pagination,
  aller,
}: {
  pagination: InfosPagination
  aller: (page: number) => void
}) {
  if (pagination.dernierePage <= 1) return null
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 text-meta">
      <button
        type="button"
        disabled={pagination.page <= 1}
        onClick={() => aller(pagination.page - 1)}
        className="h-9 rounded-champ border border-bordure-champ bg-white px-3 font-semibold disabled:opacity-40"
      >
        <Icone nom="arrow-left" className="mr-1.5" />
        Précédente
      </button>
      <span className="text-encre-3" aria-live="polite">
        Page {pagination.page} / {pagination.dernierePage}
      </span>
      <button
        type="button"
        disabled={pagination.page >= pagination.dernierePage}
        onClick={() => aller(pagination.page + 1)}
        className="h-9 rounded-champ border border-bordure-champ bg-white px-3 font-semibold disabled:opacity-40"
      >
        Suivante
        <Icone nom="arrow-right" className="ml-1.5" />
      </button>
    </nav>
  )
}

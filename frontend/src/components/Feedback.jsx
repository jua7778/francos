import Button from './Button'

export function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <span className="size-10 animate-spin rounded-full border-4 border-slate-300 border-t-brand-600" aria-hidden />
      <span className="text-lg font-semibold">{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-sm">
      <span className="text-5xl" aria-hidden>
        {error?.isNetwork ? '📡' : '⚠️'}
      </span>
      <p className="text-xl font-bold">{error?.message ?? 'No se pudo cargar la información.'}</p>
      {onRetry && (
        <Button icon="🔄" size="lg" onClick={onRetry}>
          Intentar de nuevo
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ icon = '📭', title, children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <span className="text-5xl" aria-hidden>
        {icon}
      </span>
      <p className="text-xl font-bold text-slate-700">{title}</p>
      {children && <div className="text-slate-500">{children}</div>}
    </div>
  )
}

/** Muestra carga, error o el contenido según el estado de useLiveData. */
export function DataState({ loading, error, data, onRetry, children }) {
  if (loading && !data) return <Spinner />
  if (error && !data) return <ErrorState error={error} onRetry={onRetry} />
  return children
}

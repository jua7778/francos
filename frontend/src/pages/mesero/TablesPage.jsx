import { Link, useOutletContext } from 'react-router'
import { DataState, EmptyState } from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import { useNow } from '../../hooks/useNow'
import { elapsedLabel, formatMoney } from '../../utils/format'
import { TABLE_STATES } from '../../utils/status'

export default function TablesPage() {
  const { tables } = useOutletContext()
  const now = useNow()
  const list = tables.data ?? []

  const counts = list.reduce((acc, t) => ({ ...acc, [t.state]: (acc[t.state] ?? 0) + 1 }), {})

  return (
    <>
      <PageHeader title="Seleccione la mesa" subtitle="Toque una mesa para tomar o ver su pedido." />

      {/* Leyenda: explica cada color con texto. */}
      <div className="mb-5 flex flex-wrap gap-2">
        {Object.entries(TABLE_STATES).map(([key, s]) => (
          <span key={key} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${s.badge}`}>
            <span aria-hidden>{s.icon}</span> {s.label}: {counts[key] ?? 0}
          </span>
        ))}
      </div>

      <DataState {...tables} onRetry={tables.reload}>
        {list.length === 0 ? (
          <EmptyState icon="🪑" title="No hay mesas creadas">
            El administrador debe crear las mesas.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {list.map((table) => (
              <TableCard key={table.id} table={table} now={now} />
            ))}
          </div>
        )}
      </DataState>
    </>
  )
}

function TableCard({ table, now }) {
  const state = TABLE_STATES[table.state] ?? TABLE_STATES.disponible

  return (
    <Link
      to={`/mesas/${table.id}`}
      className={`flex min-h-40 flex-col rounded-3xl border-4 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${state.card}`}
    >
      <div className="text-sm font-bold uppercase opacity-70">{table.seats} puestos</div>
      <div className="text-3xl font-black uppercase leading-tight sm:text-4xl">{table.label}</div>
      <div className="mt-auto pt-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold uppercase ${state.badge}`}>
          <span aria-hidden>{state.icon}</span>
          {state.label}
        </span>
        {table.order && (
          <div className="mt-2 flex items-baseline justify-between gap-2 text-sm font-semibold">
            <span>{elapsedLabel(table.order.created_at, now)}</span>
            <span className="text-lg font-black">{formatMoney(table.order.total)}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

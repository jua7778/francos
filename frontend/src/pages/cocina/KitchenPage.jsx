import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button'
import { DataState, EmptyState } from '../../components/Feedback'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../context/ToastContext'
import { useLiveData } from '../../hooks/useLiveData'
import { useNow } from '../../hooks/useNow'
import { ticketsApi } from '../../services/endpoints'
import { elapsedLabel, formatTime, minutesSince } from '../../utils/format'
import { playAlert } from '../../utils/sound'

const LATE_MINUTES = 20

export default function KitchenPage() {
  const tickets = useLiveData(() => ticketsApi.kitchen(), ['orders'])
  const toast = useToast()
  const now = useNow(20000)
  const [busy, setBusy] = useState(null)
  const known = useRef(null)

  // Aviso sonoro y visual cuando llega una comanda nueva.
  useEffect(() => {
    if (!tickets.data) return
    const ids = new Set(tickets.data.map((t) => t.id))
    if (known.current) {
      const fresh = tickets.data.filter((t) => !known.current.has(t.id) && t.status === 'pendiente')
      fresh.forEach((t) => toast.info(`Nuevo pedido: ${t.table?.label}${t.is_additional ? ' (adicional)' : ''}`, { duration: 8000 }))
      if (fresh.length) playAlert('new')
    }
    known.current = ids
  }, [tickets.data, toast])

  const change = async (ticket, status) => {
    setBusy(`${ticket.id}-${status}`)
    try {
      const result = await ticketsApi.setStatus(ticket.id, status)
      toast.success(result.message)
      await tickets.reload()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(null)
    }
  }

  const list = tickets.data ?? []
  const active = list.filter((t) => t.status !== 'listo')
  const ready = list.filter((t) => t.status === 'listo').reverse()

  return (
    <DataState {...tickets} onRetry={tickets.reload}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-3xl font-black uppercase sm:text-4xl">Pedidos de cocina</h1>
        <span className="rounded-full bg-amber-100 px-4 py-2 text-lg font-bold text-amber-900">
          ⏳ Nuevos: {active.filter((t) => t.status === 'pendiente').length}
        </span>
        <span className="rounded-full bg-orange-500 px-4 py-2 text-lg font-bold text-white">
          👨‍🍳 Preparando: {active.filter((t) => t.status === 'en_preparacion').length}
        </span>
      </div>

      {active.length === 0 ? (
        <EmptyState icon="😌" title="No hay pedidos pendientes">
          Los pedidos nuevos aparecen aquí solos, con un sonido de aviso.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {active.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} now={now} busy={busy} onChange={change} />
          ))}
        </div>
      )}

      {ready.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-black uppercase text-slate-600">✅ Listos hace poco (por si se equivocó)</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {ready.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-2 ring-emerald-200">
                <div>
                  <p className="text-xl font-black uppercase">{ticket.table?.label}</p>
                  <p className="text-slate-600">
                    {ticket.items.reduce((s, i) => s + i.quantity, 0)} und. · listo {formatTime(ticket.ready_at)}
                  </p>
                </div>
                <Button variant="secondary" size="sm" loading={busy === `${ticket.id}-en_preparacion`} onClick={() => change(ticket, 'en_preparacion')}>
                  ↩ Deshacer
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </DataState>
  )
}

function TicketCard({ ticket, now, busy, onChange }) {
  const late = minutesSince(ticket.created_at, now) >= LATE_MINUTES
  const preparing = ticket.status === 'en_preparacion'

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-3xl border-4 bg-white shadow-md ${
        preparing ? 'border-orange-500' : 'border-amber-400'
      }`}
    >
      <header className={`flex items-start justify-between gap-2 px-4 py-3 ${preparing ? 'bg-orange-500 text-white' : 'bg-amber-300 text-amber-950'}`}>
        <div>
          <h2 className="text-3xl font-black uppercase leading-none">{ticket.table?.label}</h2>
          {ticket.is_additional && (
            <span className="mt-1 inline-block rounded bg-slate-900 px-2 py-0.5 text-sm font-black uppercase text-white">
              ➕ Pedido adicional
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tabular-nums">{formatTime(ticket.created_at)}</div>
          <div className={`text-sm font-bold ${late ? 'rounded bg-red-600 px-2 text-white' : ''}`}>
            {late && '⏰ '}
            {elapsedLabel(ticket.created_at, now)}
          </div>
        </div>
      </header>

      <ul className="flex-1 space-y-3 px-4 py-4">
        {ticket.items.map((item) => (
          <li key={item.id}>
            <p className="text-2xl font-bold leading-tight">
              <span className="mr-2 inline-block min-w-10 rounded-lg bg-slate-900 px-2 text-center font-black text-white">{item.quantity}</span>
              {item.name}
            </p>
            {item.components && (
              <ul className="ml-14 mt-1 text-lg text-slate-700">
                {item.components
                  .filter((c) => c.slot !== 'principal')
                  .map((c) => (
                    <li key={c.slot}>
                      • {c.label}: <b>{c.name}</b>
                    </li>
                  ))}
              </ul>
            )}
            {item.notes && (
              <p className="ml-14 mt-1 rounded-lg bg-yellow-200 px-2 py-1 text-lg font-bold text-yellow-950">📝 {item.notes}</p>
            )}
          </li>
        ))}
      </ul>

      <footer className="space-y-2 border-t-2 border-slate-100 p-4">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <StatusBadge type="ticket" status={ticket.status} />
          {ticket.waiter && <span>Mesero: {ticket.waiter}</span>}
        </div>
        {!preparing && (
          <Button variant="info" size="lg" block icon="👨‍🍳" loading={busy === `${ticket.id}-en_preparacion`} onClick={() => onChange(ticket, 'en_preparacion')}>
            Empezar a preparar
          </Button>
        )}
        <Button variant="success" size={preparing ? 'xl' : 'lg'} block icon="✅" loading={busy === `${ticket.id}-listo`} onClick={() => onChange(ticket, 'listo')}>
          Marcar como listo
        </Button>
      </footer>
    </article>
  )
}

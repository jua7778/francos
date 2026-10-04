import { useState } from 'react'
import { formatMoney, formatTime } from '../../utils/format'
import Button from '../Button'
import QuantityStepper from '../QuantityStepper'
import StatusBadge from '../StatusBadge'
import NoteModal from './NoteModal'

/**
 * Resumen de la mesa:
 *  - POR ENVIAR: lo que el mesero está agregando ahora (todavía no llega a cocina).
 *  - YA PEDIDO: cada envío a cocina con su estado.
 */
export default function OrderPanel({
  table,
  order,
  cart,
  issues,
  sending,
  busyTicket,
  onSend,
  onDelivered,
  onCancelTicket,
  onSendToCashier,
  onCancelOrder,
}) {
  const [editingNote, setEditingNote] = useState(null)
  const hasIssues = cart.lines.some((l) => issues[l.key])
  const tickets = order?.tickets.filter((t) => t.status !== 'cancelado') ?? []
  const inKitchen = tickets.some((t) => t.status === 'pendiente' || t.status === 'en_preparacion')

  return (
    <div className="flex flex-col gap-4">
      {/* POR ENVIAR */}
      <section className="rounded-3xl border-2 border-brand-500 bg-white p-4 shadow-sm">
        <h2 className="flex items-center justify-between text-xl font-black uppercase">
          <span>🛒 Por enviar</span>
          {cart.count > 0 && <span className="rounded-full bg-brand-600 px-3 py-0.5 text-base text-white">{cart.count}</span>}
        </h2>

        {cart.lines.length === 0 ? (
          <p className="py-6 text-center text-lg text-slate-500">
            {order ? 'Si la mesa pide algo más, toque el producto para agregarlo.' : 'Toque un producto para agregarlo.'}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200">
            {cart.lines.map((line) => (
              <li key={line.key} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight">
                      {line.kind === 'menu' && '⭐ '}
                      {line.name}
                    </p>
                    {line.notes && <p className="mt-0.5 rounded bg-amber-100 px-2 text-sm font-semibold text-amber-900">📝 {line.notes}</p>}
                    {issues[line.key] && (
                      <p className="mt-1 rounded bg-red-600 px-2 py-0.5 text-sm font-black uppercase text-white">❌ {issues[line.key]}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-lg font-extrabold">{formatMoney(line.price * line.quantity)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <QuantityStepper value={line.quantity} min={0} onChange={(q) => cart.setQuantity(line.key, q)} />
                  <button
                    type="button"
                    onClick={() => setEditingNote(line)}
                    className="min-h-11 rounded-xl bg-amber-100 px-3 text-sm font-bold text-amber-900 hover:bg-amber-200"
                  >
                    📝 {line.notes ? 'Cambiar nota' : 'Nota'}
                  </button>
                  <button
                    type="button"
                    onClick={() => cart.remove(line.key)}
                    className="ml-auto min-h-11 rounded-xl px-3 text-sm font-bold text-red-700 hover:bg-red-50"
                  >
                    🗑️ Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {cart.lines.length > 0 && (
          <>
            <div className="mt-2 flex justify-between border-t-2 border-slate-200 pt-3 text-xl font-black">
              <span>Por enviar</span>
              <span>{formatMoney(cart.total)}</span>
            </div>
            {hasIssues && (
              <p className="mt-2 font-bold text-red-700">Quite los productos agotados para poder enviar.</p>
            )}
            <Button variant="success" size="xl" block className="mt-3" icon="📤" loading={sending} disabled={hasIssues} onClick={onSend}>
              {order ? 'Enviar adicional a cocina' : 'Enviar a cocina'}
            </Button>
          </>
        )}
      </section>

      {/* YA PEDIDO */}
      {order && (
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-2 ring-slate-200">
          <h2 className="flex flex-wrap items-center justify-between gap-2 text-xl font-black uppercase">
            <span>🧾 Ya pedido</span>
            <StatusBadge type="order" status={order.status} />
          </h2>

          <ol className="mt-3 space-y-3">
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                className={`rounded-2xl border-2 p-3 ${ticket.status === 'listo' ? 'animate-attention border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-600">
                    {ticket.is_additional ? `➕ Adicional ${ticket.sequence - 1}` : 'Pedido inicial'} · {formatTime(ticket.created_at)}
                  </span>
                  <StatusBadge type="ticket" status={ticket.status} />
                </div>
                <ul className="mt-2 space-y-1">
                  {ticket.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2 text-lg">
                      <span>
                        <b>{item.quantity} ×</b> {item.name}
                        {item.notes && <span className="block text-sm font-semibold text-amber-800">📝 {item.notes}</span>}
                      </span>
                      <span className="shrink-0 font-semibold">{formatMoney(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                {ticket.status === 'listo' && (
                  <Button variant="success" size="lg" block className="mt-3" icon="✅" loading={busyTicket === ticket.id} onClick={() => onDelivered(ticket)}>
                    Ya lo entregué
                  </Button>
                )}
                {ticket.status === 'pendiente' && (
                  <Button variant="danger-outline" size="sm" className="mt-3" loading={busyTicket === ticket.id} onClick={() => onCancelTicket(ticket)}>
                    ✕ Cancelar este envío
                  </Button>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-4 flex justify-between border-t-2 border-slate-900 pt-3 text-2xl font-black">
            <span>Total {table.label}</span>
            <span>{formatMoney(order.total)}</span>
          </div>

          <div className="mt-4 grid gap-2">
            {order.status === 'en_caja' ? (
              <p className="rounded-xl bg-violet-100 px-4 py-3 text-center text-lg font-bold text-violet-900">💵 Esperando pago en caja</p>
            ) : (
              order.can?.send_to_cashier && (
                <Button variant="violet" size="lg" icon="💵" disabled={inKitchen} onClick={onSendToCashier}>
                  {inKitchen ? 'Cuenta: espere a cocina' : 'Pedir la cuenta (enviar a caja)'}
                </Button>
              )
            )}
            {order.can?.cancel && (
              <Button variant="danger-outline" size="md" icon="✕" onClick={onCancelOrder}>
                Cancelar pedido
              </Button>
            )}
          </div>
        </section>
      )}

      {editingNote && (
        <NoteModal
          line={editingNote}
          onClose={() => setEditingNote(null)}
          onSave={(notes) => {
            cart.setNotes(editingNote.key, notes)
            setEditingNote(null)
          }}
        />
      )}
    </div>
  )
}

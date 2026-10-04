import { useMemo, useState } from 'react'
import { formatMoney } from '../utils/format'
import { summarizeItems } from '../utils/order'
import Button from './Button'
import { MoneyInput } from './Form'
import Modal from './Modal'

const METHODS = [
  { value: 'efectivo', icon: '💵', label: 'Efectivo' },
  { value: 'tarjeta', icon: '💳', label: 'Tarjeta' },
  { value: 'transferencia', icon: '📱', label: 'Transferencia' },
]

const BILLS = [10000, 20000, 50000, 100000, 200000]

export default function PaymentModal({ order, onPay, onCancelOrder, onClose }) {
  const [method, setMethod] = useState(null)
  const [received, setReceived] = useState(null)
  const [paying, setPaying] = useState(false)
  const items = useMemo(() => summarizeItems(order), [order])

  const cash = method === 'efectivo'
  const receivedAmount = received ?? order.total
  const change = receivedAmount - order.total
  const bills = BILLS.filter((b) => b > order.total).slice(0, 3)
  const canPay = method && (!cash || receivedAmount >= order.total)

  const pay = async () => {
    setPaying(true)
    const ok = await onPay(order, method, cash ? receivedAmount : null)
    if (!ok) setPaying(false)
  }

  return (
    <Modal title={`Cobrar ${order.table.label}`} onClose={onClose} size="lg">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-extrabold uppercase text-slate-500">Pedido</h3>
          <ul className="divide-y divide-slate-200 rounded-2xl bg-slate-50 px-4">
            {items.map((item) => (
              <li key={`${item.name}${item.unit_price}`} className="flex justify-between gap-2 py-2 text-lg">
                <span>
                  <b>{item.quantity} ×</b> {item.name}
                </span>
                <span className="shrink-0 font-semibold">{formatMoney(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <span className="text-xl font-bold uppercase">Total</span>
            <span className="text-4xl font-black">{formatMoney(order.total)}</span>
          </div>
          {onCancelOrder && (
            <Button variant="ghost" size="sm" className="mt-3 text-red-700" onClick={() => onCancelOrder(order)}>
              ✕ Cancelar este pedido
            </Button>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-extrabold uppercase text-slate-500">¿Cómo paga el cliente?</h3>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                aria-pressed={method === m.value}
                onClick={() => {
                  setMethod(m.value)
                  setReceived(null)
                }}
                className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-4 px-1 text-sm font-black uppercase sm:text-base ${
                  method === m.value ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-200 bg-white text-slate-800'
                }`}
              >
                <span className="text-3xl" aria-hidden>
                  {m.icon}
                </span>
                {m.label}
              </button>
            ))}
          </div>

          {cash && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-extrabold uppercase text-slate-500">¿Con cuánto paga?</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <QuickAmount active={received === null || received === order.total} onClick={() => setReceived(order.total)}>
                  Exacto
                </QuickAmount>
                {bills.map((b) => (
                  <QuickAmount key={b} active={received === b} onClick={() => setReceived(b)}>
                    {formatMoney(b)}
                  </QuickAmount>
                ))}
              </div>
              <div className="mt-2">
                <MoneyInput value={received} onChange={setReceived} placeholder="Otro valor" aria-label="Otro valor recibido" />
              </div>
              <div
                className={`mt-3 flex items-baseline justify-between rounded-2xl px-4 py-3 ${
                  change >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-800'
                }`}
              >
                <span className="text-lg font-bold uppercase">{change >= 0 ? 'Devolver' : 'Falta'}</span>
                <span className="text-3xl font-black">{formatMoney(Math.abs(change))}</span>
              </div>
            </div>
          )}

          <Button variant="success" size="xl" block className="mt-6" icon="✅" disabled={!canPay} loading={paying} onClick={pay}>
            Marcar como pagado
          </Button>
          {!method && <p className="mt-2 text-center text-slate-500">Primero elija cómo paga.</p>}
        </div>
      </div>
    </Modal>
  )
}

function QuickAmount({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-14 rounded-xl border-2 text-lg font-bold ${active ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'}`}
    >
      {children}
    </button>
  )
}

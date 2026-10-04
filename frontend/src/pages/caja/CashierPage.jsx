import { useEffect, useRef, useState } from 'react'
import { DataState, EmptyState } from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import PaymentModal from '../../components/PaymentModal'
import StatusBadge from '../../components/StatusBadge'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { useLiveData } from '../../hooks/useLiveData'
import { useNow } from '../../hooks/useNow'
import { ordersApi, paymentsApi } from '../../services/endpoints'
import { elapsedLabel, formatMoney } from '../../utils/format'
import { summarizeItems } from '../../utils/order'
import { playAlert } from '../../utils/sound'

export default function CashierPage() {
  const orders = useLiveData(() => ordersApi.list({ open: 1 }), ['orders'])
  const toast = useToast()
  const confirm = useConfirm()
  const now = useNow()
  const [selectedId, setSelectedId] = useState(null)
  const previous = useRef(null)

  const list = orders.data ?? []
  const askingBill = list.filter((o) => o.status === 'en_caja')
  const ready = list.filter((o) => o.status === 'listo')
  const inKitchen = list.filter((o) => o.status === 'pendiente' || o.status === 'en_preparacion')
  const selected = list.find((o) => o.id === selectedId)

  // Aviso cuando una mesa pide la cuenta.
  useEffect(() => {
    if (!orders.data) return
    const current = new Set(orders.data.filter((o) => o.status === 'en_caja').map((o) => o.id))
    if (previous.current) {
      const fresh = orders.data.filter((o) => current.has(o.id) && !previous.current.has(o.id))
      fresh.forEach((o) => toast.info(`${o.table.label} pide la cuenta.`))
      if (fresh.length) playAlert('new')
    }
    previous.current = current
  }, [orders.data, toast])

  const pay = async (order, method, received) => {
    try {
      const result = await paymentsApi.pay(order.id, method, received)
      toast.success(result.message)
      setSelectedId(null)
      orders.reload()
      return true
    } catch (error) {
      toast.error(error.message)
      return false
    }
  }

  const cancelOrder = async (order) => {
    const ok = await confirm({
      title: '¿Deseas cancelar este pedido?',
      message: `El pedido de ${order.table.label} por ${formatMoney(order.total)} quedará cancelado y la mesa disponible.`,
      cancelText: 'NO',
      confirmText: 'SÍ, CANCELAR',
      tone: 'danger',
    })
    if (!ok) return
    try {
      const result = await ordersApi.cancel(order.id, 'Cancelado en caja')
      toast.success(result.message)
      setSelectedId(null)
      orders.reload()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <PageHeader title="Caja" subtitle="Toque una mesa para cobrarla." />

      <DataState {...orders} onRetry={orders.reload}>
        {list.length === 0 ? (
          <EmptyState icon="🧾" title="No hay mesas por cobrar">
            Cuando cocina termine un pedido, aparecerá aquí.
          </EmptyState>
        ) : (
          <div className="space-y-8">
            <OrderGroup title="💵 Piden la cuenta" orders={askingBill} now={now} onSelect={setSelectedId} highlight />
            <OrderGroup title="✅ Listos (cliente comiendo)" orders={ready} now={now} onSelect={setSelectedId} />
            <OrderGroup title="👨‍🍳 Todavía en cocina (no se pueden cobrar aún)" orders={inKitchen} now={now} />
          </div>
        )}
      </DataState>

      {selected && (selected.status === 'listo' || selected.status === 'en_caja') && (
        <PaymentModal order={selected} onPay={pay} onCancelOrder={cancelOrder} onClose={() => setSelectedId(null)} />
      )}
    </>
  )
}

function OrderGroup({ title, orders, now, onSelect, highlight = false }) {
  if (!orders.length) return null
  return (
    <section>
      <h2 className="mb-3 text-xl font-black uppercase text-slate-700">
        {title} ({orders.length})
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {orders.map((order) => {
          const items = summarizeItems(order)
          const content = (
            <>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-3xl font-black uppercase">{order.table.label}</h3>
                <StatusBadge type="order" status={order.status} />
              </div>
              <ul className="mt-2 flex-1 text-lg text-slate-700">
                {items.slice(0, 5).map((i) => (
                  <li key={`${i.name}${i.unit_price}`}>
                    {i.quantity} × {i.name}
                  </li>
                ))}
                {items.length > 5 && <li className="font-semibold text-slate-500">y {items.length - 5} más…</li>}
              </ul>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-sm text-slate-500">
                  {order.waiter} · {elapsedLabel(order.created_at, now)}
                </span>
                <span className="text-3xl font-black">{formatMoney(order.total)}</span>
              </div>
              {onSelect && <span className="mt-3 block rounded-xl bg-emerald-600 py-3 text-center text-lg font-black uppercase text-white">💵 Cobrar</span>}
            </>
          )
          const className = `flex flex-col rounded-3xl border-4 bg-white p-4 text-left shadow-sm ${
            highlight ? 'animate-attention border-violet-500' : onSelect ? 'border-emerald-400' : 'border-slate-200 opacity-75'
          }`
          return onSelect ? (
            <button key={order.id} type="button" onClick={() => onSelect(order.id)} className={`${className} transition hover:shadow-md active:scale-[0.99]`}>
              {content}
            </button>
          ) : (
            <div key={order.id} className={className}>
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router'
import Button from '../../components/Button'
import { DataState } from '../../components/Feedback'
import Modal from '../../components/Modal'
import CatalogBrowser from '../../components/order/CatalogBrowser'
import OrderPanel from '../../components/order/OrderPanel'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { useCart } from '../../hooks/useCart'
import { useLiveData } from '../../hooks/useLiveData'
import { ordersApi, tablesApi, ticketsApi } from '../../services/endpoints'
import { formatMoney } from '../../utils/format'

export default function OrderPage() {
  const { tableId } = useParams()
  // key: cada mesa tiene su propio carrito y estado.
  return <OrderScreen key={tableId} tableId={Number(tableId)} />
}

function OrderScreen({ tableId }) {
  const { catalog } = useOutletContext()
  const detail = useLiveData(() => tablesApi.show(tableId), ['orders', 'tables'])
  const cart = useCart(tableId)
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [busyTicket, setBusyTicket] = useState(null)
  const [showPanel, setShowPanel] = useState(false)

  const table = detail.data?.table
  const order = detail.data?.order

  // Revisa cada línea del carrito contra la carta actual (por si cocina agotó algo).
  const { issues, prices } = useMemo(() => {
    const result = { issues: {}, prices: {} }
    if (!catalog.data) return result
    const products = new Map(catalog.data.categories.flatMap((c) => c.products.map((p) => [p.id, p])))
    const menus = new Map(catalog.data.daily_menus.map((m) => [m.id, m]))
    cart.lines.forEach((line) => {
      const item = line.kind === 'menu' ? menus.get(line.id) : products.get(line.id)
      if (!item) result.issues[line.key] = 'Ya no está en la carta'
      else if (line.kind === 'menu' ? !item.is_sellable : !item.is_available) result.issues[line.key] = 'Agotado'
      if (item) result.prices[line.key] = item.price
    })
    return result
  }, [catalog.data, cart.lines])

  // El precio mostrado siempre es el vigente (el servidor cobra ese mismo).
  const cartView = {
    ...cart,
    lines: cart.lines.map((l) => ({ ...l, price: prices[l.key] ?? l.price })),
    total: cart.lines.reduce((sum, l) => sum + (prices[l.key] ?? l.price) * l.quantity, 0),
  }

  const addProduct = (product, quantity) => cart.add('product', product, quantity)
  const addMenu = (menu, quantity) => {
    const principal = menu.components.find((c) => c.slot === 'principal')
    cart.add('menu', { id: menu.id, name: `${menu.name}: ${principal?.name ?? ''}`, price: menu.price }, quantity)
  }

  const send = async () => {
    const ok = await confirm({
      title: order ? '¿Enviar adicional a cocina?' : '¿Enviar pedido a cocina?',
      message: (
        <div>
          <p className="mb-2 font-bold">{table.label}</p>
          <ul className="space-y-1">
            {cartView.lines.map((l) => (
              <li key={l.key}>
                <b>{l.quantity} ×</b> {l.name}
                {l.notes && <span className="text-amber-800"> — {l.notes}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xl font-black">Total: {formatMoney(cartView.total)}</p>
        </div>
      ),
      confirmText: 'ENVIAR PEDIDO',
      tone: 'success',
    })
    if (!ok) return

    setSending(true)
    try {
      const result = await ordersApi.send(tableId, cart.toPayload())
      cart.clear()
      toast.success(result.message)
      navigate('/mesas')
    } catch (error) {
      toast.error(`No se pudo enviar el pedido. ${error.message}`)
      catalog.reload()
      setSending(false)
    }
  }

  const changeTicket = async (ticket, status, message) => {
    setBusyTicket(ticket.id)
    try {
      const result = await ticketsApi.setStatus(ticket.id, status)
      toast.success(message ?? result.message)
      await detail.reload()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyTicket(null)
    }
  }

  const cancelTicket = async (ticket) => {
    const ok = await confirm({
      title: '¿Cancelar este envío?',
      message: 'Cocina todavía no lo empezó. Se quitará del pedido.',
      cancelText: 'NO',
      confirmText: 'SÍ, CANCELAR',
      tone: 'danger',
    })
    if (ok) changeTicket(ticket, 'cancelado')
  }

  const sendToCashier = async () => {
    const ok = await confirm({
      title: `¿${table.label} pide la cuenta?`,
      message: `Se enviará a caja por ${formatMoney(order.total)}.`,
      confirmText: 'SÍ, ENVIAR A CAJA',
      tone: 'violet',
    })
    if (!ok) return
    try {
      const result = await ordersApi.sendToCashier(order.id)
      toast.success(result.message)
      navigate('/mesas')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const cancelOrder = async () => {
    const ok = await confirm({
      title: '¿Deseas cancelar este pedido?',
      message: `Se cancelará todo el pedido de ${table.label} y la mesa quedará disponible.`,
      cancelText: 'NO',
      confirmText: 'SÍ, CANCELAR',
      tone: 'danger',
    })
    if (!ok) return
    try {
      const result = await ordersApi.cancel(order.id)
      toast.success(result.message)
      navigate('/mesas')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const panel = table && (
    <OrderPanel
      table={table}
      order={order}
      cart={cartView}
      issues={issues}
      sending={sending}
      busyTicket={busyTicket}
      onSend={send}
      onDelivered={(t) => changeTicket(t, 'entregado')}
      onCancelTicket={cancelTicket}
      onSendToCashier={sendToCashier}
      onCancelOrder={cancelOrder}
    />
  )

  return (
    <DataState {...detail} onRetry={detail.reload}>
      {table && (
        <div className="pb-24 lg:pb-0">
          <PageHeader
            back="/mesas"
            backLabel="Mesas"
            title={table.label}
            actions={table.state && <StatusBadge type="table" status={table.state} className="text-base" />}
          />

          <div className="grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
            {/* min-w-0: evita que la barra de categorías (con scroll) ensanche la columna. */}
            <div className="min-w-0">
              <DataState {...catalog} onRetry={catalog.reload}>
                {catalog.data && <CatalogBrowser catalog={catalog.data} onAddProduct={addProduct} onAddMenu={addMenu} />}
              </DataState>
            </div>

            {/* En pantallas grandes el resumen está siempre visible a la derecha. */}
            <aside className="hidden lg:block">
              <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pb-4">{panel}</div>
            </aside>
          </div>

          {/* En tablet vertical y celular: barra inferior para abrir el resumen. */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-300 bg-white p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] lg:hidden">
            <Button variant={cart.count ? 'success' : 'dark'} size="xl" block icon="🧾" onClick={() => setShowPanel(true)}>
              {cart.count
                ? `Ver pedido · ${cart.count} por enviar · ${formatMoney(cartView.total)}`
                : order
                  ? `Ver pedido · Total ${formatMoney(order.total)}`
                  : 'Ver pedido'}
            </Button>
          </div>

          {showPanel && (
            <Modal title={`Pedido ${table.label}`} onClose={() => setShowPanel(false)}>
              {panel}
            </Modal>
          )}
        </div>
      )}
    </DataState>
  )
}

import { useState } from 'react'
import Button from '../../components/Button'
import { DataState } from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { useLiveData } from '../../hooks/useLiveData'
import { catalogApi } from '../../services/endpoints'
import { formatMoney } from '../../utils/format'

const TABS = [
  { key: 'comida', label: '🍽️ Comida' },
  { key: 'bebida', label: '🥤 Bebidas' },
  { key: 'menu', label: '⭐ Menú del día' },
]

/**
 * Cocina marca productos como AGOTADO / DISPONIBLE con uno o dos toques.
 * El mesero lo ve de inmediato en su pantalla.
 */
export default function AvailabilityPage() {
  const catalog = useLiveData(() => catalogApi.catalog(), ['catalog'])
  const toast = useToast()
  const confirm = useConfirm()
  const [tab, setTab] = useState('comida')
  const [busy, setBusy] = useState(null)

  const categories = catalog.data?.categories ?? []
  const menus = catalog.data?.daily_menus ?? []
  const soldOut = categories.flatMap((c) => c.products.filter((p) => !p.is_available))

  const toggle = async (kind, item, available) => {
    if (!available) {
      const ok = await confirm({
        title: `¿Marcar "${item.name}" como agotado?`,
        message: 'Los meseros ya no podrán pedirlo.',
        cancelText: 'NO',
        confirmText: 'SÍ, AGOTAR',
        tone: 'danger',
      })
      if (!ok) return
    }
    setBusy(`${kind}${item.id}`)
    try {
      if (kind === 'menu') await catalogApi.setMenuAvailability(item.id, available)
      else await catalogApi.setProductAvailability(item.id, available)
      if (available) toast.success(`"${item.name}" está disponible otra vez.`)
      else toast.warning(`"${item.name}" marcado como AGOTADO.`)
      await catalog.reload()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader title="Productos agotados" subtitle="Toque AGOTAR cuando algo se acabe. Toque YA HAY cuando vuelva." />

      <DataState {...catalog} onRetry={catalog.reload}>
        {soldOut.length > 0 && (
          <section className="mb-6 rounded-3xl bg-red-50 p-4 ring-2 ring-red-200">
            <h2 className="mb-3 text-xl font-black uppercase text-red-800">❌ Agotados ahora ({soldOut.length})</h2>
            <div className="flex flex-wrap gap-2">
              {soldOut.map((p) => (
                <Button key={p.id} variant="success" size="md" icon="✅" loading={busy === `product${p.id}`} onClick={() => toggle('product', p, true)}>
                  Ya hay {p.name}
                </Button>
              ))}
            </div>
          </section>
        )}

        <div className="mb-4 grid grid-cols-3 gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`min-h-14 rounded-2xl text-lg font-black uppercase ${tab === t.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 ring-2 ring-slate-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'menu' ? (
          <div className="grid gap-3 md:grid-cols-2">
            {menus.length === 0 && <p className="text-lg text-slate-500">No hay menú del día creado para hoy.</p>}
            {menus.map((menu) => (
              <AvailabilityRow
                key={menu.id}
                name={`${menu.name}: ${menu.components.find((c) => c.slot === 'principal')?.name ?? ''}`}
                detail={formatMoney(menu.price)}
                available={menu.is_available}
                busy={busy === `menu${menu.id}`}
                onToggle={(available) => toggle('menu', menu, available)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {categories
              .filter((c) => c.section === tab && c.products.length)
              .map((category) => (
                <section key={category.id}>
                  <h2 className="mb-2 text-xl font-black uppercase text-slate-600">
                    {category.icon} {category.name}
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {category.products.map((product) => (
                      <AvailabilityRow
                        key={product.id}
                        name={product.name}
                        available={product.is_available}
                        busy={busy === `product${product.id}`}
                        onToggle={(available) => toggle('product', product, available)}
                      />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </DataState>
    </>
  )
}

function AvailabilityRow({ name, detail, available, busy, onToggle }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border-2 p-3 pl-4 ${
        available ? 'border-slate-200 bg-white' : 'border-red-300 bg-red-50'
      }`}
    >
      <div className="min-w-0">
        <p className={`text-lg font-black uppercase leading-tight ${available ? '' : 'text-red-800'}`}>
          {available ? '🟢' : '❌'} {name}
        </p>
        <p className={`text-sm font-bold ${available ? 'text-emerald-700' : 'text-red-700'}`}>
          {available ? 'Disponible' : 'AGOTADO'}
          {detail && ` · ${detail}`}
        </p>
      </div>
      {available ? (
        <Button variant="danger" size="md" loading={busy} onClick={() => onToggle(false)}>
          Agotar
        </Button>
      ) : (
        <Button variant="success" size="md" loading={busy} onClick={() => onToggle(true)}>
          Ya hay
        </Button>
      )}
    </div>
  )
}

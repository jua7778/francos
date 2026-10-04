import { useState } from 'react'
import { useSearchParams } from 'react-router'
import Button from '../../components/Button'
import { DataState, EmptyState } from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { useLiveData } from '../../hooks/useLiveData'
import { adminApi, catalogApi } from '../../services/endpoints'
import { formatMoney } from '../../utils/format'
import ProductFormModal from './ProductFormModal'

const SECTIONS = [
  { key: 'todo', label: 'Todo' },
  { key: 'comida', label: '🍽️ Comida' },
  { key: 'bebida', label: '🥤 Bebidas' },
]

/** CARTA: productos agrupados por categoría, con EDITAR y DESACTIVAR. */
export default function MenuPage() {
  const [params, setParams] = useSearchParams()
  const section = params.get('seccion') ?? 'todo'
  const data = useLiveData(async () => {
    const [categories, products] = await Promise.all([adminApi.categories(), adminApi.products()])
    return { categories, products }
  }, ['catalog'])
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(null) // null | 'new' | { product } | { categoryId }
  const [showInactive, setShowInactive] = useState(false)
  const [busy, setBusy] = useState(null)

  const categories = (data.data?.categories ?? []).filter((c) => section === 'todo' || c.section === section)
  const products = data.data?.products ?? []

  const run = async (key, action) => {
    setBusy(key)
    try {
      const result = await action()
      if (result?.message) toast.success(result.message)
      await data.reload()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(null)
    }
  }

  const deactivate = async (product) => {
    const ok = await confirm({
      title: `¿Desactivar "${product.name}"?`,
      message: 'Dejará de aparecer para los meseros. Los pedidos anteriores se conservan. Puede activarlo de nuevo cuando quiera.',
      cancelText: 'NO',
      confirmText: 'SÍ, DESACTIVAR',
      tone: 'danger',
    })
    if (ok) run(`a${product.id}`, () => adminApi.setProductActive(product, false))
  }

  return (
    <>
      <PageHeader
        title="Carta"
        subtitle="Productos agrupados por categoría."
        actions={
          <Button size="lg" variant="success" icon="➕" onClick={() => setEditing('new')}>
            Nuevo producto
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setParams(s.key === 'todo' ? {} : { seccion: s.key })}
            aria-pressed={section === s.key}
            className={`min-h-12 rounded-xl px-5 font-black uppercase ${section === s.key ? 'bg-slate-900 text-white' : 'bg-white ring-2 ring-slate-300'}`}
          >
            {s.label}
          </button>
        ))}
        <label className="ml-auto flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 font-bold ring-2 ring-slate-200">
          <input type="checkbox" className="size-5" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Mostrar desactivados
        </label>
      </div>

      <DataState {...data} onRetry={data.reload}>
        <div className="space-y-6">
          {categories.map((category) => {
            const items = products.filter((p) => p.category_id === category.id && (showInactive || p.is_active))
            return (
              <section key={category.id} className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="flex-1 text-2xl font-black uppercase">
                    {category.icon} {category.name}
                    {!category.is_active && <span className="ml-2 rounded bg-slate-200 px-2 text-sm text-slate-600">Categoría oculta</span>}
                  </h2>
                  <Button variant="secondary" size="sm" icon="➕" onClick={() => setEditing({ categoryId: category.id })}>
                    Agregar aquí
                  </Button>
                </div>

                {items.length === 0 ? (
                  <p className="py-3 text-slate-500">Sin productos.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {items.map((product) => (
                      <li key={product.id} className={`flex flex-wrap items-center gap-3 py-3 ${product.is_active ? '' : 'opacity-60'}`}>
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="size-14 rounded-xl object-cover" />
                        ) : (
                          <span className="flex size-14 items-center justify-center rounded-xl bg-slate-100 text-2xl" aria-hidden>
                            {category.icon}
                          </span>
                        )}
                        <div className="min-w-40 flex-1">
                          <p className="text-lg font-bold">{product.name}</p>
                          <p className="font-extrabold text-brand-700">{formatMoney(product.price)}</p>
                        </div>
                        {product.is_active ? (
                          <button
                            type="button"
                            disabled={busy === `v${product.id}`}
                            onClick={() => run(`v${product.id}`, () => catalogApi.setProductAvailability(product.id, !product.is_available))}
                            className={`min-h-10 rounded-full px-3 text-sm font-bold ${
                              product.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                            title="Tocar para cambiar"
                          >
                            {product.is_available ? '🟢 Disponible' : '🔴 Agotado'}
                          </button>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-700">⏸️ Desactivado</span>
                        )}
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" icon="✏️" onClick={() => setEditing({ product })}>
                            Editar
                          </Button>
                          {product.is_active ? (
                            <Button variant="danger-outline" size="sm" loading={busy === `a${product.id}`} onClick={() => deactivate(product)}>
                              Desactivar
                            </Button>
                          ) : (
                            <Button
                              variant="success"
                              size="sm"
                              loading={busy === `a${product.id}`}
                              onClick={() => run(`a${product.id}`, () => adminApi.setProductActive(product, true))}
                            >
                              Activar
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
          {categories.length === 0 && <EmptyState icon="🗂️" title="No hay categorías. Cree una en Categorías." />}
        </div>
      </DataState>

      {editing && (
        <ProductFormModal
          product={editing.product}
          categories={data.data?.categories ?? []}
          defaultCategoryId={editing.categoryId}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            toast.success(message)
            setEditing(null)
            data.reload()
          }}
        />
      )}
    </>
  )
}

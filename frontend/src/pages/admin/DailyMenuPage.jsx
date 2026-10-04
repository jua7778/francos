import { useState } from 'react'
import Button from '../../components/Button'
import { DataState, EmptyState } from '../../components/Feedback'
import { Field, MoneyInput, Select, TextInput, Toggle } from '../../components/Form'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { useLiveData } from '../../hooks/useLiveData'
import { adminApi } from '../../services/endpoints'
import { formatDate, formatMoney } from '../../utils/format'

export default function DailyMenuPage() {
  const data = useLiveData(() => adminApi.dailyMenus(), ['catalog'])
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(null)
  const [copying, setCopying] = useState(false)

  const menus = data.data?.menus ?? []

  const copy = async () => {
    setCopying(true)
    try {
      const result = await adminApi.copyLatestMenus()
      toast.success(result.message)
      data.reload()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setCopying(false)
    }
  }

  const remove = async (menu) => {
    const ok = await confirm({
      title: `¿Quitar "${menu.name}" de hoy?`,
      cancelText: 'NO',
      confirmText: 'SÍ, QUITAR',
      tone: 'danger',
    })
    if (!ok) return
    try {
      const result = await adminApi.deleteDailyMenu(menu.id)
      toast.success(result.message)
      data.reload()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Menú del día"
        subtitle={data.data ? `Menús para hoy, ${formatDate(data.data.date)}.` : null}
        actions={
          <>
            {data.data?.can_copy && (
              <Button variant="secondary" size="lg" icon="📋" loading={copying} onClick={copy}>
                Copiar menús del último día
              </Button>
            )}
            <Button variant="success" size="lg" icon="➕" onClick={() => setEditing({})}>
              Nuevo menú
            </Button>
          </>
        }
      />

      <DataState {...data} onRetry={data.reload}>
        {menus.length === 0 ? (
          <EmptyState icon="⭐" title="Todavía no hay menú del día para hoy">
            Toque «Nuevo menú» o copie los del último día y solo cambie lo necesario.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {menus.map((menu) => (
              <article key={menu.id} className={`flex flex-col rounded-3xl border-4 bg-white p-5 shadow-sm ${menu.is_available ? 'border-amber-400' : 'border-slate-200 opacity-70'}`}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-2xl font-black uppercase">⭐ {menu.name}</h2>
                  <span className="text-2xl font-black text-brand-700">{formatMoney(menu.price)}</span>
                </div>
                <ul className="mt-3 flex-1 space-y-1 text-lg">
                  {menu.components.map((c) => (
                    <li key={c.slot} className={c.is_available ? '' : 'text-red-700'}>
                      <span aria-hidden>{c.icon}</span> <span className="text-slate-500">{c.label}:</span> <b>{c.name}</b>
                      {!c.is_available && ' (agotado)'}
                    </li>
                  ))}
                </ul>
                <p className={`mt-3 font-bold ${menu.is_sellable ? 'text-emerald-700' : 'text-red-700'}`}>
                  {menu.is_sellable ? '🟢 Disponible para los meseros' : '🔴 No disponible'}
                  {menu.orders_count > 0 && <span className="text-slate-500"> · Vendido hoy: {menu.orders_count}</span>}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" icon="✏️" onClick={() => setEditing(menu)}>
                    Editar
                  </Button>
                  <Button variant="danger-outline" onClick={() => remove(menu)}>
                    Quitar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </DataState>

      {editing && data.data && (
        <DailyMenuForm
          menu={editing.id ? editing : null}
          slots={data.data.slots}
          suggestedName={`Menú ${menus.length + 1}`}
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

function DailyMenuForm({ menu, slots, suggestedName, onSaved, onClose }) {
  const initialComponents = Object.fromEntries(
    slots.map((s) => [s.slot, menu?.components.find((c) => c.slot === s.slot)?.product_id ?? '']),
  )
  const [form, setForm] = useState({
    name: menu?.name ?? suggestedName,
    price: menu?.price ?? null,
    is_available: menu?.is_available ?? true,
    components: initialComponents,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const components = Object.fromEntries(Object.entries(form.components).map(([k, v]) => [k, v ? Number(v) : null]))
    try {
      const result = await adminApi.saveDailyMenu({ ...form, components }, menu?.id)
      onSaved(result.message)
    } catch (error) {
      setErrors({ ...error.errors, general: error.message })
      setSaving(false)
    }
  }

  return (
    <Modal title={menu ? `Editar ${menu.name}` : 'Nuevo menú del día'} onClose={onClose}>
      <form onSubmit={save} className="space-y-5">
        <Field label="Nombre" error={errors.name?.[0]}>
          <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={40} />
        </Field>

        {slots.map((slot) => (
          <Field key={slot.slot} label={`${slot.icon} ${slot.label}${slot.required ? '' : ' (opcional)'}`} error={errors[`components.${slot.slot}`]?.[0]}>
            <Select
              value={form.components[slot.slot]}
              onChange={(e) => setForm((f) => ({ ...f, components: { ...f.components, [slot.slot]: e.target.value } }))}
            >
              <option value="">{slot.required ? 'Seleccionar plato…' : `Sin ${slot.label.toLowerCase()}`}</option>
              {slot.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.is_available ? '' : ' (AGOTADO)'}
                </option>
              ))}
            </Select>
            {slot.products.length === 0 && (
              <span className="mt-1 block text-sm text-amber-700">No hay productos para esto. Asigne una categoría a «{slot.label}» en Categorías.</span>
            )}
          </Field>
        ))}

        <Field label="Precio" error={errors.price?.[0]}>
          <MoneyInput value={form.price} onChange={(price) => setForm((f) => ({ ...f, price }))} placeholder="18.000" />
        </Field>

        <Field label="Disponible">
          <Toggle
            value={form.is_available}
            onChange={(v) => setForm((f) => ({ ...f, is_available: v }))}
            options={[
              { value: true, label: '🟢 Sí', activeClass: 'border-emerald-600 bg-emerald-600 text-white' },
              { value: false, label: '🔴 No', activeClass: 'border-red-600 bg-red-600 text-white' },
            ]}
          />
        </Field>

        {errors.general && <p className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">❌ {errors.general}</p>}

        <Button type="submit" variant="success" size="xl" block icon="💾" loading={saving}>
          Guardar menú del día
        </Button>
      </form>
    </Modal>
  )
}

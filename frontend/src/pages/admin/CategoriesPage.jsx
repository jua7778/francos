import { useState } from 'react'
import Button from '../../components/Button'
import { DataState } from '../../components/Feedback'
import { Field, Select, TextInput, Toggle } from '../../components/Form'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { useLiveData } from '../../hooks/useLiveData'
import { adminApi } from '../../services/endpoints'

// Íconos para elegir con un toque (sin escribir).
const ICONS = ['🍽️', '🍗', '🥩', '🐟', '🍲', '🥗', '🍚', '🍟', '🥑', '🍳', '🌮', '🍝', '🍕', '🍔', '🍰', '🍨', '🥤', '🧃', '💧', '☕', '🍺', '🍷', '🍹', '🥛']

const MENU_SLOTS = [
  { value: '', label: 'No se usa en el Menú del Día' },
  { value: 'principal', label: '🍗 Plato principal' },
  { value: 'sopa', label: '🍲 Sopa' },
  { value: 'ensalada', label: '🥗 Ensalada' },
  { value: 'acompanamiento', label: '🍚 Seco / acompañamiento' },
  { value: 'bebida', label: '🥤 Bebida' },
]

export default function CategoriesPage() {
  const categories = useLiveData(() => adminApi.categories(), ['catalog'])
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(null)

  const run = async (action) => {
    try {
      const result = await action()
      toast.success(result.message)
      categories.reload()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const remove = async (category) => {
    const ok = await confirm({
      title: `¿Eliminar la categoría "${category.name}"?`,
      cancelText: 'NO',
      confirmText: 'SÍ, ELIMINAR',
      tone: 'danger',
    })
    if (ok) run(() => adminApi.deleteCategory(category.id))
  }

  const setActive = (category, isActive) =>
    run(() => adminApi.saveCategory({ ...category, menu_slot: category.menu_slot || null, is_active: isActive }, category.id))

  return (
    <>
      <PageHeader
        title="Categorías"
        subtitle="Así se agrupan los productos en la pantalla del mesero."
        actions={
          <Button size="lg" variant="success" icon="➕" onClick={() => setEditing({})}>
            Nueva categoría
          </Button>
        }
      />

      <DataState {...categories} onRetry={categories.reload}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(categories.data ?? []).map((c) => (
            <div key={c.id} className={`flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ${c.is_active ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl" aria-hidden>
                  {c.icon}
                </span>
                <div className="flex-1">
                  <p className="text-xl font-black uppercase">{c.name}</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {c.section === 'bebida' ? '🥤 Bebidas' : '🍽️ Comida'} · {c.products_count} productos
                  </p>
                  {c.menu_slot_label && <p className="text-sm font-bold text-amber-700">⭐ Menú del día: {c.menu_slot_label}</p>}
                  {!c.is_active && <p className="text-sm font-bold text-slate-600">⏸️ Oculta</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" icon="✏️" onClick={() => setEditing(c)}>
                  Editar
                </Button>
                {c.is_active ? (
                  <Button variant="danger-outline" size="sm" onClick={() => setActive(c, false)}>
                    Ocultar
                  </Button>
                ) : (
                  <Button variant="success" size="sm" onClick={() => setActive(c, true)}>
                    Mostrar
                  </Button>
                )}
                {c.products_count === 0 && (
                  <Button variant="ghost" size="sm" onClick={() => remove(c)}>
                    🗑️ Eliminar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DataState>

      {editing && (
        <CategoryFormModal
          category={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            toast.success(message)
            setEditing(null)
            categories.reload()
          }}
        />
      )}
    </>
  )
}

function CategoryFormModal({ category, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: category?.name ?? '',
    icon: category?.icon ?? '🍽️',
    section: category?.section ?? 'comida',
    menu_slot: category?.menu_slot ?? '',
    is_active: category?.is_active ?? true,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const result = await adminApi.saveCategory({ ...form, menu_slot: form.menu_slot || null }, category?.id)
      onSaved(result.message)
    } catch (error) {
      setErrors({ ...error.errors, general: error.message })
      setSaving(false)
    }
  }

  return (
    <Modal title={category ? 'Editar categoría' : 'Nueva categoría'} onClose={onClose}>
      <form onSubmit={save} className="space-y-5">
        <Field label="Nombre" error={errors.name?.[0]}>
          <TextInput value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="Ej: Sopas" autoFocus maxLength={60} />
        </Field>

        <Field label="Ícono">
          <div className="grid grid-cols-8 gap-2">
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => set('icon')(icon)}
                aria-pressed={form.icon === icon}
                className={`flex aspect-square items-center justify-center rounded-xl text-2xl ${
                  form.icon === icon ? 'bg-brand-600 ring-4 ring-brand-200' : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Sección">
          <Toggle
            value={form.section}
            onChange={set('section')}
            options={[
              { value: 'comida', label: '🍽️ Comida' },
              { value: 'bebida', label: '🥤 Bebidas' },
            ]}
          />
        </Field>

        <Field label="¿Se usa en el Menú del Día?" hint="Sus productos aparecerán en ese desplegable al armar el menú.">
          <Select value={form.menu_slot} onChange={(e) => set('menu_slot')(e.target.value)}>
            {MENU_SLOTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Visible para los meseros">
          <Toggle
            value={form.is_active}
            onChange={set('is_active')}
            options={[
              { value: true, label: '👁️ Sí', activeClass: 'border-emerald-600 bg-emerald-600 text-white' },
              { value: false, label: '⏸️ No (oculta)', activeClass: 'border-slate-700 bg-slate-700 text-white' },
            ]}
          />
        </Field>

        {errors.general && <p className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">❌ {errors.general}</p>}

        <Button type="submit" variant="success" size="xl" block icon="💾" loading={saving}>
          Guardar categoría
        </Button>
      </form>
    </Modal>
  )
}

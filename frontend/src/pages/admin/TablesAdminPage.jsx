import { useState } from 'react'
import Button from '../../components/Button'
import { DataState } from '../../components/Feedback'
import { Field, TextInput, Toggle } from '../../components/Form'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import QuantityStepper from '../../components/QuantityStepper'
import StatusBadge from '../../components/StatusBadge'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { useLiveData } from '../../hooks/useLiveData'
import { adminApi } from '../../services/endpoints'

export default function TablesAdminPage() {
  const tables = useLiveData(() => adminApi.tables(), ['tables', 'orders'])
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(null)

  const list = tables.data ?? []
  const nextNumber = list.reduce((max, t) => Math.max(max, t.number), 0) + 1

  const remove = async (table) => {
    const ok = await confirm({
      title: `¿Quitar ${table.label}?`,
      message: 'Si ya tuvo pedidos, se desactiva para conservar el historial.',
      cancelText: 'NO',
      confirmText: 'SÍ, QUITAR',
      tone: 'danger',
    })
    if (!ok) return
    try {
      const result = await adminApi.deleteTable(table.id)
      toast.success(result.message)
      tables.reload()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Mesas"
        actions={
          <Button variant="success" size="lg" icon="➕" onClick={() => setEditing({})}>
            Agregar mesa {nextNumber}
          </Button>
        }
      />
      <DataState {...tables} onRetry={tables.reload}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {list.map((t) => (
            <div key={t.id} className={`flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-sm ${t.is_active ? '' : 'opacity-50'}`}>
              <p className="text-2xl font-black uppercase">{t.label}</p>
              <p className="text-slate-600">
                Número {t.number} · {t.seats} puestos
              </p>
              {t.is_active ? <StatusBadge type="table" status={t.state} /> : <span className="font-bold text-slate-500">⏸️ Desactivada</span>}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(t)}>
                  ✏️ Editar
                </Button>
                {t.is_active && t.state === 'disponible' && (
                  <Button variant="ghost" size="sm" onClick={() => remove(t)}>
                    🗑️ Quitar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DataState>

      {editing && (
        <TableForm
          table={editing.id ? editing : null}
          nextNumber={nextNumber}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            toast.success(message)
            setEditing(null)
            tables.reload()
          }}
        />
      )}
    </>
  )
}

function TableForm({ table, nextNumber, onSaved, onClose }) {
  const [form, setForm] = useState({
    number: table?.number ?? nextNumber,
    name: table?.name ?? '',
    seats: table?.seats ?? 4,
    is_active: table?.is_active ?? true,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const result = await adminApi.saveTable({ ...form, name: form.name.trim() || null }, table?.id)
      onSaved(result.message)
    } catch (error) {
      setErrors({ ...error.errors, general: error.message })
      setSaving(false)
    }
  }

  return (
    <Modal title={table ? `Editar ${table.label}` : 'Nueva mesa'} onClose={onClose} size="sm">
      <form onSubmit={save} className="space-y-5">
        <Field label="Número de mesa" error={errors.number?.[0]}>
          <QuantityStepper value={form.number} min={1} max={999} size="lg" onChange={(number) => setForm((f) => ({ ...f, number }))} />
        </Field>
        <Field label="Puestos">
          <QuantityStepper value={form.seats} min={1} max={50} size="lg" onChange={(seats) => setForm((f) => ({ ...f, seats }))} />
        </Field>
        <Field label="Nombre especial (opcional)" hint={`Si lo deja vacío se llamará "Mesa ${form.number}".`} error={errors.name?.[0]}>
          <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej: Terraza 1" maxLength={40} />
        </Field>
        {table && (
          <Field label="Activa">
            <Toggle
              value={form.is_active}
              onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              options={[
                { value: true, label: '🟢 Sí', activeClass: 'border-emerald-600 bg-emerald-600 text-white' },
                { value: false, label: '⏸️ No', activeClass: 'border-slate-700 bg-slate-700 text-white' },
              ]}
            />
          </Field>
        )}
        {errors.general && <p className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">❌ {errors.general}</p>}
        <Button type="submit" variant="success" size="xl" block icon="💾" loading={saving}>
          Guardar mesa
        </Button>
      </form>
    </Modal>
  )
}

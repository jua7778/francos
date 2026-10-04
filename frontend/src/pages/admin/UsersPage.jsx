import { useState } from 'react'
import Button from '../../components/Button'
import { DataState } from '../../components/Feedback'
import { Field, TextInput, Toggle } from '../../components/Form'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { useLiveData } from '../../hooks/useLiveData'
import { adminApi } from '../../services/endpoints'

const ROLE_ICONS = { admin: '🛠️', mesero: '🧑‍🍳', cocina: '👨‍🍳', caja: '💵' }

export default function UsersPage() {
  const data = useLiveData(async () => {
    const [users, roles] = await Promise.all([adminApi.users(), adminApi.roles()])
    return { users, roles }
  })
  const { user: me } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(null)

  const deactivate = async (user) => {
    const ok = await confirm({
      title: `¿Desactivar a ${user.name}?`,
      message: 'No podrá entrar al sistema. Su historial se conserva.',
      cancelText: 'NO',
      confirmText: 'SÍ, DESACTIVAR',
      tone: 'danger',
    })
    if (!ok) return
    try {
      const result = await adminApi.deactivateUser(user.id)
      toast.success(result.message)
      data.reload()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Cada trabajador entra con su propio usuario. El rol define qué pantallas ve."
        actions={
          <Button variant="success" size="lg" icon="➕" onClick={() => setEditing({})}>
            Nuevo usuario
          </Button>
        }
      />
      <DataState {...data} onRetry={data.reload}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data.data?.users ?? []).map((u) => (
            <div key={u.id} className={`flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ${u.is_active ? '' : 'opacity-50'}`}>
              <span className="text-4xl" aria-hidden>
                {ROLE_ICONS[u.role.slug]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-black">{u.name}</p>
                <p className="text-slate-600">
                  Usuario: <b>{u.username}</b> · {u.role.name}
                </p>
                {!u.is_active && <p className="font-bold text-slate-600">⏸️ Desactivado</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(u)}>
                  ✏️ Editar
                </Button>
                {u.is_active && u.id !== me.id && (
                  <Button variant="danger-outline" size="sm" onClick={() => deactivate(u)}>
                    Desactivar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DataState>

      {editing && data.data && (
        <UserForm
          user={editing.id ? editing : null}
          roles={data.data.roles}
          isSelf={editing.id === me.id}
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

function UserForm({ user, roles, isSelf, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: user?.name ?? '',
    username: user?.username ?? '',
    password: '',
    role_id: user?.role.id ?? roles.find((r) => r.slug === 'mesero')?.id,
    is_active: user?.is_active ?? true,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const result = await adminApi.saveUser({ ...form, password: form.password || null }, user?.id)
      onSaved(result.message)
    } catch (error) {
      setErrors({ ...error.errors, general: error.message })
      setSaving(false)
    }
  }

  return (
    <Modal title={user ? `Editar ${user.name}` : 'Nuevo usuario'} onClose={onClose}>
      <form onSubmit={save} className="space-y-5">
        <Field label="Nombre" error={errors.name?.[0]}>
          <TextInput value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="Ej: María Gómez" maxLength={80} autoFocus />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Usuario (para entrar)" error={errors.username?.[0]}>
            <TextInput
              value={form.username}
              onChange={(e) => set('username')(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="Ej: maria"
              autoCapitalize="none"
              maxLength={50}
            />
          </Field>
          <Field label={user ? 'Nueva contraseña (opcional)' : 'Contraseña'} error={errors.password?.[0]} hint={user ? 'Déjela vacía para no cambiarla.' : 'Mínimo 4 caracteres.'}>
            <TextInput value={form.password} onChange={(e) => set('password')(e.target.value)} autoComplete="new-password" maxLength={100} />
          </Field>
        </div>

        <Field label="Rol" error={errors.role_id?.[0]}>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                disabled={isSelf}
                aria-pressed={form.role_id === role.id}
                onClick={() => set('role_id')(role.id)}
                className={`flex items-start gap-3 rounded-2xl border-4 p-3 text-left disabled:opacity-60 ${
                  form.role_id === role.id ? 'border-sky-600 bg-sky-50' : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-3xl" aria-hidden>
                  {ROLE_ICONS[role.slug]}
                </span>
                <span>
                  <span className="block text-lg font-black uppercase">{role.name}</span>
                  <span className="block text-sm text-slate-600">{role.description}</span>
                </span>
              </button>
            ))}
          </div>
        </Field>

        {user && !isSelf && (
          <Field label="Puede entrar al sistema">
            <Toggle
              value={form.is_active}
              onChange={set('is_active')}
              options={[
                { value: true, label: '🟢 Sí', activeClass: 'border-emerald-600 bg-emerald-600 text-white' },
                { value: false, label: '⏸️ No', activeClass: 'border-slate-700 bg-slate-700 text-white' },
              ]}
            />
          </Field>
        )}

        {errors.general && <p className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">❌ {errors.general}</p>}

        <Button type="submit" variant="success" size="xl" block icon="💾" loading={saving}>
          Guardar usuario
        </Button>
      </form>
    </Modal>
  )
}

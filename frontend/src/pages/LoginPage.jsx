import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import Button from '../components/Button'
import { Field, TextInput } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { ROLE_HOME } from '../utils/status'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  if (user) return <Navigate to={ROLE_HOME[user.role.slug]} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const me = await login(username, password)
      // Vuelve a la página donde estaba solo si es de su propia sección.
      const home = ROLE_HOME[me.role.slug]
      const from = location.state?.from
      const canReturn = from && from !== '/' && (me.role.slug === 'admin' || from.startsWith(home))
      navigate(canReturn ? from : home, { replace: true })
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-brand-700 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
        <div className="mb-7 text-center">
          <div className="text-6xl" aria-hidden>
            🍽️
          </div>
          <h1 className="mt-2 text-3xl font-black uppercase">Pedidos del restaurante</h1>
          <p className="mt-1 text-lg text-slate-600">Escriba su usuario y contraseña</p>
        </div>

        <div className="space-y-5">
          <Field label="Usuario">
            <TextInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              autoFocus
              required
              placeholder="Ej: maria"
            />
          </Field>
          <Field label="Contraseña">
            <div className="flex gap-2">
              <TextInput
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                {showPassword ? '🙈 Ocultar' : '👁️ Ver'}
              </button>
            </div>
          </Field>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-lg font-bold text-red-700 ring-2 ring-red-200" role="alert">
              ❌ {error}
            </p>
          )}

          <Button type="submit" size="xl" block loading={sending} icon="➡️">
            Entrar
          </Button>
        </div>
      </form>
    </div>
  )
}

import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { ROLE_HOME } from '../utils/status'
import Button from './Button'
import { Spinner } from './Feedback'

/**
 * Protege las rutas en React. (El backend también valida cada permiso:
 * esto solo evita mostrar pantallas que el usuario no puede usar.)
 */
export default function RequireRole({ roles }) {
  const { user, status, retry } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <Spinner label="Entrando…" />
  if (status === 'offline') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="text-6xl">📡</span>
        <p className="text-2xl font-bold">No hay conexión con el servidor.</p>
        <Button size="lg" icon="🔄" onClick={retry}>
          Intentar de nuevo
        </Button>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  const role = user.role.slug
  if (roles && role !== 'admin' && !roles.includes(role)) {
    return (
      <div className="mx-auto mt-16 max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
        <span className="text-6xl">🚫</span>
        <h1 className="mt-4 text-2xl font-black">Esta sección no es para su usuario</h1>
        <p className="mt-2 text-lg text-slate-600">Vuelva a su pantalla de trabajo.</p>
        <Button className="mt-6" size="lg" icon="🏠" onClick={() => (window.location.href = ROLE_HOME[role])}>
          Ir a mi pantalla
        </Button>
      </div>
    )
  }

  return <Outlet />
}

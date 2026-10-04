import { NavLink, Outlet } from 'react-router'
import ConnectionBanner from '../components/ConnectionBanner'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import { useNow } from '../hooks/useNow'
import { ROLE_LABELS } from '../utils/status'

// Pocas opciones por rol: cada trabajador ve solo lo que usa.
const NAV = {
  mesero: [{ to: '/mesas', icon: '🪑', label: 'Mesas' }],
  cocina: [
    { to: '/cocina', icon: '👨‍🍳', label: 'Pedidos', end: true },
    { to: '/cocina/agotados', icon: '❌', label: 'Agotados' },
  ],
  caja: [
    { to: '/caja', icon: '💵', label: 'Cobrar', end: true },
    { to: '/caja/pagos', icon: '📋', label: 'Pagos de hoy' },
  ],
  admin: [
    { to: '/admin', icon: '📊', label: 'Administrar' },
    { to: '/mesas', icon: '🪑', label: 'Mesero' },
    { to: '/cocina', icon: '👨‍🍳', label: 'Cocina' },
    { to: '/caja', icon: '💵', label: 'Caja' },
  ],
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const confirm = useConfirm()
  const now = useNow(15000)
  const role = user.role.slug

  const onLogout = async () => {
    const ok = await confirm({
      title: '¿Cerrar sesión?',
      message: 'Tendrá que escribir su usuario y contraseña para volver a entrar.',
      confirmText: 'SÍ, SALIR',
      tone: 'danger',
    })
    if (ok) logout()
  }

  return (
    <div className="min-h-screen">
      <ConnectionBanner />
      <header className="bg-slate-900 text-white shadow-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2 py-1">
            <span className="text-3xl" aria-hidden>
              🍽️
            </span>
            <div className="leading-tight">
              <div className="text-lg font-black uppercase tracking-wide">{user.name}</div>
              <div className="text-sm font-semibold text-brand-100">{ROLE_LABELS[role]}</div>
            </div>
          </div>

          <nav className="order-3 flex w-full gap-2 overflow-x-auto pb-1 sm:order-none sm:w-auto sm:flex-1 sm:pb-0">
            {NAV[role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4 text-base font-bold uppercase transition ${
                    isActive ? 'bg-brand-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`
                }
              >
                <span aria-hidden className="text-xl">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xl font-bold tabular-nums md:block">
              {new Date(now).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-white/10 px-4 font-bold uppercase hover:bg-red-600"
            >
              <span aria-hidden>🚪</span> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

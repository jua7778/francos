import { NavLink, Outlet } from 'react-router'

const LINKS = [
  { to: '/admin', icon: '📊', label: 'Panel', end: true },
  { to: '/admin/carta', icon: '📖', label: 'Carta' },
  { to: '/admin/categorias', icon: '🗂️', label: 'Categorías' },
  { to: '/admin/menu-del-dia', icon: '⭐', label: 'Menú del día' },
  { to: '/admin/mesas', icon: '🪑', label: 'Mesas' },
  { to: '/admin/usuarios', icon: '👥', label: 'Usuarios' },
  { to: '/admin/reportes', icon: '📈', label: 'Reportes' },
]

export default function AdminLayout() {
  return (
    <>
      <nav className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4 font-bold uppercase ${
                isActive ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 ring-2 ring-slate-200 hover:ring-slate-400'
              }`
            }
          >
            <span aria-hidden>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  )
}

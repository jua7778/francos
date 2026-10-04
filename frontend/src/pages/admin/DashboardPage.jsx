import { Link } from 'react-router'
import { DataState } from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import { useLiveData } from '../../hooks/useLiveData'
import { adminApi } from '../../services/endpoints'
import { formatDate, formatMoney } from '../../utils/format'

const SHORTCUTS = [
  { to: '/admin/carta', icon: '📖', label: 'Administrar carta', color: 'bg-brand-600' },
  { to: '/admin/carta?seccion=bebida', icon: '🥤', label: 'Administrar bebidas', color: 'bg-sky-600' },
  { to: '/admin/menu-del-dia', icon: '⭐', label: 'Menú del día', color: 'bg-amber-500' },
  { to: '/admin/mesas', icon: '🪑', label: 'Mesas', color: 'bg-emerald-600' },
  { to: '/admin/usuarios', icon: '👥', label: 'Usuarios', color: 'bg-violet-600' },
  { to: '/admin/reportes', icon: '📈', label: 'Reportes', color: 'bg-slate-800' },
]

export default function DashboardPage() {
  const stats = useLiveData(() => adminApi.dashboard(), ['orders', 'catalog', 'tables'])
  const d = stats.data

  return (
    <>
      <PageHeader title="Panel del administrador" subtitle={formatDate(new Date())} />

      <DataState {...stats} onRetry={stats.reload}>
        {d && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Ventas de hoy" value={formatMoney(d.sales_today)} tone="bg-slate-900 text-white" />
              <Stat label="Pedidos de hoy" value={d.orders_today} detail={`${d.orders_open} abiertos ahora`} />
              <Stat label="Mesas ocupadas" value={`${d.tables_occupied} / ${d.tables_total}`} detail={`${d.tables_available} disponibles`} />
              <Stat
                label="Productos"
                value={d.products_available}
                detail={d.products_sold_out ? `${d.products_sold_out} agotados` : 'Ninguno agotado'}
                detailTone={d.products_sold_out ? 'text-red-700' : 'text-emerald-700'}
              />
            </div>

            <h2 className="mb-3 mt-8 text-xl font-black uppercase text-slate-600">Accesos rápidos</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {SHORTCUTS.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  className={`flex min-h-28 items-center gap-4 rounded-3xl p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${s.color}`}
                >
                  <span className="text-4xl" aria-hidden>
                    {s.icon}
                  </span>
                  <span className="text-xl font-black uppercase leading-tight">{s.label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-xl font-black uppercase">⭐ Menú del día</h2>
                {d.daily_menus.length === 0 ? (
                  <p className="text-lg text-slate-600">
                    Todavía no hay menú para hoy.{' '}
                    <Link to="/admin/menu-del-dia" className="font-bold text-brand-700 underline">
                      Crear menú del día
                    </Link>
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {d.daily_menus.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 text-lg">
                        <span>
                          <b>{m.name}:</b> {m.components.find((c) => c.slot === 'principal')?.name}
                        </span>
                        <span className="font-black">{m.is_sellable ? formatMoney(m.price) : '❌ Agotado'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-xl font-black uppercase">❌ Productos agotados</h2>
                {d.sold_out.length === 0 ? (
                  <p className="text-lg text-emerald-700">✅ Todo está disponible.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {d.sold_out.map((p) => (
                      <li key={p.id} className="rounded-full bg-red-100 px-3 py-1.5 font-bold text-red-800">
                        {p.category?.icon} {p.name}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </DataState>
    </>
  )
}

function Stat({ label, value, detail, tone = 'bg-white', detailTone = 'text-slate-500' }) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ${tone}`}>
      <p className="text-sm font-bold uppercase opacity-70">{label}</p>
      <p className="text-3xl font-black sm:text-4xl">{value}</p>
      {detail && <p className={`font-semibold ${detailTone}`}>{detail}</p>}
    </div>
  )
}

import { useState } from 'react'
import { DataState, EmptyState } from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import { useLiveData } from '../../hooks/useLiveData'
import { adminApi } from '../../services/endpoints'
import { formatDate, formatMoney, toISODate } from '../../utils/format'

function range(days) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  return { from: toISODate(from), to: toISODate(to) }
}

const PRESETS = [
  { key: 'hoy', label: 'Hoy', get: () => range(1) },
  {
    key: 'ayer',
    label: 'Ayer',
    get: () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return { from: toISODate(d), to: toISODate(d) }
    },
  },
  { key: '7', label: 'Últimos 7 días', get: () => range(7) },
  {
    key: 'mes',
    label: 'Este mes',
    get: () => {
      const d = new Date()
      return { from: toISODate(new Date(d.getFullYear(), d.getMonth(), 1)), to: toISODate(d) }
    },
  },
]

export default function ReportsPage() {
  const [preset, setPreset] = useState('7')
  const { from, to } = PRESETS.find((p) => p.key === preset).get()
  const report = useLiveData(() => adminApi.reports(from, to), ['orders'], [from, to])
  const r = report.data
  const maxDay = Math.max(1, ...(r?.by_day ?? []).map((d) => d.total))

  return (
    <>
      <PageHeader title="Reportes de ventas" subtitle={r ? `${formatDate(r.from)} – ${formatDate(r.to)}` : null} />

      <div className="mb-6 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPreset(p.key)}
            aria-pressed={preset === p.key}
            className={`min-h-12 rounded-xl px-5 font-black uppercase ${preset === p.key ? 'bg-slate-900 text-white' : 'bg-white ring-2 ring-slate-300'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <DataState {...report} onRetry={report.reload}>
        {r && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card label="Ventas" value={formatMoney(r.total)} dark />
              <Card label="Mesas cobradas" value={r.orders} />
              <Card label="Promedio por mesa" value={formatMoney(r.average)} />
              <Card label="Pedidos cancelados" value={r.cancelled} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-black uppercase">📅 Ventas por día</h2>
                {r.by_day.length === 0 ? (
                  <EmptyState icon="📭" title="Sin ventas en estas fechas" />
                ) : (
                  <ul className="space-y-3">
                    {r.by_day.map((d) => (
                      <li key={d.day}>
                        <div className="flex justify-between text-lg">
                          <span className="font-semibold capitalize">{formatDate(d.day)}</span>
                          <span className="font-black">{formatMoney(d.total)}</span>
                        </div>
                        <div className="mt-1 h-4 rounded-full bg-slate-100">
                          <div className="h-4 rounded-full bg-brand-500" style={{ width: `${(d.total / maxDay) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-black uppercase">🏆 Lo más vendido</h2>
                {r.top_products.length === 0 ? (
                  <EmptyState icon="📭" title="Sin ventas en estas fechas" />
                ) : (
                  <ol className="space-y-2">
                    {r.top_products.map((p, i) => (
                      <li key={p.name} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2 text-lg">
                        <span className="w-8 text-center font-black text-slate-400">{i + 1}</span>
                        <span className="flex-1 font-semibold">{p.name}</span>
                        <span className="font-black">{p.quantity} und.</span>
                        <span className="w-28 text-right text-slate-600">{formatMoney(p.total)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-black uppercase">💳 Por forma de pago</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {r.by_method.map((m) => (
                  <div key={m.method} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-bold uppercase text-slate-500">{m.label}</p>
                    <p className="text-3xl font-black">{formatMoney(m.total)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </DataState>
    </>
  )
}

function Card({ label, value, dark = false }) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ${dark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
      <p className="text-sm font-bold uppercase opacity-70">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  )
}

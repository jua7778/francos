import { useState } from 'react'
import { DataState, EmptyState } from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import { useLiveData } from '../../hooks/useLiveData'
import { paymentsApi } from '../../services/endpoints'
import { formatDate, formatMoney, formatTime, toISODate } from '../../utils/format'

const METHOD_ICONS = { efectivo: '💵', tarjeta: '💳', transferencia: '📱' }

export default function PaymentsPage() {
  const [date, setDate] = useState(() => toISODate())
  const payments = useLiveData(() => paymentsApi.list(date), ['orders'], [date])

  const shift = (days) => {
    const d = new Date(`${date}T12:00:00`)
    d.setDate(d.getDate() + days)
    setDate(toISODate(d))
  }
  const isToday = date === toISODate()

  return (
    <>
      <PageHeader title="Pagos" subtitle={formatDate(date)} />

      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => shift(-1)} className="min-h-12 rounded-xl bg-white px-4 font-bold ring-2 ring-slate-300">
          ← Día anterior
        </button>
        {!isToday && (
          <button type="button" onClick={() => setDate(toISODate())} className="min-h-12 rounded-xl bg-slate-900 px-4 font-bold text-white">
            Hoy
          </button>
        )}
        {!isToday && (
          <button type="button" onClick={() => shift(1)} className="min-h-12 rounded-xl bg-white px-4 font-bold ring-2 ring-slate-300">
            Día siguiente →
          </button>
        )}
      </div>

      <DataState {...payments} onRetry={payments.reload}>
        {payments.data && (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl bg-slate-900 p-5 text-white">
                <p className="text-sm font-bold uppercase opacity-80">Total del día</p>
                <p className="text-4xl font-black">{formatMoney(payments.data.total)}</p>
                <p className="font-semibold opacity-80">{payments.data.payments.length} mesas cobradas</p>
              </div>
              {payments.data.by_method.map((m) => (
                <div key={m.method} className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold uppercase text-slate-500">
                    {METHOD_ICONS[m.method]} {m.label}
                  </p>
                  <p className="text-3xl font-black">{formatMoney(m.total)}</p>
                  <p className="font-semibold text-slate-500">{m.count} pagos</p>
                </div>
              ))}
            </div>

            {payments.data.payments.length === 0 ? (
              <EmptyState icon="🧾" title="No hay pagos este día" />
            ) : (
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
                <table className="w-full text-left text-lg">
                  <thead className="bg-slate-100 text-sm uppercase text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Hora</th>
                      <th className="px-4 py-3">Mesa</th>
                      <th className="hidden px-4 py-3 sm:table-cell">Forma de pago</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.data.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 tabular-nums">{formatTime(p.paid_at)}</td>
                        <td className="px-4 py-3 font-bold">{p.table}</td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          {METHOD_ICONS[p.method]} {p.method_label}
                          {p.change_amount > 0 && <span className="text-sm text-slate-500"> (vueltas {formatMoney(p.change_amount)})</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-black">{formatMoney(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </DataState>
    </>
  )
}

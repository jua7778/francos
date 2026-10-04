import { useEffect, useState } from 'react'
import { formatMoney } from '../../utils/format'
import QuantityStepper from '../QuantityStepper'

export default function DailyMenuCard({ menu, onAdd }) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const soldOut = !menu.is_sellable

  useEffect(() => {
    if (!added) return undefined
    const id = setTimeout(() => setAdded(false), 1200)
    return () => clearTimeout(id)
  }, [added])

  const principal = menu.components.find((c) => c.slot === 'principal')

  return (
    <div className={`flex flex-col rounded-3xl border-4 bg-white p-4 shadow-sm sm:p-5 ${soldOut ? 'border-red-200 opacity-70' : 'border-amber-400'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black uppercase tracking-widest text-amber-700">⭐ {menu.name}</div>
          <h3 className={`text-2xl font-black uppercase leading-tight ${soldOut ? 'line-through' : ''}`}>{principal?.name}</h3>
        </div>
        <div className="text-2xl font-black text-brand-700">{formatMoney(menu.price)}</div>
      </div>

      <p className="mt-3 text-sm font-bold uppercase text-slate-500">Incluye:</p>
      <ul className="mt-1 space-y-1">
        {menu.components
          .filter((c) => c.slot !== 'principal')
          .map((c) => (
            <li key={c.slot} className={`flex items-center gap-2 text-lg ${c.is_available ? '' : 'text-red-700'}`}>
              <span aria-hidden>{c.icon}</span>
              <span className="font-semibold">{c.name}</span>
              {!c.is_available && <span className="rounded bg-red-100 px-2 text-sm font-black uppercase">Agotado</span>}
            </li>
          ))}
      </ul>

      {soldOut ? (
        <p className="mt-4 rounded-xl bg-red-600 py-3 text-center text-lg font-black uppercase text-white">❌ Menú agotado</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} size="lg" />
          <button
            type="button"
            onClick={() => {
              onAdd(menu, quantity)
              setQuantity(1)
              setAdded(true)
            }}
            className={`min-h-14 flex-1 rounded-xl px-5 text-lg font-black uppercase text-white active:scale-[0.98] ${
              added ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {added ? '✓ Agregado' : '+ Agregar menú'}
          </button>
        </div>
      )}
    </div>
  )
}

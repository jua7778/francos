import { useEffect, useState } from 'react'
import { formatMoney } from '../../utils/format'
import QuantityStepper from '../QuantityStepper'

/**
 * POLLO A LA PLANCHA
 * $25.000
 * [-] 1 [+]
 * [ AGREGAR ]
 */
export default function ProductCard({ product, fallbackIcon, onAdd }) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const soldOut = !product.is_available

  useEffect(() => {
    if (!added) return undefined
    const id = setTimeout(() => setAdded(false), 1200)
    return () => clearTimeout(id)
  }, [added])

  const add = () => {
    onAdd(product, quantity)
    setQuantity(1)
    setAdded(true)
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-3xl border-2 bg-white shadow-sm ${
        soldOut ? 'border-red-200 bg-slate-50' : 'border-slate-200'
      }`}
    >
      <div className="relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            className={`h-28 w-full object-cover sm:h-32 ${soldOut ? 'opacity-40 grayscale' : ''}`}
          />
        ) : (
          <div className={`flex h-20 items-center justify-center bg-brand-50 text-5xl ${soldOut ? 'opacity-40 grayscale' : ''}`} aria-hidden>
            {fallbackIcon}
          </div>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-red-600 py-1 text-center text-lg font-black uppercase tracking-widest text-white">
            ❌ Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div>
          <h3 className={`text-lg font-black uppercase leading-tight ${soldOut ? 'text-slate-400 line-through' : ''}`}>{product.name}</h3>
          <p className="text-xl font-extrabold text-brand-700">{formatMoney(product.price)}</p>
          {product.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description}</p>}
        </div>

        {soldOut ? (
          <p className="mt-auto rounded-xl bg-red-50 py-3 text-center font-bold text-red-700">No se puede pedir</p>
        ) : (
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex justify-center">
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </div>
            <button
              type="button"
              onClick={add}
              className={`min-h-14 rounded-xl text-lg font-black uppercase text-white transition active:scale-[0.98] ${
                added ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              {added ? '✓ Agregado' : '+ Agregar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

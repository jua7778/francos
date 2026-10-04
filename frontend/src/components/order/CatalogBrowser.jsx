import { useState } from 'react'
import { EmptyState } from '../Feedback'
import DailyMenuCard from './DailyMenuCard'
import ProductCard from './ProductCard'

const MENU_VIEW = 'menu'

/**
 * Navegación de la carta para el mesero:
 * 1) Pantalla de categorías con botones grandes (Menú del día, Comida, Bebidas).
 * 2) Al tocar una categoría se ven sus productos como tarjetas.
 */
export default function CatalogBrowser({ catalog, onAddProduct, onAddMenu }) {
  const [view, setView] = useState(null) // null = categorías, 'menu' o id de categoría

  const categories = catalog.categories.filter((c) => c.products.length > 0)
  const food = categories.filter((c) => c.section === 'comida')
  const drinks = categories.filter((c) => c.section === 'bebida')
  const menus = catalog.daily_menus

  if (view === null) {
    return (
      <div className="space-y-6">
        {menus.length > 0 && (
          <button
            type="button"
            onClick={() => setView(MENU_VIEW)}
            className="flex w-full items-center gap-4 rounded-3xl border-4 border-amber-400 bg-gradient-to-r from-amber-100 to-amber-50 p-5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
          >
            <span className="text-5xl" aria-hidden>
              ⭐
            </span>
            <span className="flex-1">
              <span className="block text-2xl font-black uppercase sm:text-3xl">Menú del día</span>
              <span className="block text-lg font-semibold text-amber-900">
                {menus.map((m) => m.name).join(' · ')}
              </span>
            </span>
            <span className="text-3xl font-black text-amber-700" aria-hidden>
              →
            </span>
          </button>
        )}

        <CategoryGroup title="🍽️ Comida" categories={food} onSelect={setView} />
        <CategoryGroup title="🥤 Bebidas" categories={drinks} onSelect={setView} />
      </div>
    )
  }

  const current = categories.find((c) => c.id === view)

  return (
    <div>
      {/* Barra superior: volver y cambiar de categoría sin retroceder. */}
      <div className="sticky top-0 z-10 -mx-1 mb-4 flex gap-2 overflow-x-auto bg-slate-100 px-1 py-2">
        <button
          type="button"
          onClick={() => setView(null)}
          className="flex min-h-14 shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 text-base font-bold uppercase text-white"
        >
          ← Categorías
        </button>
        {menus.length > 0 && (
          <Chip active={view === MENU_VIEW} onClick={() => setView(MENU_VIEW)} icon="⭐" label="Menú del día" />
        )}
        {categories.map((c) => (
          <Chip key={c.id} active={view === c.id} onClick={() => setView(c.id)} icon={c.icon} label={c.name} />
        ))}
      </div>

      {view === MENU_VIEW ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {menus.map((menu) => (
            <DailyMenuCard key={menu.id} menu={menu} onAdd={onAddMenu} />
          ))}
        </div>
      ) : current ? (
        <>
          <h2 className="mb-3 text-2xl font-black uppercase">
            {current.icon} {current.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
            {current.products.map((product) => (
              <ProductCard key={product.id} product={product} fallbackIcon={current.icon} onAdd={onAddProduct} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon="🤷" title="Esta categoría ya no está disponible." />
      )}
    </div>
  )
}

function CategoryGroup({ title, categories, onSelect }) {
  if (!categories.length) return null
  return (
    <section>
      <h2 className="mb-3 text-xl font-black uppercase text-slate-600">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 2xl:grid-cols-4">
        {categories.map((c) => {
          const soldOut = c.products.filter((p) => !p.is_available).length
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className="flex min-h-32 min-w-0 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-slate-200 bg-white p-3 text-center sm:p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md active:scale-[0.98]"
            >
              <span className="text-5xl" aria-hidden>
                {c.icon}
              </span>
              <span className="w-full hyphens-auto text-base font-black [overflow-wrap:anywhere] uppercase leading-tight sm:text-xl">{c.name}</span>
              {soldOut > 0 && <span className="text-sm font-bold text-red-700">{soldOut} agotado(s)</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Chip({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-14 shrink-0 items-center gap-2 rounded-xl px-4 text-base font-bold uppercase ring-2 ${
        active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-800 ring-slate-300'
      }`}
    >
      <span aria-hidden className="text-xl">
        {icon}
      </span>
      {label}
    </button>
  )
}

import { formatMoney, parseMoneyInput } from '../utils/format'

// Campos de formulario grandes y claros, con el error debajo en rojo.

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-extrabold uppercase tracking-wide text-slate-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-sm text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block font-semibold text-red-700">⚠️ {error}</span>}
    </label>
  )
}

const inputClass =
  'block w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-lg font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-sky-500 focus:outline-none'

export function TextInput(props) {
  return <input type="text" className={inputClass} {...props} />
}

export function TextArea(props) {
  return <textarea rows={2} className={inputClass} {...props} />
}

export function Select({ children, ...props }) {
  return (
    <div className="relative">
      <select className={`${inputClass} appearance-none pr-12`} {...props}>
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-600" aria-hidden>
        ▼
      </span>
    </div>
  )
}

/** Precio en pesos: muestra "25.000" mientras se escribe y entrega el número 25000. */
export function MoneyInput({ value, onChange, ...props }) {
  const display = value === null || value === undefined || value === '' ? '' : formatMoney(value).replace('$', '')
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg font-bold text-slate-500">$</span>
      <input
        type="text"
        inputMode="numeric"
        className={`${inputClass} pl-9`}
        value={display}
        onChange={(e) => onChange(parseMoneyInput(e.target.value))}
        {...props}
      />
    </div>
  )
}

/** Selector de dos o más opciones con botones grandes (en vez de casillas pequeñas). */
export function Toggle({ value, onChange, options }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={selected}
            className={`min-h-14 rounded-xl border-2 px-3 text-lg font-bold transition ${
              selected ? opt.activeClass ?? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

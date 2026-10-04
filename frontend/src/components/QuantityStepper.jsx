/** [-] 2 [+] con botones grandes: el mesero nunca escribe cantidades. */
export default function QuantityStepper({ value, onChange, min = 1, max = 50, size = 'md', disabled = false }) {
  const big = size === 'lg'
  const btn = `flex items-center justify-center rounded-xl bg-slate-200 font-black text-slate-900 hover:bg-slate-300 active:bg-slate-400 disabled:opacity-40 ${big ? 'size-14 text-3xl' : 'size-11 text-2xl'}`

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label="Quitar uno"
      >
        −
      </button>
      <span className={`min-w-10 text-center font-black tabular-nums ${big ? 'text-3xl' : 'text-2xl'}`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Agregar uno"
      >
        +
      </button>
    </div>
  )
}

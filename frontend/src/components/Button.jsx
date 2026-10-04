const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  info: 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm',
  violet: 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
  secondary: 'bg-white text-slate-900 ring-2 ring-slate-300 hover:bg-slate-50',
  'danger-outline': 'bg-white text-red-700 ring-2 ring-red-300 hover:bg-red-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-200',
}

const SIZES = {
  sm: 'min-h-10 px-3 text-sm rounded-lg gap-1.5',
  md: 'min-h-12 px-4 text-base rounded-xl gap-2',
  lg: 'min-h-14 px-5 text-lg rounded-xl gap-2',
  xl: 'min-h-18 px-6 text-xl rounded-2xl gap-3',
}

/** Botón grande con ícono + texto. Nunca se usa solo con ícono. */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  block = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-bold uppercase tracking-wide transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="size-5 animate-spin rounded-full border-3 border-current border-t-transparent" aria-hidden />
      ) : (
        icon && (
          <span aria-hidden className="text-[1.3em] leading-none">
            {icon}
          </span>
        )
      )}
      <span>{children}</span>
    </button>
  )
}

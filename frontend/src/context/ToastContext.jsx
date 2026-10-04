import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

const STYLES = {
  success: { icon: '✅', className: 'bg-emerald-600 text-white' },
  error: { icon: '❌', className: 'bg-red-600 text-white' },
  warning: { icon: '⚠️', className: 'bg-amber-400 text-amber-950' },
  info: { icon: '🔔', className: 'bg-slate-900 text-white' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const notify = useCallback(
    (type, message, { duration } = {}) => {
      const id = nextId.current++
      setToasts((list) => [...list.filter((t) => t.message !== message), { id, type, message }].slice(-4))
      setTimeout(() => dismiss(id), duration ?? (type === 'error' || type === 'warning' ? 7000 : 4500))
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (m, o) => notify('success', m, o),
      error: (m, o) => notify('error', m, o),
      warning: (m, o) => notify('warning', m, o),
      info: (m, o) => notify('info', m, o),
    }),
    [notify],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const style = STYLES[toast.type]
          return (
            <button
              key={toast.id}
              type="button"
              onClick={() => dismiss(toast.id)}
              className={`animate-toast-in pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-2xl px-5 py-4 text-left text-lg font-bold shadow-2xl ${style.className}`}
            >
              <span className="text-2xl" aria-hidden>
                {style.icon}
              </span>
              <span className="flex-1">{toast.message}</span>
              <span className="text-sm font-semibold opacity-80">Cerrar</span>
            </button>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

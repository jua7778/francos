import { useLive } from '../context/LiveContext'

export default function ConnectionBanner() {
  const { online } = useLive()
  if (online) return null

  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-3 bg-red-600 px-4 py-3 text-center text-lg font-bold text-white" role="alert">
      <span className="size-4 animate-ping rounded-full bg-white" aria-hidden />
      Sin conexión con el servidor. Reintentando… No recargue la página.
    </div>
  )
}

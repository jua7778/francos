import { useEffect, useState } from 'react'

/** Hora actual que se actualiza sola (para "Hace 5 min", relojes, etc.). */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}

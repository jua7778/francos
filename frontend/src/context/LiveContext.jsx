import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { liveApi } from '../services/endpoints'

const LiveContext = createContext({ versions: {}, online: true })

const INTERVAL_MS = 2000

/**
 * Consulta /api/pulse cada 2 segundos. Cuando cambia un contador
 * (orders, catalog, tables), las pantallas que usan useLiveData recargan solas.
 * También detecta si se perdió la conexión con el servidor.
 */
export function LiveProvider({ enabled, children }) {
  const [versions, setVersions] = useState({})
  const [online, setOnline] = useState(true)
  const failures = useRef(0)

  useEffect(() => {
    if (!enabled) return undefined
    let stopped = false
    let inFlight = false
    let timer

    const tick = async () => {
      clearTimeout(timer)
      if (inFlight) return
      inFlight = true
      if (document.visibilityState === 'visible') {
        try {
          const { versions: next } = await liveApi.pulse()
          failures.current = 0
          setOnline(true)
          setVersions((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
        } catch (error) {
          if (error.isNetwork || error.status >= 500) {
            failures.current += 1
            if (failures.current >= 2) setOnline(false)
          }
        }
      }
      inFlight = false
      if (!stopped) timer = setTimeout(tick, INTERVAL_MS)
    }

    tick()
    // Al volver a la pestaña se consulta de inmediato, sin esperar el siguiente ciclo.
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled])

  return <LiveContext.Provider value={{ versions, online }}>{children}</LiveContext.Provider>
}

export function useLive() {
  return useContext(LiveContext)
}

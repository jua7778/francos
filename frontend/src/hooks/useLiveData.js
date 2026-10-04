import { useCallback, useEffect, useRef, useState } from 'react'
import { useLive } from '../context/LiveContext'

/**
 * Carga datos de la API y los vuelve a cargar solos cuando cambia
 * alguno de los canales indicados ('orders', 'catalog', 'tables').
 *
 *   const { data, loading, error, reload } = useLiveData(() => tablesApi.list(), ['orders', 'tables'])
 */
export function useLiveData(fetcher, channels = [], deps = []) {
  const { versions } = useLive()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  const requestId = useRef(0)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const reload = useCallback(async () => {
    const id = ++requestId.current
    try {
      const result = await fetcherRef.current()
      // Si llegó una respuesta más nueva mientras tanto, se ignora esta.
      if (id === requestId.current) {
        setData(result)
        setError(null)
      }
    } catch (e) {
      if (id === requestId.current) setError(e)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  const versionKey = channels.map((c) => versions[c] ?? 0).join('|')

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionKey, reload, ...deps])

  return { data, setData, error, loading, reload }
}

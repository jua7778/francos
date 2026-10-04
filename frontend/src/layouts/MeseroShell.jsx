import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router'
import { useToast } from '../context/ToastContext'
import { useLiveData } from '../hooks/useLiveData'
import { catalogApi, tablesApi } from '../services/endpoints'
import { playAlert } from '../utils/sound'

/**
 * Datos compartidos por las pantallas del mesero (mesas y carta), siempre actualizados.
 * Aquí también se generan los avisos: "Pedido de Mesa 4 está listo" y "Producto agotado",
 * que aparecen aunque el mesero esté dentro de otra mesa.
 */
export default function MeseroShell() {
  const tables = useLiveData(() => tablesApi.list(), ['orders', 'tables'])
  const catalog = useLiveData(() => catalogApi.catalog(), ['catalog'])

  useReadyAlerts(tables.data)
  useSoldOutAlerts(catalog.data)

  return <Outlet context={{ tables, catalog }} />
}

function useReadyAlerts(tables) {
  const toast = useToast()
  const previous = useRef(null)

  useEffect(() => {
    if (!tables) return
    const current = Object.fromEntries(tables.map((t) => [t.id, t.state]))
    if (previous.current) {
      const ready = tables.filter((t) => t.state === 'listo' && previous.current[t.id] !== 'listo')
      ready.forEach((t) => toast.success(`Pedido de ${t.label} está listo.`, { duration: 10000 }))
      if (ready.length) playAlert('ready')
    }
    previous.current = current
  }, [tables, toast])
}

function useSoldOutAlerts(catalog) {
  const toast = useToast()
  const previous = useRef(null)

  useEffect(() => {
    if (!catalog) return
    const soldOut = new Map()
    catalog.categories.forEach((c) => c.products.forEach((p) => !p.is_available && soldOut.set(`p${p.id}`, p.name)))
    catalog.daily_menus.forEach((m) => !m.is_sellable && soldOut.set(`m${m.id}`, m.name))

    if (previous.current) {
      soldOut.forEach((name, key) => {
        if (!previous.current.has(key)) toast.warning(`El producto "${name}" está agotado.`)
      })
    }
    previous.current = soldOut
  }, [catalog, toast])
}

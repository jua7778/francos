import { useCallback, useEffect, useState } from 'react'

// Productos que el mesero está agregando y todavía NO ha enviado a cocina.
// Se guarda por mesa en el navegador: si se recarga la página no se pierde nada.

const storageKey = (tableId) => `restaurante.cart.${tableId}`

function read(tableId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(tableId))) ?? []
  } catch {
    return []
  }
}

function write(tableId, lines) {
  try {
    if (lines.length) localStorage.setItem(storageKey(tableId), JSON.stringify(lines))
    else localStorage.removeItem(storageKey(tableId))
  } catch {
    // Sin almacenamiento el carrito funciona igual, solo que no sobrevive a una recarga.
  }
}

/** Una línea es un producto (kind 'product') o un menú del día (kind 'menu') con su nota. */
const lineKey = (kind, id, notes = '') => `${kind}:${id}:${notes}`

/** Importante: el componente que lo usa debe montarse con key={tableId}. */
export function useCart(tableId) {
  const [lines, setLines] = useState(() => read(tableId))

  useEffect(() => {
    write(tableId, lines)
  }, [tableId, lines])

  const add = useCallback((kind, item, quantity = 1) => {
    setLines((current) => {
      const key = lineKey(kind, item.id)
      const existing = current.find((l) => l.key === key)
      if (existing) {
        return current.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, l.quantity + quantity) } : l))
      }
      return [...current, { key, kind, id: item.id, name: item.name, price: item.price, quantity, notes: '' }]
    })
  }, [])

  const setQuantity = useCallback((key, quantity) => {
    setLines((current) =>
      quantity <= 0 ? current.filter((l) => l.key !== key) : current.map((l) => (l.key === key ? { ...l, quantity } : l)),
    )
  }, [])

  const setNotes = useCallback((key, notes) => {
    setLines((current) => {
      const line = current.find((l) => l.key === key)
      if (!line) return current
      const newKey = lineKey(line.kind, line.id, notes)
      const duplicate = current.find((l) => l.key === newKey && l.key !== key)
      if (duplicate) {
        // Ya había una línea igual con esa misma nota: se suman.
        return current
          .filter((l) => l.key !== key)
          .map((l) => (l.key === newKey ? { ...l, quantity: Math.min(50, l.quantity + line.quantity) } : l))
      }
      return current.map((l) => (l.key === key ? { ...l, key: newKey, notes } : l))
    })
  }, [])

  const remove = useCallback((key) => setLines((current) => current.filter((l) => l.key !== key)), [])
  const clear = useCallback(() => setLines([]), [])

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const count = lines.reduce((sum, l) => sum + l.quantity, 0)

  const toPayload = () =>
    lines.map((l) => ({
      [l.kind === 'menu' ? 'daily_menu_id' : 'product_id']: l.id,
      quantity: l.quantity,
      notes: l.notes || null,
    }))

  return { lines, add, setQuantity, setNotes, remove, clear, total, count, toPayload }
}

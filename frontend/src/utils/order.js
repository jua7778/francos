/** Agrupa los productos iguales de todas las comandas no canceladas: "3 × Jugo natural". */
export function summarizeItems(order) {
  const map = new Map()
  order.tickets
    .filter((t) => t.status !== 'cancelado')
    .flatMap((t) => t.items)
    .forEach((item) => {
      const key = `${item.name}|${item.unit_price}`
      const current = map.get(key) ?? { name: item.name, unit_price: item.unit_price, quantity: 0, subtotal: 0 }
      current.quantity += item.quantity
      current.subtotal += item.subtotal
      map.set(key, current)
    })
  return [...map.values()]
}

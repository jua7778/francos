const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

/** 25000 → "$ 25.000" */
export function formatMoney(value) {
  return money.format(value ?? 0).replace(/\s/g, '')
}

/** "2026-09-25T12:35:00-05:00" → "12:35 p. m." */
export function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
}

export function formatDate(isoOrDate) {
  if (!isoOrDate) return ''
  const date = typeof isoOrDate === 'string' && isoOrDate.length === 10 ? new Date(`${isoOrDate}T12:00:00`) : new Date(isoOrDate)
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Minutos transcurridos desde una fecha. */
export function minutesSince(iso, now = Date.now()) {
  if (!iso) return 0
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000))
}

export function elapsedLabel(iso, now) {
  const min = minutesSince(iso, now)
  if (min < 1) return 'Recién llegado'
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  return `Hace ${h} h ${min % 60} min`
}

/** Fecha local en formato Y-m-d (la que espera la API). */
export function toISODate(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Deja solo los dígitos: "25.000" → 25000 */
export function parseMoneyInput(text) {
  const digits = String(text ?? '').replace(/\D/g, '')
  return digits === '' ? null : Number(digits)
}

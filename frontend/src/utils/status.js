// Colores, íconos y textos de cada estado. Siempre se muestra texto + ícono,
// nunca solo el color.

export const TABLE_STATES = {
  disponible: { label: 'Disponible', icon: '🟢', card: 'bg-white border-slate-300 text-slate-900', badge: 'bg-emerald-100 text-emerald-800' },
  ocupada: { label: 'Ocupada', icon: '🍽️', card: 'bg-sky-50 border-sky-500 text-sky-950', badge: 'bg-sky-600 text-white' },
  en_preparacion: { label: 'En preparación', icon: '👨‍🍳', card: 'bg-amber-50 border-amber-500 text-amber-950', badge: 'bg-amber-500 text-white' },
  listo: { label: 'Pedido listo', icon: '✅', card: 'bg-emerald-50 border-emerald-600 text-emerald-950 animate-attention', badge: 'bg-emerald-600 text-white' },
  pendiente_pago: { label: 'Pendiente de pago', icon: '💵', card: 'bg-violet-50 border-violet-600 text-violet-950', badge: 'bg-violet-600 text-white' },
}

export const TICKET_STATES = {
  pendiente: { label: 'Pendiente', icon: '⏳', badge: 'bg-amber-100 text-amber-900 ring-1 ring-amber-400' },
  en_preparacion: { label: 'En preparación', icon: '👨‍🍳', badge: 'bg-orange-500 text-white' },
  listo: { label: 'Listo', icon: '✅', badge: 'bg-emerald-600 text-white' },
  entregado: { label: 'Entregado', icon: '🍽️', badge: 'bg-slate-200 text-slate-700' },
  cancelado: { label: 'Cancelado', icon: '❌', badge: 'bg-red-100 text-red-800 line-through' },
}

export const ORDER_STATES = {
  pendiente: { label: 'Pendiente', icon: '⏳', badge: 'bg-amber-100 text-amber-900 ring-1 ring-amber-400' },
  en_preparacion: { label: 'En preparación', icon: '👨‍🍳', badge: 'bg-orange-500 text-white' },
  listo: { label: 'Listo', icon: '✅', badge: 'bg-emerald-600 text-white' },
  en_caja: { label: 'Pendiente de pago', icon: '💵', badge: 'bg-violet-600 text-white' },
  pagado: { label: 'Pagado', icon: '✔️', badge: 'bg-slate-200 text-slate-700' },
  cancelado: { label: 'Cancelado', icon: '❌', badge: 'bg-red-100 text-red-800' },
}

export const ROLE_HOME = {
  admin: '/admin',
  mesero: '/mesas',
  cocina: '/cocina',
  caja: '/caja',
}

export const ROLE_LABELS = {
  admin: 'Administrador',
  mesero: 'Mesero',
  cocina: 'Cocina',
  caja: 'Caja',
}

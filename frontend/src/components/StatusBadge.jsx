import { ORDER_STATES, TABLE_STATES, TICKET_STATES } from '../utils/status'

const MAPS = { table: TABLE_STATES, ticket: TICKET_STATES, order: ORDER_STATES }

export default function StatusBadge({ type = 'order', status, className = '' }) {
  const state = MAPS[type][status]
  if (!state) return null
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold uppercase ${state.badge} ${className}`}>
      <span aria-hidden>{state.icon}</span>
      {state.label}
    </span>
  )
}

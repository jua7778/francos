import { useState } from 'react'
import Button from '../Button'
import { TextInput } from '../Form'
import Modal from '../Modal'

// Observaciones frecuentes: se tocan en vez de escribirlas.
const QUICK_NOTES = [
  'Sin cebolla',
  'Sin sal',
  'Sin salsa',
  'Poco picante',
  'Término medio',
  'Bien asado',
  'Sin hielo',
  'Sin azúcar',
  'Para llevar',
  'Salsa aparte',
]

export default function NoteModal({ line, onSave, onClose }) {
  const existing = line.notes ? line.notes.split(', ') : []
  const [selected, setSelected] = useState(existing.filter((n) => QUICK_NOTES.includes(n)))
  const [other, setOther] = useState(existing.filter((n) => !QUICK_NOTES.includes(n)).join(', '))

  const toggle = (note) => setSelected((list) => (list.includes(note) ? list.filter((n) => n !== note) : [...list, note]))

  const save = () => {
    const notes = [...selected, other.trim()].filter(Boolean).join(', ').slice(0, 200)
    onSave(notes)
  }

  return (
    <Modal
      title={`Observación: ${line.name}`}
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="success" size="lg" icon="✓" onClick={save}>
            Guardar
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-lg text-slate-600">Toque las que apliquen:</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {QUICK_NOTES.map((note) => {
          const on = selected.includes(note)
          return (
            <button
              key={note}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(note)}
              className={`min-h-14 rounded-xl border-2 px-3 text-base font-bold ${
                on ? 'border-amber-500 bg-amber-400 text-amber-950' : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              {on ? '✓ ' : ''}
              {note}
            </button>
          )
        })}
      </div>
      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-extrabold uppercase text-slate-700">Otra (solo si hace falta)</span>
        <TextInput value={other} onChange={(e) => setOther(e.target.value)} maxLength={120} placeholder="Escriba aquí…" />
      </label>
    </Modal>
  )
}

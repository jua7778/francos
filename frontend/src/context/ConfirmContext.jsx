import { createContext, useCallback, useContext, useRef, useState } from 'react'
import Button from '../components/Button'
import Modal from '../components/Modal'

const ConfirmContext = createContext(null)

/**
 * Confirmaciones simples: const ok = await confirm({ title: '¿Enviar pedido a cocina?', confirmText: 'ENVIAR PEDIDO' })
 */
export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setOptions(opts)
      }),
    [],
  )

  const close = (result) => {
    resolver.current?.(result)
    resolver.current = null
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Modal title={options.title} onClose={() => close(false)} size="sm" hideClose>
          {options.message && <div className="text-lg text-slate-700">{options.message}</div>}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="secondary" size="lg" onClick={() => close(false)}>
              {options.cancelText ?? 'CANCELAR'}
            </Button>
            <Button variant={options.tone ?? 'primary'} size="lg" onClick={() => close(true)} autoFocus>
              {options.confirmText ?? 'SÍ'}
            </Button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}

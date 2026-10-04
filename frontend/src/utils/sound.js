// Aviso sonoro corto (sin archivos de audio). Los navegadores solo permiten
// sonido después de que el usuario tocó la pantalla al menos una vez;
// como todos inician sesión con un clic, eso ya ocurrió.

let context

function getContext() {
  if (!context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return null
    context = new AudioContext()
  }
  if (context.state === 'suspended') context.resume()
  return context
}

/** kind: 'new' (dos tonos, pedido nuevo) o 'ready' (tres tonos ascendentes, pedido listo). */
export function playAlert(kind = 'new') {
  try {
    const ctx = getContext()
    if (!ctx) return
    const notes = kind === 'ready' ? [660, 880, 1100] : [880, 660]
    notes.forEach((frequency, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = ctx.currentTime + i * 0.18
      osc.type = 'sine'
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.17)
    })
  } catch {
    // Si el dispositivo no permite sonido, el aviso visual es suficiente.
  }
}

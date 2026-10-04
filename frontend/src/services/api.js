// Cliente HTTP de la API Laravel. Maneja el token de Sanctum y convierte
// los errores del servidor en mensajes claros para mostrar en pantalla.

const TOKEN_KEY = 'restaurante.token'
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Sin almacenamiento: la sesión dura mientras la pestaña esté abierta.
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // nada que limpiar
    }
  },
}

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }

  get isNetwork() {
    return this.status === 0
  }
}

const STATUS_MESSAGES = {
  401: 'Su sesión terminó. Vuelva a entrar.',
  403: 'No tiene permiso para hacer esto.',
  404: 'No se encontró lo que busca. Puede que ya no exista.',
  419: 'Su sesión terminó. Vuelva a entrar.',
  429: 'Demasiados intentos. Espere un momento.',
  500: 'Ocurrió un error en el servidor. Intente de nuevo.',
}

async function request(method, path, body) {
  const headers = { Accept: 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload })
  } catch {
    throw new ApiError('No hay conexión con el servidor. Revise el internet e intente de nuevo.', 0)
  }

  const data = await response.json().catch(() => null)

  if (response.status === 401 && token) {
    tokenStore.clear()
    window.dispatchEvent(new Event('auth:expired'))
  }

  if (!response.ok) {
    const errors = data?.errors ?? {}
    const firstError = Object.values(errors).flat()[0]
    const message =
      firstError || (response.status !== 500 && data?.message) || STATUS_MESSAGES[response.status] || STATUS_MESSAGES[500]
    throw new ApiError(message, response.status, errors)
  }

  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
}

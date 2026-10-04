import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { tokenStore } from '../services/api'
import { authApi } from '../services/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // loading: comprobando el token guardado · guest: sin sesión · authed: con sesión
  const [status, setStatus] = useState(() => (tokenStore.get() ? 'loading' : 'guest'))

  useEffect(() => {
    if (status !== 'loading') return
    authApi
      .me()
      .then((me) => {
        setUser(me)
        setStatus('authed')
      })
      .catch((error) => {
        // Sin conexión no se borra la sesión: se reintenta al recargar.
        if (!error.isNetwork) tokenStore.clear()
        setStatus(error.isNetwork ? 'offline' : 'guest')
      })
  }, [status])

  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setStatus('guest')
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (username, password) => {
    const { token, user: me } = await authApi.login(username, password)
    tokenStore.set(token)
    setUser(me)
    setStatus('authed')
    return me
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Aunque falle la red, se cierra la sesión en este equipo.
    }
    tokenStore.clear()
    setUser(null)
    setStatus('guest')
  }, [])

  const retry = useCallback(() => setStatus('loading'), [])

  const value = useMemo(() => ({ user, status, login, logout, retry }), [user, status, login, logout, retry])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

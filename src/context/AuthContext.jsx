import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api, { clearAuthToken, setAuthToken } from '../api/axiosConfig'
import { AUTH_STORAGE_KEY } from '../constants/auth'

const AuthContext = createContext(null)

function readStoredAuth() {
  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStoredAuth(payload) {
  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
}

function clearStoredAuth() {
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

async function requestRegister(payload) {
  const response = await api.post('/auth/register', payload)
  return response.data
}

async function requestLogin(payload) {
  const response = await api.post('/auth/login', payload)
  return response.data
}

async function requestMe() {
  const response = await api.get('/auth/me')
  return response.data.user
}

function isTokenExpired(token) {
  try {
    const payloadPart = token.split('.')[1]
    const payload = JSON.parse(window.atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')))

    if (!payload.exp) {
      return false
    }

    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function hydrateAuth() {
      const stored = readStoredAuth()

      if (!stored?.token) {
        if (!ignore) {
          setAuthLoading(false)
        }
        return
      }

      if (isTokenExpired(stored.token)) {
        if (!ignore) {
          clearStoredAuth()
          clearAuthToken()
          setToken('')
          setUser(null)
          setAuthLoading(false)
        }
        return
      }

      setAuthToken(stored.token)
      setToken(stored.token)

      try {
        const currentUser = await requestMe()

        if (!ignore) {
          setToken(stored.token)
          setUser(currentUser)
          setAuthToken(stored.token)
          writeStoredAuth({ token: stored.token, user: currentUser })
        }
      } catch {
        if (!ignore) {
          clearStoredAuth()
          clearAuthToken()
          setToken('')
          setUser(null)
        }
      } finally {
        if (!ignore) {
          setAuthLoading(false)
        }
      }
    }

    hydrateAuth()

    return () => {
      ignore = true
    }
  }, [])

  const login = async ({ email, password, role }) => {
    try {
      const data = await requestLogin({ email, password, role })
      setAuthToken(data.token)
      setToken(data.token)
      setUser(data.user)
      writeStoredAuth({ token: data.token, user: data.user })
      toast.success('Logged in successfully!')
      return data
    } catch (error) {
      if (!error?.response) {
        toast.error('Unable to connect to the server. Check backend/MySQL and try again.')
      } else {
        toast.error(error?.response?.data?.message || 'Invalid email or password!')
      }
      throw error
    }
  }

  const register = async ({ name, email, password, role }) => {
    try {
      const data = await requestRegister({ name, email, password, role })
      toast.success('Registration successful! Please log in.')
      return data
    } catch (error) {
      if (!error?.response) {
        toast.error('Unable to connect to the server. Check backend/MySQL and try again.')
      } else {
        toast.error(error?.response?.data?.message || 'Registration could not be completed.')
      }
      throw error
    }
  }

  const logout = () => {
    clearStoredAuth()
    clearAuthToken()
    setToken('')
    setUser(null)
  }

  const value = useMemo(
    () => ({ token, user, authLoading, login, register, logout }),
    [token, user, authLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}

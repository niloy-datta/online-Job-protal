import axios from 'axios'
import { AUTH_STORAGE_KEY, SESSION_EXPIRED_FLAG_KEY } from '../constants/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

let authToken = ''

export function setAuthToken(token) {
  authToken = String(token || '')
}

export function clearAuthToken() {
  authToken = ''
}

api.interceptors.request.use((config) => {
  if (!authToken) {
    try {
      const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
      const auth = raw ? JSON.parse(raw) : null
      setAuthToken(auth?.token || '')
    } catch {
      clearAuthToken()
    }
  }

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken()
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
      window.sessionStorage.setItem(SESSION_EXPIRED_FLAG_KEY, 'true')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default api
// src/lib/axios.ts
import axios from 'axios'
import authStorage from '@/auth/authStorage' 

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:6060', 
  withCredentials: false,
})

// Attach Authorization on every request
api.interceptors.request.use((cfg) => {
  const t = authStorage?.getToken?.()
  if (t) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${t}` }
  return cfg
})

// Centralize 401 handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      try { authStorage?.clearAll?.() } catch {}
      if (!location.pathname.startsWith('/auth')) location.href = '/auth/login'
    }
    return Promise.reject(err)
  }
)

export default api

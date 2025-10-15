// src/lib/axios.jsx
import axios from 'axios'
import authStorage from '@/auth/authStorage'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:6060', // gateway
  // timeout: 15000, // optional
})

api.interceptors.request.use((cfg) => {
  const t = authStorage.getToken()
  if (t) cfg.headers.Authorization = `Bearer ${t}`

  // pass UI language to backend (optional but recommended)
  const lang =
    localStorage.getItem('lang') ||
    authStorage.getUser()?.lang ||
    'en'
  cfg.headers['Accept-Language'] = lang

  // ETag for permissions endpoint
  if (cfg.url?.includes('/auth/me/permissions')) {
    const etag = authStorage.getPermsEtag()
    if (etag) cfg.headers['If-None-Match'] = etag
  }
  return cfg
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      authStorage.clearAll()
      if (!location.pathname.startsWith('/auth')) {
        location.href = '/auth/login'
      }
    }
    return Promise.reject(err)
  }
)

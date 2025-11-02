// src/lib/axios.ts
import axios from 'axios'
import authStorage from '@/auth/authStorage' 

export const api = axios.create({
  baseURL: 'http://localhost:6060',  // Gateway Service (CORS fixed!)
  withCredentials: false,
})

// Attach Authorization, Accept-Language, and X-User-Id on every request
api.interceptors.request.use((cfg) => {
  // JWT Token
  const token = authStorage?.getToken?.()
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`
  }

  // Language for i18n
  const lang = localStorage.getItem('lang') || 
               authStorage?.getUser?.()?.lang || 
               'en'
  cfg.headers['Accept-Language'] = lang

  // User ID for tracking and multi-tenancy
  const user = authStorage?.getUser?.()
  if (user?.userId) {
    cfg.headers['X-User-Id'] = user.userId
  }

  // ETag for permissions caching
  if (cfg.url?.includes('/auth/me/permissions')) {
    const etag = authStorage?.getPermsEtag?.()
    if (etag) {
      cfg.headers['If-None-Match'] = etag
    }
  }

  return cfg
})

// Centralize 401 handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    const requestUrl = err?.config?.url || ''
    
    // Don't auto-logout for permissions API (new OAuth users may not have permissions yet)
    const isPermissionsEndpoint = requestUrl.includes('/permissions/users/me') || 
                                   requestUrl.includes('/auth/me/permissions')
    
    if (status === 401 && !isPermissionsEndpoint) {
      try { authStorage?.clearAll?.() } catch {}
      if (!location.pathname.startsWith('/auth')) location.href = '/auth/login'
    }
    return Promise.reject(err)
  }
)

export default api

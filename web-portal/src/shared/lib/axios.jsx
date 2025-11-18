// src/lib/axios.jsx
import axios from 'axios'
import authStorage from '@/auth/authStorage'

export const api = axios.create({
  baseURL: 'http://localhost:6060', // Gateway Service (CORS fixed!)
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
    const requestUrl = err?.config?.url || ''
    
    // Don't auto-logout for these endpoints - let them handle their own errors
    const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                           requestUrl.includes('/auth/register') ||
                           requestUrl.includes('/auth/oauth/callback')
    const isPermissionsEndpoint = requestUrl.includes('/permissions/users/me') || 
                                   requestUrl.includes('/auth/me/permissions')
    
    // Only auto-redirect on 401 for authenticated endpoints (not login/register)
    if (status === 401 && !isAuthEndpoint && !isPermissionsEndpoint) {
      authStorage.clearAll()
      if (!location.pathname.startsWith('/auth')) {
        location.href = '/auth/login'
      }
    }
    
    // Log network errors for debugging
    if (!err.response) {
      console.error('🌐 Network error:', {
        url: requestUrl,
        message: err.message,
        code: err.code
      })
    }
    
    return Promise.reject(err)
  }
)

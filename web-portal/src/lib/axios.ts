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
    
    // Don't auto-logout for these endpoints - let them handle their own errors
    const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                           requestUrl.includes('/auth/register') ||
                           requestUrl.includes('/auth/oauth/callback')
    // Don't auto-logout for permissions API (new OAuth users may not have permissions yet)
    const isPermissionsEndpoint = requestUrl.includes('/permissions/users/me') || 
                                   requestUrl.includes('/auth/me/permissions')
    // Don't auto-logout for user profile endpoint - it's optional and failure shouldn't logout user
    const isUserProfileEndpoint = requestUrl.includes('/auth/api/users/')
    
    // For user profile endpoint, suppress error logging (it's optional)
    if (status === 401 && isUserProfileEndpoint) {
      // Silently fail - mark as handled to prevent console logging
      err.isHandled = true
      err.silent = true
      // Create a custom error that won't be logged
      const silentError = new Error('User profile fetch failed (silent)')
      silentError.response = err.response
      silentError.config = err.config
      silentError.isAxiosError = true
      silentError.silent = true
      return Promise.reject(silentError)
    }
    
    if (status === 401 && !isAuthEndpoint && !isPermissionsEndpoint && !isUserProfileEndpoint) {
      // Normal 401 - clear immediately
      try { 
        authStorage?.clearAll?.() 
      } catch (e) {
        console.error('Error clearing auth storage:', e)
      }
      if (!location.pathname.startsWith('/auth')) {
        location.href = '/auth/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

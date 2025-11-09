const TOKEN_KEY = 'portal:access_token'
const USER_KEY  = 'portal:user'
const USER_ID_KEY = 'portal:user_id'
const PERM_ETAG_KEY  = 'portal:perm_etag'
const PERM_CACHE_KEY = 'portal:perm_cache'
const TENANT_LOGO_KEY = 'portal:tenant_logo'
const SESSION_TIMEOUT_KEY = 'portal:session_timeout_minutes'
const SESSION_START_TIME_KEY = 'portal:session_start_time'

const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken:  (t) => localStorage.setItem(TOKEN_KEY, t),
  clearToken:() => localStorage.removeItem(TOKEN_KEY),

  getUser: () => { try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null } },
  setUser: (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clearUser: () => localStorage.removeItem(USER_KEY),

  // OAuth helpers
  getUserId: () => localStorage.getItem(USER_ID_KEY),
  setUserId: (id) => localStorage.setItem(USER_ID_KEY, id),
  clearUserId: () => localStorage.removeItem(USER_ID_KEY),

  getPermsEtag: () => localStorage.getItem(PERM_ETAG_KEY),
  setPermsEtag: (e) => localStorage.setItem(PERM_ETAG_KEY, e),
  clearPermsEtag: () => localStorage.removeItem(PERM_ETAG_KEY),

  getPermsCache: () => { try { return JSON.parse(localStorage.getItem(PERM_CACHE_KEY)) } catch { return null } },
  setPermsCache: (d) => localStorage.setItem(PERM_CACHE_KEY, JSON.stringify(d)),
  clearPermsCache: () => localStorage.removeItem(PERM_CACHE_KEY),

  // Tenant Logo
  getTenantLogo: () => localStorage.getItem(TENANT_LOGO_KEY),
  setTenantLogo: (logo) => {
    if (logo) {
      localStorage.setItem(TENANT_LOGO_KEY, logo)
    } else {
      localStorage.removeItem(TENANT_LOGO_KEY)
    }
  },
  clearTenantLogo: () => localStorage.removeItem(TENANT_LOGO_KEY),

  // Session Timeout
  getSessionTimeoutMinutes: () => {
    const timeout = localStorage.getItem(SESSION_TIMEOUT_KEY)
    return timeout ? Number(timeout) : 30
  },
  setSessionTimeoutMinutes: (minutes) => {
    if (minutes) {
      localStorage.setItem(SESSION_TIMEOUT_KEY, String(minutes))
    }
  },
  clearSessionTimeout: () => localStorage.removeItem(SESSION_TIMEOUT_KEY),

  // Session Start Time (for tracking idle time)
  getSessionStartTime: () => {
    const time = localStorage.getItem(SESSION_START_TIME_KEY)
    return time ? Number(time) : null
  },
  setSessionStartTime: (time) => localStorage.setItem(SESSION_START_TIME_KEY, String(time)),
  clearSessionStartTime: () => localStorage.removeItem(SESSION_START_TIME_KEY),

  // Check if session has expired
  isSessionExpired: () => {
    const startTime = authStorage.getSessionStartTime()
    const timeoutMinutes = authStorage.getSessionTimeoutMinutes()
    if (!startTime || !timeoutMinutes) return false

    const now = Date.now()
    const elapsedMinutes = (now - startTime) / (1000 * 60)
    return elapsedMinutes >= timeoutMinutes
  },

  // Convenience method for OAuth callback to store permissions directly
  setPermissions: (permissions) => {
    authStorage.setPermsCache(permissions)
    // Optionally set ETag if available
    if (permissions?.etag) {
      authStorage.setPermsEtag(permissions.etag)
    }
  },

  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(PERM_ETAG_KEY)
    localStorage.removeItem(PERM_CACHE_KEY)
    localStorage.removeItem(TENANT_LOGO_KEY)
    localStorage.removeItem(SESSION_TIMEOUT_KEY)
    localStorage.removeItem(SESSION_START_TIME_KEY)
  }
}

export { authStorage }
export default authStorage

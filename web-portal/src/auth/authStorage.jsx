const TOKEN_KEY = 'portal:access_token'
const USER_KEY  = 'portal:user'
const USER_ID_KEY = 'portal:user_id'
const PERM_ETAG_KEY  = 'portal:perm_etag'
const PERM_CACHE_KEY = 'portal:perm_cache'

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
  }
}

export { authStorage }
export default authStorage

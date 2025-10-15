const TOKEN_KEY = 'portal:access_token'
const USER_KEY  = 'portal:user'
const PERM_ETAG_KEY  = 'portal:perm_etag'
const PERM_CACHE_KEY = 'portal:perm_cache'

const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken:  (t) => localStorage.setItem(TOKEN_KEY, t),
  clearToken:() => localStorage.removeItem(TOKEN_KEY),

  getUser: () => { try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null } },
  setUser: (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clearUser: () => localStorage.removeItem(USER_KEY),

  getPermsEtag: () => localStorage.getItem(PERM_ETAG_KEY),
  setPermsEtag: (e) => localStorage.setItem(PERM_ETAG_KEY, e),
  clearPermsEtag: () => localStorage.removeItem(PERM_ETAG_KEY),

  getPermsCache: () => { try { return JSON.parse(localStorage.getItem(PERM_CACHE_KEY)) } catch { return null } },
  setPermsCache: (d) => localStorage.setItem(PERM_CACHE_KEY, JSON.stringify(d)),
  clearPermsCache: () => localStorage.removeItem(PERM_CACHE_KEY),

  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PERM_ETAG_KEY)
    localStorage.removeItem(PERM_CACHE_KEY)
  }
}

export { authStorage }
export default authStorage

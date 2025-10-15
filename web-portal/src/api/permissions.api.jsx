import { api } from '../shared/lib/axios'
import authStorage from '../auth/authStorage'

// GET /auth/me/permissions with ETag support.
// Returns data; on 304 returns cached copy (or empty fallback).
export async function fetchMyPermissions({ force = false } = {}) {
  const res = await api.get('/auth/me/permissions', {
    params: { force },
    // Accept 200/304 as success
    validateStatus: s => [200, 304].includes(s)
  })

  if (res.status === 304) {
    return authStorage.getPermsCache() ?? { systems: [] }
  }

  // 200 OK
  const etag = res.headers?.etag
  if (etag) authStorage.setPermsEtag(etag)
  if (res.data) authStorage.setPermsCache(res.data)
  return res.data
}

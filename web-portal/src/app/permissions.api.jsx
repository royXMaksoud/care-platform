import { api } from '@/lib/axios'

// GET /auth/me/permissions (ETag supported if your axios instance adds If-None-Match)
export async function fetchMyPermissions({ force = false } = {}) {
  const res = await api.get('/auth/me/permissions', {
    params: { force },
    validateStatus: s => [200, 304].includes(s),
  })
  if (res.status === 304) {
    const cached = localStorage.getItem('portal:perm_cache')
    return cached ? JSON.parse(cached) : { systems: [] }
  }
  if (res.headers?.etag) localStorage.setItem('portal:perm_etag', res.headers.etag)
  localStorage.setItem('portal:perm_cache', JSON.stringify(res.data))
  return res.data
}

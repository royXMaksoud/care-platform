import { api } from '@/lib/axios'
import type { FilterMeta } from './types'

// cache in-memory per tab
const cache = new Map<string, { etag?: string; meta: FilterMeta }>()

export async function fetchMeta(resourceBase: string): Promise<FilterMeta> {
  const key = `meta:${resourceBase}`
  const cached = cache.get(key)

  const headers: Record<string, string> = {}
  if (cached?.etag) headers['If-None-Match'] = cached.etag

  const res = await api.get(`${resourceBase}/meta`, { headers, validateStatus: () => true })
  if (res.status === 304 && cached) return cached.meta

  if (res.status >= 200 && res.status < 300) {
    const etag = res.headers?.etag
    const meta = res.data as FilterMeta
    cache.set(key, { etag, meta })
    return meta
  }
  throw new Error(`Failed to load meta for ${resourceBase}`)
}

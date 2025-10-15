import { api } from '@/lib/axios'
import { API_GATEWAY, SERVICES, joinPaths } from '@/config/services'


export function buildBase(service: string, base: string) {
  const prefix = SERVICES[service] ?? ''
  // مثال: /access + /api/systems  => /access/api/systems
  return joinPaths(prefix, base)
}


export const http = {
  get: (service: string, base: string, path = '', config?: any) =>
    api.get(buildBase(service, joinPaths(base, path)), config),

  post: (service: string, base: string, path = '', body?: any, config?: any) =>
    api.post(buildBase(service, joinPaths(base, path)), body, config),

  put: (service: string, base: string, path = '', body?: any, config?: any) =>
    api.put(buildBase(service, joinPaths(base, path)), body, config),

  del: (service: string, base: string, path = '', config?: any) =>
    api.delete(buildBase(service, joinPaths(base, path)), config),
}

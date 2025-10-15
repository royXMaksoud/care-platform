
export const API_GATEWAY = import.meta.env.VITE_API_URL ?? 'http://localhost:6060'


export const SERVICES: Record<string, string> = {
  access: '/access',
  appointments: '/appointments',
  complaints: '/complaints',
//add more services 
}


export function joinPaths(...parts: string[]) {
  return '/' + parts
    .map(p => (p ?? '').toString().trim())
    .filter(Boolean)
    .map(p => p.replace(/^\/+|\/+$/g, ''))
    .join('/')
}

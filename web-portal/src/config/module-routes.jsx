// src/config/module-routes.js
// Map well-known systems to fixed paths; fallback uses a slug of the name.

const MAP = new Map([
  ['home', '/home'],
['cms', '/cms'],                       // 
 ['content-management-system', '/cms'],   
  ['content management system', '/cms'],   // 
  ['content-management-system', '/cms'],
             

  ['appointment', '/appointment'],
  ['appointments', '/appointment'],
  ['appointment-service', '/appointment'],
  ['appointment management', '/appointment'],
  ['reference data', '/reference-data'],
  ['complaints', '/complaints'],
  ['files', '/files'],
  ['chatbot', '/chatbot'],
  ['notifications', '/notifications'],
  ['reporting', '/reporting'],
  
  ['finance', '/finance'],
  ['access', '/access'],
  
  // Data Analysis Service
  ['das', '/das'],
  ['data-analysis-service', '/das'],
  ['data analysis service', '/das'],
])


export function resolveModulePath(system) {
  const raw =
    (system?.code || system?.name || '')
      .toString()
      .trim()
      .toLowerCase()

  const slug = slugify(raw)

  if (MAP.has(raw)) return MAP.get(raw)
  if (MAP.has(slug)) return MAP.get(slug)
  return '/' + slug
}

function slugify(s) {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

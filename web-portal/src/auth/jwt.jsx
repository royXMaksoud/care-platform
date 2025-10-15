// Decode payload safely (no verification)
export function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const json = atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch { return null }
}

// Helper: find the first available claim by a list of keys
function pick(obj, keys, fallback = null) {
  if (!obj) return fallback
  for (const k of keys) if (obj[k] != null) return obj[k]
  return fallback
}

// Your JwtTokenProvider generates claims (typical):
// userId, email, type/userType/role, lang/language, sub, iat, exp ...
export function getUserIdFromToken(token) {
  const c = decodeJwt(token)
  return pick(c, ['userId', 'uid', 'id', 'sub'], null)
}

export function getUserTypeFromToken(token) {
  const c = decodeJwt(token)
  return pick(c, ['userType', 'type', 'role', 'roles'], null)
}

export function getEmailFromToken(token) {
  const c = decodeJwt(token)
  return pick(c, ['email', 'mail', 'preferred_username', 'upn'], null)
}

export function getLangFromToken(token) {
  const c = decodeJwt(token)
  return pick(c, ['lang', 'language', 'locale'], 'en')
}

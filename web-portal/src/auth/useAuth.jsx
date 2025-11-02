import { useMemo, useState } from 'react'
import authStorage from './authStorage'
import { loginApi, registerApi } from './authApi'
import { decodeJwt, getUserIdFromToken, getUserTypeFromToken, getEmailFromToken, getLangFromToken } from './jwt'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const token = authStorage.getToken()
  const claims = token ? decodeJwt(token) : null

  const isAuthenticated = useMemo(() => Boolean(token), [token])

  async function login(email, password, language = 'en') {
    setLoading(true)
    try {
      const { token } = await loginApi(email, password, language)
      if (!token) throw new Error('No token in response')
      authStorage.setToken(token)

      // Optional: you can pre-read claims and store a lightweight user object
      const user = {
        id: getUserIdFromToken(token),
        type: getUserTypeFromToken(token),
        email: getEmailFromToken(token),
        lang: getLangFromToken(token),
      }
      authStorage.setUser(user)

      // Go home (ProtectedRoute will allow)
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  async function register(firstName, fatherName, surname, fullName, email, password, confirmPassword, language = 'en') {
    setLoading(true)
    try {
      const { token } = await registerApi(firstName, fatherName, surname, fullName, email, password, confirmPassword, language)
      if (!token) throw new Error('No token in response')
      authStorage.setToken(token)

      const user = {
        id: getUserIdFromToken(token),
        type: getUserTypeFromToken(token),
        email: getEmailFromToken(token),
        lang: getLangFromToken(token),
      }
      authStorage.setUser(user)

      // Go home after registration
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    authStorage.clearAll()
    // Clear session storage to force fresh permissions on next login
    sessionStorage.removeItem('perms_loaded')
    sessionStorage.clear()
    window.location.href = '/auth/login'
  }

  return { loading, isAuthenticated, login, register, logout, token, claims }
}

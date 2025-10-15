import { Navigate } from 'react-router-dom'
import { authStorage } from './authStorage'

export default function ProtectedRoute({ children }) {
  const hasToken = !!authStorage.getToken()
  if (!hasToken) return <Navigate to="/auth/login" replace />
  return children
}

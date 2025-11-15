// main.jsx — wire BrowserRouter + Protected routes
// Why: Everything under "/" is private; "/auth/login" is public.

import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/datatable-scroll.css' // DataTable scroll fixes
import './i18n/config' // i18n configuration
import 'leaflet/dist/leaflet.css' // Leaflet map styles


import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import App from './app/App.jsx'
import Login from './auth/Login.jsx'
import OAuthCallback from './auth/OAuthCallback.jsx'
import NewUserWelcome from './auth/NewUserWelcome.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import { PermissionsProvider } from './contexts/PermissionsContext'
import { AppearanceProvider } from './contexts/AppearanceContext'

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } })

ReactDOM.createRoot(document.getElementById('root')).render(
  // ✅ StrictMode removed to prevent double API calls in development
  // <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <PermissionsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth/login" element={<Login />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/welcome" element={<ProtectedRoute><NewUserWelcome /></ProtectedRoute>} />
              <Route path="/*" element={<ProtectedRoute><App /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-center" />
        </PermissionsProvider>
      </AppearanceProvider>
    </QueryClientProvider>
  // </React.StrictMode>
)

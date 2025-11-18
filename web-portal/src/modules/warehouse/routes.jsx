/**
 * Warehouse Module Routes
 *
 * Defines all routes for the warehouse module.
 * Routes are protected by authentication and permissions.
 *
 * @author CARE Team
 */

import React, { useEffect } from 'react'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import { registerModuleTranslations } from '@/i18n/moduleLoader'
import WarehouseErrorBoundary from './components/WarehouseErrorBoundary'
import WarehouseDashboardPage from './pages/WarehouseDashboardPage'
import WarehouseListPage from './pages/warehouses/WarehouseListPage'
import ZoneListPage from './pages/zones/ZoneListPage'
import BinListPage from './pages/bins/BinListPage'
import InterfacesPage from './pages/InterfacesPage'

// Import translation files
import enTranslations from './i18n/en.json'
import arTranslations from './i18n/ar.json'
import deTranslations from './i18n/de.json'

/**
 * Warehouse module routes
 *
 * All routes are prefixed with /warehouse or /warehouse-management-system
 */
export default function WarehouseRoutes() {
  const location = useLocation()
  const basePath = location.pathname.split('/').slice(0, 2).join('/')

  // Register warehouse module translations
  useEffect(() => {
    registerModuleTranslations('warehouse', {
      en: enTranslations,
      ar: arTranslations,
      de: deTranslations,
    })
  }, [])

  // If accessing from /warehouse-management-system, show interfaces page by default
  const isManagementSystemPath = basePath === '/warehouse-management-system'

  return (
    <WarehouseErrorBoundary>
      <Routes>
        {/* Interfaces / Available Pages */}
        <Route path="/interfaces" element={<InterfacesPage />} />

        {/* Dashboard */}
        <Route
          path="/"
          element={
            isManagementSystemPath ? (
              <Navigate to={`${basePath}/interfaces`} replace />
            ) : (
              <WarehouseDashboardPage />
            )
          }
        />
        <Route path="/dashboard" element={<WarehouseDashboardPage />} />

        {/* Warehouses */}
        <Route path="/warehouses" element={<WarehouseListPage />} />
        {/* TODO: Add warehouse detail page */}
        {/* <Route path="/warehouses/:id" element={<WarehouseDetailsPage />} /> */}

        {/* Zones */}
        <Route path="/zones" element={<ZoneListPage />} />
        {/* TODO: Add zone detail page */}
        {/* <Route path="/zones/:id" element={<ZoneDetailsPage />} /> */}

        {/* Bins */}
        <Route path="/bins" element={<BinListPage />} />
        {/* TODO: Add bin detail page */}
        {/* <Route path="/bins/:id" element={<BinDetailsPage />} /> */}

        {/* TODO: Add more routes as components are created */}
        {/* Materials */}
        {/* <Route path="/materials" element={<MaterialListPage />} /> */}
        {/* <Route path="/materials/:id" element={<MaterialDetailsPage />} /> */}

        {/* Orders */}
        {/* <Route path="/orders" element={<OrderListPage />} /> */}
        {/* <Route path="/orders/:id" element={<OrderDetailsPage />} /> */}

        {/* Reports */}
        {/* <Route path="/reports" element={<ReportsPage />} /> */}

        {/* Custom Fields */}
        {/* <Route path="/custom-fields" element={<CustomFieldDefinitionsPage />} /> */}
      </Routes>
    </WarehouseErrorBoundary>
  )
}

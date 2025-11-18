/**
 * Warehouse Module Entry Point
 * 
 * Exports all public components, pages, and utilities for the warehouse module.
 * 
 * @author CARE Team
 */

// Pages
export { default as WarehouseDashboardPage } from './pages/WarehouseDashboardPage'
export { default as WarehouseListPage } from './pages/warehouses/WarehouseListPage'

// Components
export { default as EmptyState } from './components/EmptyState'
export { default as SkeletonTable } from './components/SkeletonTable'
export { default as SkeletonCard } from './components/SkeletonCard'
export { default as AuditInfo } from './components/AuditInfo'
export { default as WarehouseErrorBoundary } from './components/WarehouseErrorBoundary'

// Hooks
export { useFeatureFlag, useTenantLicense } from './hooks/useFeatureFlag'

// API
export * from './api'

// Types
export * from './types'

// Utils
export * from './utils/exportToExcel'


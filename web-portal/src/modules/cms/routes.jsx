// src/modules/cms/pages/CMSRoutes.jsx
import { Routes, Route } from 'react-router-dom'
import React, { Suspense, lazy } from 'react'

import CMSHome from './pages/Home'
import SystemsList from './pages/systems/SystemList'
import SectionsList from './pages/sections/SectionsList'
import ActionsList from './pages/actions/SectionActionList'
import TenantsList from './pages/tenants/TenantList'
import TenantDetails from './pages/tenants/TenantDetails'
import UsersList from './pages/users/UserList'
import CodeTablesList from './pages/codeTable/CodeTableList'
import CodeTableDetail from './pages/codeTable/CodeTableDetail'
import AuditLogList from './pages/auditlog/AuditLogList'

// 👇 lazy load
const UserDetail = lazy(() => import('./pages/users/UserDetail'))

export const basePath = '/cms'

export default function CMSRoutes() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <Routes>
        <Route index element={<CMSHome />} />
        <Route path="systems" element={<SystemsList />} />
        <Route path="sections" element={<SectionsList />} />
        <Route path="actions" element={<ActionsList />} />
        
        {/* Tenants Routes */}
        <Route path="tenants" element={<TenantsList />} />
        <Route path="tenants/:tenantId" element={<TenantDetails />} />

        {/* Users Routes */}
        <Route path="users" element={<UsersList />} />
        <Route path="users/:userId" element={<UserDetail />} />

        {/* Code Tables Routes */}
        <Route path="codeTable" element={<CodeTablesList />} />
        <Route path="codeTable/:codeTableId" element={<CodeTableDetail />} />

        {/* Audit Log Route */}
        <Route path="auditLog" element={<AuditLogList />} />
      </Routes>
    </Suspense>
  )
}

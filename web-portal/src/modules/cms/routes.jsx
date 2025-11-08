// src/modules/cms/pages/CMSRoutes.jsx
import { Routes, Route } from 'react-router-dom'
import React, { Suspense, lazy } from 'react'

import CMSHome from './pages/Home'
import SystemsList from './pages/systems/SystemList'
import SystemDetails from './pages/systems/SystemDetails'
import SectionsList from './pages/sections/SectionsList'
import ActionsList from './pages/actions/SectionActionList'
import TenantsList from './pages/tenants/TenantList'
import TenantDetails from './pages/tenants/TenantDetails'
import UsersList from './pages/users/UserList'
import CodeTablesList from './pages/codeTable/CodeTableList'
import CodeTableDetail from './pages/codeTable/CodeTableDetail'
import CountryList from './pages/codeCountry/CountryList'
import CountryDetails from './pages/codeCountry/CountryDetails'
import CodeOrganizationList from './pages/codeOrganization/OrganizationList'
import CodeOrganizationDetails from './pages/codeOrganization/OrganizationDetails'
import OrganizationList from './pages/organization/OrganizationList'
import OrganizationDetails from './pages/organization/OrganizationDetails'
import OrganizationBranchList from './pages/organizationBranch/OrganizationBranchList'
import OrganizationBranchDetails from './pages/organizationBranch/OrganizationBranchDetails'
import DutyStationList from './pages/dutyStation/DutyStationList'
import DutyStationDetails from './pages/dutyStation/DutyStationDetails'
import OperationList from './pages/operation/OperationList'
import OperationDetails from './pages/operation/OperationDetails'
import LocationList from './pages/location/LocationList'
import LocationDetails from './pages/location/LocationDetails'
import AuditLogList from './pages/auditlog/AuditLogList'
import SystemRolesList from './pages/users/SystemRolesList'
import SystemRoleDetails from './pages/users/SystemRoleDetails'
import TenantWizard from '../../pages/TenantWizard'

// 👇 lazy load
const UserDetail = lazy(() => import('./pages/users/UserDetail'))

export const basePath = '/cms'

export default function CMSRoutes() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <Routes>
        <Route index element={<CMSHome />} />
        <Route path="systems" element={<SystemsList />} />
        <Route path="systems/:systemId" element={<SystemDetails />} />
        <Route path="sections" element={<SectionsList />} />
        <Route path="actions" element={<ActionsList />} />
        
        {/* Tenants Routes */}
        <Route path="tenants" element={<TenantsList />} />
        <Route path="tenants/wizard" element={<TenantWizard />} />
        <Route path="tenants/:tenantId" element={<TenantDetails />} />

        {/* Users Routes */}
        <Route path="users" element={<UsersList />} />
        <Route path="users/:userId" element={<UserDetail />} />

        {/* Roles Routes */}
        <Route path="system-roles" element={<SystemRolesList />} />
        <Route path="system-roles/:systemRoleId" element={<SystemRoleDetails />} />

        {/* Code Tables Routes */}
        <Route path="codeTable" element={<CodeTablesList />} />
        <Route path="codeTable/:codeTableId" element={<CodeTableDetail />} />

        {/* Code Countries Routes */}
        <Route path="codeCountry" element={<CountryList />} />
        <Route path="codeCountry/:countryId" element={<CountryDetails />} />

        {/* Code Organizations Routes (Code Table) */}
        <Route path="codeOrganizations" element={<CodeOrganizationList />} />
        <Route path="codeOrganizations/:organizationId" element={<CodeOrganizationDetails />} />

        {/* Organizations Routes (Main Entity) */}
        <Route path="organizations" element={<OrganizationList />} />
        <Route path="organizations/:organizationId" element={<OrganizationDetails />} />

        {/* Organization Branches Routes */}
        <Route path="organization-branches" element={<OrganizationBranchList />} />
        <Route path="organization-branches/:organizationBranchId" element={<OrganizationBranchDetails />} />
        
        {/* Duty Stations Routes */}
        <Route path="duty-stations" element={<DutyStationList />} />
        <Route path="duty-stations/:dutyStationId" element={<DutyStationDetails />} />

        {/* Operations Routes */}
        <Route path="operations" element={<OperationList />} />
        <Route path="operations/:id" element={<OperationDetails />} />

        {/* Locations Routes */}
        <Route path="location" element={<LocationList />} />
        <Route path="location/:locationId" element={<LocationDetails />} />

        {/* Audit Log Route */}
        <Route path="auditLog" element={<AuditLogList />} />
      </Routes>
    </Suspense>
  )
}

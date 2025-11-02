// src/modules/appointment/routes.jsx
// Appointment Module Routes

import { Routes, Route } from 'react-router-dom'
import React, { Suspense } from 'react'

// Import pages
import AppointmentHome from './pages/Home'
import ScheduleList from './pages/schedule/ScheduleList'
import HolidayList from './pages/holiday/HolidayList'
import ServiceTypeList from './pages/serviceType/ServiceTypeList'
import ActionTypeList from './pages/actionType/ActionTypeList'
import BeneficiaryList from './pages/beneficiary/BeneficiaryList'
import BeneficiaryDetails from './pages/beneficiary/BeneficiaryDetails'
import BeneficiaryStatistics from './pages/beneficiary/BeneficiaryStatistics'
import BeneficiaryBulkUpdate from './pages/beneficiary/BeneficiaryBulkUpdate'
import AppointmentList from './pages/appointments/AppointmentList'
import AppointmentDetails from './pages/appointments/AppointmentDetails'

export const basePath = '/appointment'

export default function AppointmentRoutes() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <Routes>
        <Route index element={<AppointmentHome />} />
        
        {/* Schedule Management */}
        <Route path="schedules" element={<ScheduleList />} />
        
        {/* Holiday Management */}
        <Route path="holidays" element={<HolidayList />} />
        
        {/* ServiceType Management */}
        <Route path="service-types" element={<ServiceTypeList />} />
        
        {/* ActionType Management */}
        <Route path="action-types" element={<ActionTypeList />} />
        
        {/* Beneficiary Management */}
        <Route path="beneficiaries" element={<BeneficiaryList />} />
        <Route path="beneficiaries/statistics" element={<BeneficiaryStatistics />} />
        <Route path="beneficiaries/bulk-update" element={<BeneficiaryBulkUpdate />} />
        <Route path="beneficiaries/:beneficiaryId" element={<BeneficiaryDetails />} />
        
        {/* Appointment Management */}
        <Route path="appointments" element={<AppointmentList />} />
        <Route path="appointments/:appointmentId" element={<AppointmentDetails />} />
      </Routes>
    </Suspense>
  )
}


import React, { useState, useEffect } from 'react'
import CrudPage from '@/features/crud/CrudPage'
import ScheduleFormModal from './ScheduleFormModal'
import ScheduleCalendar from './ScheduleCalendar'
import { api } from '@/lib/axios'
import { Clock, Calendar, List } from 'lucide-react'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'
import { SYSTEM_SECTIONS } from '@/config/systemSectionConstants'
import { useSystemSectionScopes } from '@/modules/appointment/hooks/useSystemSectionScopes'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export default function ScheduleList() {
  // Use state-only tabs (no navigation) to prevent unmount/remount issues
  const [activeTab, setActiveTab] = useState('list')
  const [branchesMap, setBranchesMap] = useState({})
  const [fixedFilters, setFixedFilters] = useState([])  // Branch filter for POST body
  const [isReady, setIsReady] = useState(false)

  // Current UI language; fallback to 'en'
  const uiLang = (typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ar')) ? 'ar' : 'en'

  // Get scopeValueIds from APPOINTMENT_SCHEDULING section only
  const { scopeValueIds, isLoading: isLoadingScopes, error: scopesError } = useSystemSectionScopes(SYSTEM_SECTIONS.APPOINTMENT_SCHEDULING)

  // Load branches map for display in table
  useEffect(() => {
    const loadBranchesMap = async () => {
      try {
        // Load all organization branches to populate the map
        const res = await api.post('/access/api/organization-branches/filter', {
          criteria: []
        }, {
          params: {
            page: 0,
            size: 10000,
            lang: uiLang
          }
        })

        const branches = res?.data?.content || []
        const map = {}
        branches.forEach(branch => {
          if (branch.organizationBranchId) {
            map[branch.organizationBranchId] = branch.name || branch.code || 'Unknown'
          }
        })
        setBranchesMap(map)
      } catch (err) {
        console.error('Error loading branches map:', err)
      }
    }

    loadBranchesMap()
  }, [uiLang])

  // Update fixed filters when scopes are loaded
  useEffect(() => {
    if (scopeValueIds && scopeValueIds.length > 0) {
      // Send branch IDs as fixed filter in POST body (will be merged with user filters)
      setFixedFilters([
        {
          key: 'organizationBranchId',
          operator: 'IN',
          value: scopeValueIds,
          dataType: 'UUID'
        }
      ])
    } else {
      setFixedFilters([])
    }

    // Mark as ready once we've processed scopes
    setIsReady(true)
  }, [scopeValueIds])

  const scheduleColumns = [
    {
      id: 'organizationBranchId',
      accessorKey: 'organizationBranchId',
      header: 'Center/Branch',
      cell: ({ getValue }) => {
        const branchId = getValue()
        return branchesMap[branchId] || branchId || '-'
      },
      meta: { 
        type: 'string', 
        filterKey: 'organizationBranchId', 
        operators: ['EQUAL', 'IN'] 
      },
    },
    {
      id: 'dayOfWeek',
      accessorKey: 'dayOfWeek',
      header: 'Day of Week',
      cell: ({ getValue }) => {
        const day = getValue()
        if (day === null || day === undefined) return '-'
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{DAY_NAMES[day]}</span>
            <span className="text-xs text-gray-500">({DAY_NAMES_AR[day]})</span>
          </div>
        )
      },
      meta: { 
        type: 'number', 
        filterKey: 'dayOfWeek', 
        operators: ['EQUAL', 'IN'],
        enumValues: [
          { value: 0, label: 'Sunday' },
          { value: 1, label: 'Monday' },
          { value: 2, label: 'Tuesday' },
          { value: 3, label: 'Wednesday' },
          { value: 4, label: 'Thursday' },
          { value: 5, label: 'Friday' },
          { value: 6, label: 'Saturday' },
        ]
      },
    },
    {
      id: 'startTime',
      accessorKey: 'startTime',
      header: 'Start Time',
      cell: ({ getValue }) => {
        const time = getValue()
        return time ? (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-mono">{time}</span>
          </div>
        ) : '-'
      },
      meta: { type: 'string', filterKey: 'startTime', operators: ['EQUAL', 'GREATER_THAN', 'LESS_THAN'] },
    },
    {
      id: 'endTime',
      accessorKey: 'endTime',
      header: 'End Time',
      cell: ({ getValue }) => {
        const time = getValue()
        return time ? (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-mono">{time}</span>
          </div>
        ) : '-'
      },
      meta: { type: 'string', filterKey: 'endTime', operators: ['EQUAL', 'GREATER_THAN', 'LESS_THAN'] },
    },
    {
      id: 'slotDurationMinutes',
      accessorKey: 'slotDurationMinutes',
      header: 'Slot Duration',
      cell: ({ getValue }) => {
        const duration = getValue()
        return duration ? (
          <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
            {duration} min
          </span>
        ) : '-'
      },
      meta: { type: 'number', filterKey: 'slotDurationMinutes', operators: ['EQUAL', 'IN'] },
    },
    {
      id: 'maxCapacityPerSlot',
      accessorKey: 'maxCapacityPerSlot',
      header: 'Capacity/Slot',
      cell: ({ getValue }) => {
        const capacity = getValue()
        return capacity ? (
          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
            {capacity} Person
          </span>
        ) : '-'
      },
      meta: { type: 'number', filterKey: 'maxCapacityPerSlot', operators: ['EQUAL', 'GREATER_THAN', 'LESS_THAN'] },
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          getValue() 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {getValue() ? 'Active' : 'Inactive'}
        </span>
      ),
      meta: { type: 'boolean', filterKey: 'isActive', operators: ['EQUAL'] },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ getValue }) => {
        const date = getValue()
        return date ? new Date(date).toLocaleDateString() : '-'
      },
      meta: { type: 'date', filterKey: 'createdAt', operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'] },
    },
  ]


  const handleTabChange = (tab) => {
    if (tab === activeTab) {
      return
    }
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb />
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Clock className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
              <p className="text-sm text-gray-600">Manage weekly schedules and holidays for centers</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-1">
          <div className="flex gap-2">
            <button
              onClick={() => handleTabChange('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-4 w-4" />
              List View
            </button>
            <button
              onClick={() => handleTabChange('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Calendar View
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'list' ? (
          <div className="h-screen flex flex-col overflow-hidden">
            {isReady ? (
              <CrudPage
                title="Weekly Schedules"
                service="appointment"
                resourceBase="/api/admin/schedules"
                idKey="scheduleId"
                columns={scheduleColumns}
                pageSize={20}
                enableCreate={true}
                enableEdit={true}
                enableDelete={true}
                tableId="schedules-list"
                fixedFilters={fixedFilters}
                renderCreate={({ open, onClose, onSuccess }) => (
                  <ScheduleFormModal
                    open={open}
                    mode="create"
                    onClose={onClose}
                    onSuccess={onSuccess}
                  />
                )}
                renderEdit={({ open, initial, onClose, onSuccess }) => (
                  <ScheduleFormModal
                    open={open}
                    mode="edit"
                    initial={initial}
                    onClose={onClose}
                    onSuccess={onSuccess}
                  />
                )}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Loading permissions...
              </div>
            )}
          </div>
        ) : (
          <div key="schedule-calendar-wrapper" className="schedule-calendar-container">
            <ScheduleCalendar />
          </div>
        )}
      </div>
    </div>
  )
}


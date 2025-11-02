import React, { useState, useEffect, useMemo } from 'react'
import CrudPage from '@/features/crud/CrudPage'
import HolidayFormModal from './HolidayFormModal'
import HolidayCalendar from './HolidayCalendar'
import { api } from '@/lib/axios'
import { CalendarCheck, Calendar, RefreshCw, List } from 'lucide-react'

export default function HolidayList() {
  // Use state-only tabs (no navigation) to prevent unmount/remount issues
  const [activeTab, setActiveTab] = useState('list')
  const [branchesMap, setBranchesMap] = useState({})

  // Load branches for lookup using filter endpoint (lookup endpoint causes UUID error)
  useEffect(() => {
    const loadBranches = async () => {
      try {
        // Use filter endpoint instead of lookup to avoid UUID conversion error
        const response = await api.post('/access/api/organization-branches/filter', {
          criteria: []
        }, { params: { page: 0, size: 1000 } })
        
        const map = {}
        const branches = response.data?.content || []
        branches.forEach((branch) => {
          if (branch?.organizationBranchId && branch?.name) {
            map[branch.organizationBranchId] = branch.name
          }
        })
        
        console.log('Loaded branches map:', Object.keys(map).length, 'branches')
        setBranchesMap(map)
      } catch (err) {
        console.error('Failed to load branches:', err)
      }
    }
    loadBranches()
  }, [])

  // Memoize columns to update when branchesMap changes
  const holidayColumns = useMemo(() => [
    {
      id: 'organizationBranchId',
      accessorKey: 'organizationBranchId',
      header: 'Center/Branch',
      cell: ({ getValue }) => {
        const branchId = getValue()
        const branchName = branchesMap[branchId]
        if (branchName) {
          return (
            <span className="font-medium text-gray-900">
              {branchName}
            </span>
          )
        }
        // Show ID as fallback if name not loaded yet
        return branchId ? (
          <span className="text-xs text-gray-500 font-mono">
            {branchId}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      },
      meta: { 
        type: 'string', 
        filterKey: 'organizationBranchId', 
        operators: ['EQUAL', 'IN'] 
      },
    },
    {
      id: 'holidayDate',
      accessorKey: 'holidayDate',
      header: 'Holiday Date',
      cell: ({ getValue }) => {
        const date = getValue()
        if (!date) return '-'
        const d = new Date(date + 'T00:00:00')
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{d.toLocaleDateString('en-GB')}</span>
          </div>
        )
      },
      meta: { 
        type: 'date', 
        filterKey: 'holidayDate', 
        operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'] 
      },
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Holiday Name',
      cell: ({ getValue }) => {
        const name = getValue()
        return (
          <span className="font-medium text-gray-900">
            {name || '-'}
          </span>
        )
      },
      meta: { 
        type: 'string', 
        filterKey: 'name', 
        operators: ['LIKE', 'EQUAL', 'STARTS_WITH'] 
      },
    },
    {
      id: 'reason',
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ getValue }) => {
        const reason = getValue()
        if (!reason) return '-'
        return (
          <span className="text-sm text-gray-600 line-clamp-2">
            {reason}
          </span>
        )
      },
      meta: { type: 'string', filterKey: 'reason', operators: ['LIKE'] },
    },
    {
      id: 'isRecurringYearly',
      accessorKey: 'isRecurringYearly',
      header: 'Recurring',
      cell: ({ getValue }) => {
        const recurring = getValue()
        return recurring ? (
          <div className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3 text-purple-600" />
            <span className="text-xs font-semibold text-purple-600">Yearly</span>
          </div>
        ) : (
          <span className="text-xs text-gray-500">One-time</span>
        )
      },
      meta: { type: 'boolean', filterKey: 'isRecurringYearly', operators: ['EQUAL'] },
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
  ], [branchesMap]) // Re-create columns when branchesMap changes


  const handleTabChange = (tab) => {
    console.log('handleTabChange called, tab:', tab, 'current activeTab:', activeTab)
    if (tab === activeTab) {
      console.log('Tab unchanged, skipping update')
      return
    }
    console.log('Updating activeTab from', activeTab, 'to', tab)
    setActiveTab(tab)
    // Don't navigate - we're using the same route, just switching tabs
    // Navigation to non-existent route causes unmount/remount issues
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <CalendarCheck className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Holiday Management</h1>
              <p className="text-sm text-gray-600">Manage holidays and off-days for centers</p>
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
                  ? 'bg-green-500 text-white shadow-md'
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
                  ? 'bg-green-500 text-white shadow-md'
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
          <CrudPage
            title="Holidays & Off-Days"
            service="appointment-service"
            resourceBase="/api/admin/holidays"
            idKey="holidayId"
            columns={holidayColumns}
            pageSize={20}
            enableCreate={true}
            enableEdit={true}
            enableDelete={true}
            tableId="holidays-list"
            renderCreate={({ open, onClose, onSuccess }) => (
              <HolidayFormModal
                open={open}
                mode="create"
                onClose={onClose}
                onSuccess={onSuccess}
              />
            )}
            renderEdit={({ open, initial, onClose, onSuccess }) => (
              <HolidayFormModal
                open={open}
                mode="edit"
                initial={initial}
                onClose={onClose}
                onSuccess={onSuccess}
              />
            )}
          />
        ) : (
          <div key="holiday-calendar-wrapper" className="holiday-calendar-container">
            {console.log('Rendering HolidayCalendar wrapper, activeTab:', activeTab)}
            {activeTab === 'calendar' && <HolidayCalendar />}
          </div>
        )}
      </div>
    </div>
  )
}


import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import DataTable from '@/packages/datatable/DataTable'
import SearchableSelect from '@/components/SearchableSelect'
import { Calendar, Clock, User, Building, FileText, RefreshCw } from 'lucide-react'

export default function AppointmentList() {
  const navigate = useNavigate()
  const [branchesMap, setBranchesMap] = useState({})
  const [beneficiariesMap, setBeneficiariesMap] = useState({})
  const [serviceTypesMap, setServiceTypesMap] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [allOrganizationBranches, setAllOrganizationBranches] = useState([])
  const [authorizedBranchIds, setAuthorizedBranchIds] = useState([])
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null)
  const [selectedBranchId, setSelectedBranchId] = useState(null)
  const uiLang = (typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ar')) ? 'ar' : 'en'
  
  const handleRowClick = (row) => {
    navigate(`/appointment/appointments/${row.appointmentId}`)
  }

  // Load lookups
  useEffect(() => {
    let isActive = true
    const loadInitialData = async () => {
      setLoadingLookups(true)
      try {
        const [branchesRes, beneficiariesRes, servicesRes, permissionsRes] = await Promise.all([
          api.post(
            '/access/api/organization-branches/filter',
            { criteria: [] },
            {
              params: { page: 0, size: 10000, lang: uiLang },
            }
          ),
          api.get('/appointment-service/api/admin/beneficiaries/lookup'),
          api.get('/appointment-service/api/admin/service-types/lookup'),
          api.get('/auth/me/permissions'),
        ])

        if (!isActive) return

        const branchItems = branchesRes?.data?.content ?? []
        setAllOrganizationBranches(branchItems)

        const brMap = {}
        branchItems.forEach((b) => {
          if (b.organizationBranchId) {
            brMap[b.organizationBranchId] =
              b.name || b.organizationBranchName || b.code || 'Unknown branch'
          }
        })
        setBranchesMap(brMap)

        const benMap = {}
        ;(beneficiariesRes?.data ?? []).forEach((b) => {
          if (b.beneficiaryId) {
            benMap[b.beneficiaryId] = b.fullName || b.displayName || b.beneficiaryCode || b.beneficiaryId
          }
        })
        setBeneficiariesMap(benMap)

        const stMap = {}
        ;(servicesRes?.data ?? []).forEach((s) => {
          if (s.serviceTypeId) {
            stMap[s.serviceTypeId] = s.name || s.code || 'Service'
          }
        })
        setServiceTypesMap(stMap)

        const permissionsData = permissionsRes?.data
        const authorizedIds = new Set()
        if (permissionsData?.systems) {
          permissionsData.systems.forEach((system) => {
            system.sections?.forEach((section) => {
              section.actions?.forEach((action) => {
                action.scopes?.forEach((scope) => {
                  if (scope.effect === 'ALLOW' && scope.scopeValueId) {
                    authorizedIds.add(scope.scopeValueId)
                  }
                })
              })
            })
          })
        }
        setAuthorizedBranchIds(Array.from(authorizedIds))
      } catch (err) {
        if (isActive) {
          console.error('Failed to load lookups:', err)
          setAuthorizedBranchIds([])
        }
      } finally {
        if (isActive) {
          setLoadingLookups(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isActive = false
    }
  }, [uiLang])

  useEffect(() => {
    if (!selectedOrganizationId) return
    const exists = allOrganizationBranches.some(
      (item) => item.organizationId === selectedOrganizationId
    )
    if (!exists) {
      setSelectedOrganizationId(null)
      setSelectedBranchId(null)
    }
  }, [allOrganizationBranches, selectedOrganizationId])

  useEffect(() => {
    if (!selectedBranchId) return
    const exists = allOrganizationBranches.some(
      (item) => item.organizationBranchId === selectedBranchId
    )
    if (!exists) {
      setSelectedBranchId(null)
    }
  }, [allOrganizationBranches, selectedBranchId])

  const organizationOptions = useMemo(() => {
    const seen = new Set()
    return allOrganizationBranches.reduce((acc, item) => {
      if (!item?.organizationId || seen.has(item.organizationId)) {
        return acc
      }
      seen.add(item.organizationId)
      acc.push({
        value: item.organizationId,
        label: item.organizationName || item.organizationCode || 'Organization',
      })
      return acc
    }, [])
  }, [allOrganizationBranches])

  const branchOptions = useMemo(() => {
    return allOrganizationBranches
      .filter((item) => {
        if (selectedOrganizationId && item.organizationId !== selectedOrganizationId) {
          return false
        }
        if (authorizedBranchIds.length && !authorizedBranchIds.includes(item.organizationBranchId)) {
          return false
        }
        return true
      })
      .map((item) => ({
        value: item.organizationBranchId,
        label: item.name || item.organizationBranchName || 'Branch',
      }))
  }, [allOrganizationBranches, authorizedBranchIds, selectedOrganizationId])

  const baseFilters = useMemo(() => {
    if (!authorizedBranchIds.length) return []
    return [
      {
        key: 'organizationBranchId',
        operator: 'IN',
        value: authorizedBranchIds,
        dataType: 'UUID',
      },
    ]
  }, [authorizedBranchIds])

  const combinedFilters = useMemo(() => {
    const filters = [...baseFilters]
    if (selectedBranchId) {
      filters.push({
        key: 'organizationBranchId',
        operator: 'EQUAL',
        value: selectedBranchId,
        dataType: 'UUID',
      })
      return filters
    }

    if (selectedOrganizationId) {
      const branchIds = allOrganizationBranches
        .filter((item) => item.organizationId === selectedOrganizationId)
        .map((item) => item.organizationBranchId)
        .filter(Boolean)
      const unique = Array.from(new Set(branchIds))
      const allowed = authorizedBranchIds.length
        ? unique.filter((id) => authorizedBranchIds.includes(id))
        : unique
      if (allowed.length) {
        filters.push({
          key: 'organizationBranchId',
          operator: 'IN',
          value: allowed,
          dataType: 'UUID',
        })
      }
    }

    return filters
  }, [baseFilters, selectedBranchId, selectedOrganizationId, allOrganizationBranches, authorizedBranchIds])

  const appointmentColumns = [
    {
      id: 'appointmentDate',
      accessorKey: 'appointmentDate',
      header: 'Date',
      cell: ({ getValue }) => {
        const date = getValue()
        return date ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{new Date(date + 'T00:00:00').toLocaleDateString('en-GB')}</span>
          </div>
        ) : '-'
      },
      meta: { type: 'date', filterKey: 'appointmentDate', operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'] },
    },
    {
      id: 'appointmentTime',
      accessorKey: 'appointmentTime',
      header: 'Time',
      cell: ({ getValue }) => {
        const time = getValue()
        return time ? (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-mono text-sm">{time?.substring(0,5)}</span>
          </div>
        ) : '-'
      },
      meta: { type: 'string', filterKey: 'appointmentTime', operators: ['EQUAL', 'GREATER_THAN', 'LESS_THAN'] },
    },
    {
      id: 'beneficiaryId',
      accessorKey: 'beneficiaryId',
      header: 'Beneficiary',
      cell: ({ getValue }) => {
        const benId = getValue()
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{beneficiariesMap[benId] || benId || '-'}</span>
          </div>
        )
      },
      meta: { type: 'string', filterKey: 'beneficiaryId', operators: ['EQUAL'] },
    },
    {
      id: 'appointmentStatus',
      accessorKey: 'appointmentStatus',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue()
        const style =
          status === 'CONFIRMED'
            ? 'bg-green-100 text-green-800'
            : status === 'CANCELLED'
            ? 'bg-red-100 text-red-800'
            : status === 'COMPLETED'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style}`}>
            {status || 'UNKNOWN'}
          </span>
        )
      },
      meta: { type: 'string', filterKey: 'appointmentStatusId', operators: ['EQUAL', 'IN'] },
    },
    {
      id: 'organizationBranchId',
      accessorKey: 'organizationBranchId',
      header: 'Center',
      cell: ({ getValue }) => {
        const brId = getValue()
        return (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <span>{branchesMap[brId] || brId || '-'}</span>
          </div>
        )
      },
      meta: { type: 'string', filterKey: 'organizationBranchId', operators: ['EQUAL', 'IN'] },
    },
    {
      id: 'serviceTypeId',
      accessorKey: 'serviceTypeId',
      header: 'Service',
      cell: ({ getValue }) => {
        const stId = getValue()
        return (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{serviceTypesMap[stId] || stId || '-'}</span>
          </div>
        )
      },
      meta: { type: 'string', filterKey: 'serviceTypeId', operators: ['EQUAL', 'IN'] },
    },
    {
      id: 'slotDurationMinutes',
      accessorKey: 'slotDurationMinutes',
      header: 'Duration',
      cell: ({ getValue }) => {
        const duration = getValue()
        return duration ? (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {duration} min
          </span>
        ) : (
          '-'
        )
      },
      meta: {
        type: 'number',
        filterKey: 'slotDurationMinutes',
        operators: ['EQUAL', 'IN', 'GREATER_THAN', 'LESS_THAN'],
      },
    },
    {
      id: 'priority',
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ getValue }) => {
        const priority = getValue()
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {priority || 'NORMAL'}
          </span>
        )
      },
      meta: { 
        type: 'string', 
        filterKey: 'priority', 
        operators: ['EQUAL'],
        enumValues: [
          { value: 'NORMAL', label: 'Normal' },
          { value: 'URGENT', label: 'Urgent' },
        ]
      },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => {
        const date = getValue()
        return date ? new Date(date).toLocaleString() : '-'
      },
      meta: { type: 'date', filterKey: 'createdAt', operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'] },
    },
    {
      id: 'attendedAt',
      accessorKey: 'attendedAt',
      header: 'Attended',
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? new Date(value).toLocaleString() : '-'
      },
      meta: { type: 'date', filterKey: 'attendedAt', operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'] },
    },
    {
      id: 'completedAt',
      accessorKey: 'completedAt',
      header: 'Completed',
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? new Date(value).toLocaleString() : '-'
      },
      meta: { type: 'date', filterKey: 'completedAt', operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'] },
    },
    {
      id: 'cancelledAt',
      accessorKey: 'cancelledAt',
      header: 'Cancelled',
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? new Date(value).toLocaleString() : '-'
      },
      meta: { type: 'date', filterKey: 'cancelledAt', operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'] },
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Calendar className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-600">View and manage all appointments</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Organization</label>
              <SearchableSelect
                options={organizationOptions}
                value={selectedOrganizationId}
                onChange={(value) => {
                  setSelectedOrganizationId(value)
                  setSelectedBranchId(null)
                }}
                placeholder="All organizations"
                isLoading={loadingLookups}
                isClearable
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Center / Branch</label>
              <SearchableSelect
                options={branchOptions}
                value={selectedBranchId}
                onChange={(value) => setSelectedBranchId(value)}
                placeholder={selectedOrganizationId ? 'Select branch' : 'All branches'}
                isLoading={loadingLookups}
                isClearable
                isDisabled={branchOptions.length === 0}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="border rounded px-4 py-2 hover:bg-gray-50"
                onClick={() => {
                  setSelectedOrganizationId(null)
                  setSelectedBranchId(null)
                }}
                disabled={loadingLookups}
              >
                Clear Filters
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 border rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={() => setRefreshKey((key) => key + 1)}
                disabled={loadingLookups}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
          <DataTable
            title="All Appointments"
            service="appointment-service"
            resourceBase="/api/admin/appointments"
            columns={appointmentColumns}
            pageSize={20}
            refreshKey={refreshKey}
            getRowId={(r) => r?.appointmentId}
            tableId="appointments-list"
            onRowClick={handleRowClick}
            filters={combinedFilters}
          />
        </div>
      </div>
    </div>
  )
}


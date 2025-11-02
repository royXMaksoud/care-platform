import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import DataTable from '@/packages/datatable/DataTable'
import { Calendar, Clock, User, Building, FileText } from 'lucide-react'

export default function AppointmentList() {
  const navigate = useNavigate()
  const [branchesMap, setBranchesMap] = useState({})
  const [beneficiariesMap, setBeneficiariesMap] = useState({})
  const [serviceTypesMap, setServiceTypesMap] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)
  
  const handleRowClick = (row) => {
    navigate(`/appointment/appointments/${row.appointmentId}`)
  }

  // Load lookups
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [branches, beneficiaries, services] = await Promise.all([
          api.get('/access/api/organization-branches/lookup'),
          api.get('/appointment-service/api/admin/beneficiaries/lookup'),
          api.get('/appointment-service/api/admin/service-types/lookup'),
        ])
        
        const brMap = {}
        branches.data.forEach((b) => {
          brMap[b.organizationBranchId] = b.name || b.branchName
        })
        setBranchesMap(brMap)

        const benMap = {}
        beneficiaries.data.forEach((b) => {
          benMap[b.beneficiaryId] = b.fullName
        })
        setBeneficiariesMap(benMap)

        const stMap = {}
        services.data.forEach((s) => {
          stMap[s.serviceTypeId] = s.name
        })
        setServiceTypesMap(stMap)
      } catch (err) {
        console.error('Failed to load lookups:', err)
      }
    }
    loadLookups()
  }, [])

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
      header: 'Patient',
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
          />
        </div>
      </div>
    </div>
  )
}


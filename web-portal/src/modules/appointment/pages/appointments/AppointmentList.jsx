import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import DataTable from '@/packages/datatable/DataTable'
import SearchableSelect from '@/components/SearchableSelect'
import { toast } from 'sonner'
import AppointmentFormModal from './AppointmentFormModal'
import AppointmentCalendar from '@/modules/appointment/pages/appointments/AppointmentCalendar'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'
import { SYSTEM_SECTIONS } from '@/config/systemSectionConstants'
import { useSystemSectionScopes } from '@/modules/appointment/hooks/useSystemSectionScopes'
import {
  Calendar,
  Clock,
  User,
  Building,
  FileText,
  RefreshCw,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  Filter,
  MapPin,
  Navigation,
  Route,
  Loader2,
  List as ListIcon,
} from 'lucide-react'

export default function AppointmentList() {
  const navigate = useNavigate()

  // Get scopeValueIds from APPOINTMENT_SCHEDULING section only
  const { scopeValueIds, isLoading: isLoadingScopes, error: scopesError } = useSystemSectionScopes(SYSTEM_SECTIONS.APPOINTMENT_SCHEDULING)

  const [branchesMap, setBranchesMap] = useState({})
  const [beneficiariesMap, setBeneficiariesMap] = useState({})
  const [serviceTypesMap, setServiceTypesMap] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [allOrganizationBranches, setAllOrganizationBranches] = useState([])
  const [authorizedBranchIds, setAuthorizedBranchIds] = useState([])
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null)
  const [selectedBranchId, setSelectedBranchId] = useState(null)
  const [beneficiaryOptions, setBeneficiaryOptions] = useState([])
  const [serviceTypeOptions, setServiceTypeOptions] = useState([])
  const [serviceTypeTree, setServiceTypeTree] = useState([])
const [statusOptions, setStatusOptions] = useState([])
const [organizationOptions, setOrganizationOptions] = useState([])
const [allOrganizations, setAllOrganizations] = useState([])
const [showCreateModal, setShowCreateModal] = useState(false)
const [showEditModal, setShowEditModal] = useState(false)
const [showFilters, setShowFilters] = useState(true)
const [activeTab, setActiveTab] = useState('list')
const [canCreateAppointment, setCanCreateAppointment] = useState(false)
const [selectedDateFilter, setSelectedDateFilter] = useState(null)
const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState(null)
const [selectedServiceTypeId, setSelectedServiceTypeId] = useState(null)
const [selectedStatusId, setSelectedStatusId] = useState(null)
const [selectedPriority, setSelectedPriority] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [beneficiaryLocation, setBeneficiaryLocation] = useState(null)
  const [loadingNearestLocation, setLoadingNearestLocation] = useState(false)
  const [loadingNearestAvailability, setLoadingNearestAvailability] = useState(false)
  const [nearestByLocation, setNearestByLocation] = useState([])
  const [nearestByAvailability, setNearestByAvailability] = useState([])
  const [nearestError, setNearestError] = useState(null)
  const [nearestLocationSearched, setNearestLocationSearched] = useState(false)
  const [nearestAvailabilitySearched, setNearestAvailabilitySearched] = useState(false)
  const [nearestLimit, setNearestLimit] = useState(5)
  const uiLang = (typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ar')) ? 'ar' : 'en'

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1)
  }, [])

  const buildServiceTypeOptions = useCallback((nodes = []) => {
    const collected = []
    const map = {}

    const traverse = (items, path = [], depth = 0) => {
      if (!Array.isArray(items)) return
      items.forEach((item) => {
        if (!item) return
        const name = item.name || item.code || 'Service'
        const children = Array.isArray(item.children) ? item.children : []
        const isLeaf = item.leaf ?? children.length === 0
        const currentPath = [...path, name]
        const pathLabel = currentPath.join(' › ')
        const option = {
          value: item.serviceTypeId,
          label: name,
          pathLabel,
          depth,
          leaf: isLeaf,
          displayLabel: name,
          isDisabled: !isLeaf,
        }
        collected.push(option)
        if (item.serviceTypeId) {
          map[item.serviceTypeId] = pathLabel
        }
        if (children.length) {
          traverse(children, currentPath, depth + 1)
        }
      })
    }

    traverse(nodes)

    const options = collected.map((opt) => ({
      value: opt.value,
      label: opt.pathLabel,
      depth: opt.depth,
      leaf: opt.leaf,
      displayLabel: opt.displayLabel,
      rawLabel: opt.displayLabel,
      pathLabel: opt.pathLabel,
      isDisabled: opt.isDisabled,
    }))

    return { options, map }
  }, [])

  const formatDistance = (km) => {
    if (km == null || Number.isNaN(km)) return '—'
    return `${Number(km).toFixed(2)} km`
  }

  const formatDateDisplay = (value) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleDateString('en-GB')
    } catch {
      return value
    }
  }

  const formatTimeDisplay = (value) => {
    if (!value) return '—'
    return value.substring(0, 5)
  }

  const formatCoordinate = (value) => {
    if (value == null || Number.isNaN(value)) return '—'
    return Number(value).toFixed(4)
  }

  const handleOpenCreate = useCallback(() => {
    setSelectedAppointment(null)
    setShowCreateModal(true)
  }, [])

  const handleOpenEdit = useCallback((appointment) => {
    setSelectedAppointment(appointment)
    setShowEditModal(true)
  }, [])

const handleTabChange = useCallback((tab) => {
  if (tab === activeTab) return
  setActiveTab(tab)
}, [activeTab])

const toggleFilters = useCallback(() => {
  setShowFilters((prev) => !prev)
}, [])

  const handleDelete = useCallback(
    async (appointment) => {
      if (!appointment?.appointmentId) return
      const confirmed = window.confirm('Are you sure you want to delete this appointment?')
      if (!confirmed) return

      try {
        setDeletingId(appointment.appointmentId)
        await api.delete(`/appointment-service/api/admin/appointments/${appointment.appointmentId}`)
        toast.success('Appointment deleted successfully')
        refresh()
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.details?.[0]?.message ||
          'Failed to delete appointment'
        toast.error(message)
      } finally {
        setDeletingId(null)
      }
    },
    [refresh]
  )
  
  const handleNearestSearch = useCallback(
    async (mode) => {
      if (!selectedBeneficiaryId || !selectedServiceTypeId) {
        toast.error('Select both beneficiary and service type first')
        return
      }

      if (
        !beneficiaryLocation?.latitude ||
        Number.isNaN(beneficiaryLocation.latitude) ||
        !beneficiaryLocation?.longitude ||
        Number.isNaN(beneficiaryLocation.longitude)
      ) {
        toast.error('Beneficiary location is missing. Please update beneficiary coordinates.')
        return
      }

      const endpoint =
        mode === 'location'
          ? '/appointment-service/api/admin/appointments/nearest/location'
          : '/appointment-service/api/admin/appointments/nearest/availability'

      const limitValue = Number(nearestLimit)
      const effectiveLimit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 50) : 5

      const payload = {
        beneficiaryId: selectedBeneficiaryId,
        serviceTypeId: selectedServiceTypeId,
        latitude: beneficiaryLocation.latitude,
        longitude: beneficiaryLocation.longitude,
        limit: effectiveLimit,
        searchWindowDays: 30,
      }

      setNearestError(null)

      try {
        if (mode === 'location') {
          setLoadingNearestLocation(true)
        } else {
          setLoadingNearestAvailability(true)
        }

        const response = await api.post(endpoint, payload)
        const results = Array.isArray(response?.data) ? response.data : []

        if (mode === 'location') {
          setNearestByLocation(results)
          setNearestLocationSearched(true)
        } else {
          setNearestByAvailability(results)
          setNearestAvailabilitySearched(true)
        }

        if (!results.length) {
          toast.info('No matching centers found for the selected criteria.')
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.details?.[0]?.message ||
          'Failed to load nearest branches'
        setNearestError(message)
        toast.error(message)
      } finally {
        if (mode === 'location') {
          setLoadingNearestLocation(false)
        } else {
          setLoadingNearestAvailability(false)
        }
      }
    },
    [
      selectedBeneficiaryId,
      selectedServiceTypeId,
      beneficiaryLocation,
    ]
  )
  
  const handleRowClick = (row) => {
    navigate(`/appointment/appointments/${row.appointmentId}`)
  }

  // Load lookups
  useEffect(() => {
    let isActive = true
    const loadInitialData = async () => {
      setLoadingLookups(true)
      try {
        const results = await Promise.allSettled([
          api.post(
            '/access/api/organization-branches/filter',
            { criteria: [] },
            {
              params: { page: 0, size: 10000, lang: uiLang },
            }
          ),
          api.get('/appointment-service/api/admin/beneficiaries/lookup'),
          api.get('/appointment-service/api/admin/service-types/tree'),
          api.get('/auth/me/permissions'),
          api.get('/appointment-service/api/admin/appointment-statuses/lookup', {
            params: { lang: uiLang },
          }),
          api.post(
            '/access/api/organizations/filter',
            { criteria: [] },
            {
              params: { page: 0, size: 10000, lang: uiLang },
            }
          ),
        ])

        const getValue = (idx) =>
          results[idx]?.status === 'fulfilled' ? results[idx].value : null

        const branchesRes = getValue(0)
        const beneficiariesRes = getValue(1)
        const servicesRes = getValue(2)
        const permissionsRes = getValue(3)
        const statusesRes = getValue(4)
        const organizationsRes = getValue(5)

        const rejectedReasons = results
          .map((item) => (item?.status === 'rejected' ? item.reason : null))
          .filter(Boolean)
        if (rejectedReasons.length) {
          console.warn('Some lookup calls failed', rejectedReasons)
        }

        if (!isActive) return

        // Check permissions for CREATE action (by systemSectionActionId)
        const APPOINTMENT_CREATE_ACTION_ID = 'd707da02-4127-4a86-8e5d-f619e9473b94'
        let hasCreatePermission = false

        if (permissionsRes?.data) {
          const permData = permissionsRes.data
          const systems = Array.isArray(permData?.systems) ? permData.systems : []

          // Search for the action with specific systemSectionActionId
          for (const system of systems) {
            const sections = Array.isArray(system?.sections) ? system.sections : []
            for (const section of sections) {
              const actions = Array.isArray(section?.actions) ? section.actions : []
              for (const action of actions) {
                if (action?.systemSectionActionId === APPOINTMENT_CREATE_ACTION_ID && action?.effect === 'ALLOW') {
                  hasCreatePermission = true
                  break
                }
              }
              if (hasCreatePermission) break
            }
            if (hasCreatePermission) break
          }
        }

        if (isActive) {
          setCanCreateAppointment(hasCreatePermission)
        }

        const branchData = branchesRes?.data
        const branchItems = Array.isArray(branchData)
          ? branchData
          : Array.isArray(branchData?.content)
          ? branchData.content
          : []
        setAllOrganizationBranches(branchItems)

        const brMap = {}
        branchItems.forEach((b) => {
          if (b.organizationBranchId) {
            brMap[b.organizationBranchId] =
              b.name || b.organizationBranchName || b.code || 'Unknown branch'
          }
        })
        setBranchesMap(brMap)

        const beneficiaryItems = Array.isArray(beneficiariesRes?.data)
          ? beneficiariesRes.data
          : []
        const benMap = {}
        beneficiaryItems.forEach((b) => {
          if (b.beneficiaryId) {
            benMap[b.beneficiaryId] = b.fullName || b.displayName || b.beneficiaryCode || b.beneficiaryId
          }
        })
        setBeneficiariesMap(benMap)
        setBeneficiaryOptions(
          beneficiaryItems.map((b) => ({
            value: b.beneficiaryId,
            label: b.fullName || b.displayName || b.beneficiaryCode || 'Unknown beneficiary',
          }))
        )

        const serviceTreeData = Array.isArray(servicesRes?.data)
          ? servicesRes.data
          : []
        setServiceTypeTree(serviceTreeData)
        const { options: flattenedServiceOptions, map: stMap } = buildServiceTypeOptions(serviceTreeData)
        setServiceTypesMap(stMap)
        setServiceTypeOptions(flattenedServiceOptions)

        const statusItems = Array.isArray(statusesRes?.data)
          ? statusesRes.data
          : []
        setStatusOptions(
          statusItems.map((status) => ({
            value: status.value,
            label: status.label || status.name || status.code || 'Status',
            code: status.code,
            name: status.name,
          }))
        )

        const organizationsData = organizationsRes?.data
        const organizationItems = Array.isArray(organizationsData)
          ? organizationsData
          : Array.isArray(organizationsData?.content)
          ? organizationsData.content
          : []
        setAllOrganizations(organizationItems)

        // authorizedBranchIds will be set from useSystemSectionScopes hook
        // which extracts scopes from APPOINTMENT_DAILY_ENTRY section only
      } catch (err) {
        if (isActive) {
          console.error('Failed to load lookups:', err)
          setAuthorizedBranchIds([])
          setBeneficiaryOptions([])
          setServiceTypeOptions([])
          setStatusOptions([])
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
  }, [uiLang, buildServiceTypeOptions])

  // Update authorized branch IDs from section-specific scopes
  useEffect(() => {
    if (scopeValueIds && scopeValueIds.length > 0) {
      setAuthorizedBranchIds(scopeValueIds)
    } else {
      setAuthorizedBranchIds([])
    }
  }, [scopeValueIds])

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

  useEffect(() => {
    if (!selectedBeneficiaryId) {
      setBeneficiaryLocation(null)
      return
    }

    let cancelled = false

    const fetchBeneficiaryLocation = async () => {
      try {
        const response = await api.get(
          `/appointment-service/api/admin/beneficiaries/${selectedBeneficiaryId}`
        )
        if (cancelled) return
        const data = response?.data || {}
        setBeneficiaryLocation({
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          name:
            data.fullName ||
            beneficiariesMap[selectedBeneficiaryId] ||
            data.nationalId ||
            'Beneficiary',
        })
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load beneficiary location', error)
          setBeneficiaryLocation(null)
        }
      }
    }

    fetchBeneficiaryLocation()

    return () => {
      cancelled = true
    }
  }, [selectedBeneficiaryId, beneficiariesMap])

  useEffect(() => {
    if (activeTab === 'calendar') {
      setShowFilters(true)
    }
  }, [activeTab])

  useEffect(() => {
    setNearestByLocation([])
    setNearestByAvailability([])
    setNearestLocationSearched(false)
    setNearestAvailabilitySearched(false)
    setNearestError(null)
  }, [selectedBeneficiaryId, selectedServiceTypeId])

  useEffect(() => {
    const orgMap = {}
    const options = []
    const authorizedSet = new Set(authorizedBranchIds || [])
    const hasScopeFilter = authorizedSet.size > 0
    const allowedOrgIds = new Set()

    if (hasScopeFilter) {
      allOrganizationBranches.forEach((branch) => {
        if (authorizedSet.has(branch.organizationBranchId) && branch.organizationId) {
          allowedOrgIds.add(branch.organizationId)
        }
      })
    }

    const canUseOrg = (orgId) => {
      if (!orgId) return false
      if (!hasScopeFilter) return true
      return allowedOrgIds.has(orgId)
    }

    const ensureOrgOption = (orgId, labelCandidate) => {
      if (!orgId || orgMap[orgId] || !canUseOrg(orgId)) return
      const label = labelCandidate || orgId || 'Organization'
      orgMap[orgId] = label
      options.push({ value: orgId, label })
    }

    allOrganizations.forEach((org) => {
      const orgId = org.organizationId || org.id
      const label = org.organizationName || org.name || org.code || orgId
      ensureOrgOption(orgId, label)
    })

    allOrganizationBranches.forEach((branch) => {
      const orgId = branch.organizationId
      const label =
        branch.organizationName ||
        branch.organization?.name ||
        branch.organizationCode ||
        branch.name ||
        orgId
      ensureOrgOption(orgId, label)
    })

    setOrganizationOptions(options)
  }, [allOrganizations, allOrganizationBranches, authorizedBranchIds])

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
        label:
          item.organizationBranchName ||
          item.name ||
          item.branchName ||
          item.code ||
          item.organizationBranchId ||
          'Branch',
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
    } else if (selectedOrganizationId) {
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

    if (selectedDateFilter) {
      filters.push({
        key: 'appointmentDate',
        operator: 'EQUAL',
        value: selectedDateFilter,
        dataType: 'DATE',
      })
    }

    if (selectedBeneficiaryId) {
      filters.push({
        key: 'beneficiaryId',
        operator: 'EQUAL',
        value: selectedBeneficiaryId,
        dataType: 'UUID',
      })
    }

    if (selectedServiceTypeId) {
      filters.push({
        key: 'serviceTypeId',
        operator: 'EQUAL',
        value: selectedServiceTypeId,
        dataType: 'UUID',
      })
    }

    if (selectedStatusId) {
      filters.push({
        key: 'appointmentStatusId',
        operator: 'EQUAL',
        value: selectedStatusId,
        dataType: 'UUID',
      })
    }

    if (selectedPriority) {
      filters.push({
        key: 'priority',
        operator: 'EQUAL',
        value: selectedPriority,
        dataType: 'STRING',
      })
    }

    return filters
  }, [
    baseFilters,
    selectedBranchId,
    selectedOrganizationId,
    allOrganizationBranches,
    authorizedBranchIds,
    selectedDateFilter,
    selectedBeneficiaryId,
    selectedServiceTypeId,
    selectedStatusId,
    selectedPriority,
  ])

  const statusLabelMap = useMemo(() => {
    const map = {}
    statusOptions.forEach((option) => {
      if (!option) return
      const key = option.value != null ? String(option.value) : ''
      if (key) {
        map[key] = option.label
      }
    })
    return map
  }, [statusOptions])

  const appointmentColumns = [
    {
      id: 'appointmentCode',
      accessorKey: 'appointmentCode',
      header: 'Code',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-semibold text-gray-900">
          {getValue() || '—'}
        </span>
      ),
      meta: { type: 'string', filterKey: 'appointmentCode', operators: ['EQUAL', 'LIKE', 'STARTS_WITH'] },
    },
    {
      id: 'beneficiaryId',
      accessorKey: 'beneficiaryId',
      header: 'Beneficiary',
      cell: ({ getValue, row }) => {
        const benId = getValue()
        const original = row?.original || {}
        const displayName = beneficiariesMap[benId] || original.beneficiaryName || benId || '-'
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{displayName}</span>
          </div>
        )
      },
      meta: { type: 'string', filterKey: 'beneficiaryId', operators: ['EQUAL'] },
    },
    {
      id: 'serviceTypeId',
      accessorKey: 'serviceTypeId',
      header: 'Service Type',
      cell: ({ getValue, row }) => {
        const stId = getValue()
        const original = row?.original || {}
        const displayName = serviceTypesMap[stId] || original.serviceTypeName || stId || '-'
        return (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{displayName}</span>
          </div>
        )
      },
      meta: { type: 'string', filterKey: 'serviceTypeId', operators: ['EQUAL', 'IN'] },
    },
    {
      id: 'appointmentDate',
      accessorKey: 'appointmentDate',
      header: 'Date',
      cell: ({ getValue }) => {
        const date = getValue()
        return date ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-GB')}
            </span>
          </div>
        ) : (
          '-'
        )
      },
      meta: {
        type: 'date',
        filterKey: 'appointmentDate',
        operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'],
      },
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
            <span className="font-mono text-sm">{time?.substring(0, 5)}</span>
          </div>
        ) : (
          '-'
        )
      },
      meta: { type: 'string', filterKey: 'appointmentTime', operators: ['EQUAL', 'GREATER_THAN', 'LESS_THAN'] },
    },
    {
      id: 'organizationBranchId',
      accessorKey: 'organizationBranchId',
      header: 'Center',
      cell: ({ getValue, row }) => {
        const brId = getValue()
        const original = row?.original || {}
        const displayName = branchesMap[brId] || original.branchName || brId || '-'
        return (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <span>{displayName}</span>
          </div>
        )
      },
      meta: { type: 'string', filterKey: 'organizationBranchId', operators: ['EQUAL', 'IN'] },
    },
    {
      id: 'appointmentStatus',
      accessorKey: 'appointmentStatus',
      header: 'Status',
      cell: ({ getValue, row }) => {
        const statusCode = getValue()
        const statusId = row?.original?.appointmentStatusId
        const option =
          statusOptions.find((opt) => opt.value === statusId) ||
          statusOptions.find((opt) => opt.code === statusCode)

        const badgeLabel = option?.label || option?.name || statusCode || 'UNKNOWN'

        const badgeTone = (option?.code || statusCode || '').toUpperCase()
        const style =
          badgeTone === 'CONFIRMED'
            ? 'bg-green-100 text-green-800'
            : badgeTone === 'CANCELLED'
            ? 'bg-red-100 text-red-800'
            : badgeTone === 'COMPLETED'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'

        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style}`}>
            {badgeLabel}
          </span>
        )
      },
      meta: { type: 'string', filterKey: 'appointmentStatusId', operators: ['EQUAL', 'IN'] },
    },
    {
      id: 'priority',
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ getValue }) => {
        const priority = getValue()
        return (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
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
        ],
      },
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
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => {
        const date = getValue()
        return date ? new Date(date).toLocaleString() : '-'
      },
      meta: {
        type: 'date',
        filterKey: 'createdAt',
        operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'],
      },
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
    {
      id: 'rowActions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const appointment = row.original
        const appointmentId = appointment?.appointmentId
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation()
                if (appointmentId) {
                  navigate(`/appointment/appointments/${appointmentId}`)
                }
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </button>
            {canCreateAppointment && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded border border-blue-500 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenEdit(appointment)
                }}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            {canCreateAppointment && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded border border-red-500 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(appointment)
                }}
                disabled={deletingId === appointmentId}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deletingId === appointmentId ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb />
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Calendar className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-600">View and manage all appointments</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 md:space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('list')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ListIcon className="h-4 w-4" />
              List View
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('calendar')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Calendar View
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={toggleFilters}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                showFilters
                  ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            {canCreateAppointment && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
                onClick={handleOpenCreate}
                disabled={loadingLookups}
              >
                <PlusCircle className="h-4 w-4" />
                Add Appointment
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              onClick={() => {
                setSelectedOrganizationId(null)
                setSelectedBranchId(null)
                setSelectedDateFilter(null)
              setSelectedBeneficiaryId(null)
              setSelectedServiceTypeId(null)
              setSelectedStatusId(null)
              setSelectedPriority(null)
              setBeneficiaryLocation(null)
              }}
              disabled={loadingLookups}
            >
              Clear Filters
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 transition-colors"
              onClick={refresh}
              disabled={loadingLookups}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {showFilters && (
            <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Beneficiary</label>
                <SearchableSelect
                  options={beneficiaryOptions}
                  value={selectedBeneficiaryId}
                  onChange={(value) => setSelectedBeneficiaryId(value)}
                  placeholder="All beneficiaries"
                  isClearable
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Service Type</label>
                <SearchableSelect
                  options={serviceTypeOptions}
                  value={selectedServiceTypeId}
                  onChange={(value) => setSelectedServiceTypeId(value)}
                  placeholder="All service types"
                  isClearable
                />
              </div>
              {(selectedBeneficiaryId && selectedServiceTypeId) && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Find Nearest Centers</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-blue-800">
                        Max results
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={nearestLimit}
                        onChange={(e) => setNearestLimit(e.target.value)}
                        className="w-20 rounded-md border border-blue-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                      />
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleNearestSearch('location')}
                      disabled={
                        loadingNearestLocation ||
                        !selectedBeneficiaryId ||
                        !selectedServiceTypeId ||
                        !beneficiaryLocation?.latitude ||
                        !beneficiaryLocation?.longitude
                      }
                    >
                      {loadingNearestLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                      Show nearest branch
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-amber-500 bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleNearestSearch('availability')}
                      disabled={
                        loadingNearestAvailability ||
                        !selectedBeneficiaryId ||
                        !selectedServiceTypeId ||
                        !beneficiaryLocation?.latitude ||
                        !beneficiaryLocation?.longitude
                      }
                    >
                      {loadingNearestAvailability ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                      Show earliest availability
                    </button>
                  </div>
                  {nearestError && (
                    <p className="mt-1 text-xs text-red-600">{nearestError}</p>
                  )}
                  {selectedBeneficiaryId && (!beneficiaryLocation?.latitude || !beneficiaryLocation?.longitude) && (
                    <p className="mt-1 text-xs text-amber-600">
                      Beneficiary location coordinates are missing. Please update beneficiary coordinates to use this feature.
                    </p>
                  )}
                </div>
              )}
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
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <SearchableSelect
                  options={statusOptions}
                  value={selectedStatusId}
                  onChange={(value) => setSelectedStatusId(value)}
                  placeholder="All statuses"
                  isClearable
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Priority</label>
                <SearchableSelect
                  options={[
                    { value: 'NORMAL', label: 'Normal' },
                    { value: 'URGENT', label: 'Urgent' },
                  ]}
                  value={selectedPriority}
                  onChange={(value) => setSelectedPriority(value)}
                  placeholder="All priorities"
                  isClearable
                />
              </div>
            </div>
            </>
          )}

          {(nearestByLocation.length > 0 ||
            nearestByAvailability.length > 0 ||
            nearestLocationSearched ||
            nearestAvailabilitySearched) && (
            <div className="space-y-4">
              {nearestByLocation.length > 0 ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-800 font-semibold">
                      <Navigation className="h-4 w-4" />
                      <span>Nearest centers by distance</span>
                    </div>
                    <span className="text-xs font-medium text-blue-600">
                      {nearestByLocation.length} result{nearestByLocation.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-blue-100 text-xs md:text-sm">
                      <thead className="bg-blue-100/60 text-blue-900">
                        <tr>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Branch</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Address</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Distance</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Next Date</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Time</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Capacity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100 text-blue-900/90">
                        {nearestByLocation.map((item) => (
                          <tr key={`${item.organizationBranchId}-${item.nextAvailableDate || 'na'}`}>
                            <td className="px-3 py-2 align-top">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{item.branchName || 'Branch'}</span>
                                {item.organizationName && (
                                  <span className="text-xs text-gray-500">{item.organizationName}</span>
                                )}
                                <span className="text-xs text-gray-400">
                                  Lat: {formatCoordinate(item.branchLatitude)} · Lng: {formatCoordinate(item.branchLongitude)}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top text-gray-700">
                              {item.address || '—'}
                            </td>
                            <td className="px-3 py-2 align-top font-medium text-gray-900">
                              {formatDistance(item.distanceKm)}
                            </td>
                            <td className="px-3 py-2 align-top text-gray-700">
                              {formatDateDisplay(item.nextAvailableDate)}
                            </td>
                            <td className="px-3 py-2 align-top text-gray-700">
                              {formatTimeDisplay(item.nextAvailableTime)}
                            </td>
                            <td className="px-3 py-2 align-top text-gray-700">
                              <span className="font-medium text-gray-900">
                                {item.remainingCapacity ?? 0}
                              </span>
                              <span className="text-xs text-gray-500"> / {item.dailyCapacity ?? '—'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                nearestLocationSearched && (
                  <div className="rounded-lg border border-blue-100 bg-white p-4 text-sm text-blue-700">
                    No branches with free capacity were found near the selected beneficiary.
                  </div>
                )
              )}

              {nearestByAvailability.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold">
                      <Route className="h-4 w-4" />
                      <span>Nearest centers by earliest availability</span>
                    </div>
                    <span className="text-xs font-medium text-amber-700">
                      {nearestByAvailability.length} result{nearestByAvailability.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-amber-100 text-xs md:text-sm">
                      <thead className="bg-amber-100/60 text-amber-900">
                        <tr>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Branch</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Address</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Distance</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Next Date</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Time</th>
                          <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Capacity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 text-amber-900/90">
                        {nearestByAvailability.map((item) => (
                          <tr key={`${item.organizationBranchId}-${item.nextAvailableDate || 'na'}`}>
                            <td className="px-3 py-2 align-top">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{item.branchName || 'Branch'}</span>
                                {item.organizationName && (
                                  <span className="text-xs text-gray-500">{item.organizationName}</span>
                                )}
                                <span className="text-xs text-gray-400">
                                  Lat: {formatCoordinate(item.branchLatitude)} · Lng: {formatCoordinate(item.branchLongitude)}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top text-gray-700">
                              {item.address || '—'}
                            </td>
                            <td className="px-3 py-2 align-top font-medium text-gray-900">
                              {formatDistance(item.distanceKm)}
                            </td>
                            <td className="px-3 py-2 align-top text-gray-700">
                              {formatDateDisplay(item.nextAvailableDate)}
                            </td>
                            <td className="px-3 py-2 align-top text-gray-700">
                              {formatTimeDisplay(item.nextAvailableTime)}
                            </td>
                            <td className="px-3 py-2 align-top text-gray-700">
                              <span className="font-medium text-gray-900">
                                {item.remainingCapacity ?? 0}
                              </span>
                              <span className="text-xs text-gray-500"> / {item.dailyCapacity ?? '—'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                nearestAvailabilitySearched && (
                  <div className="rounded-lg border border-amber-100 bg-white p-4 text-sm text-amber-700">
                    No available appointment slots were found within the next 30 days.
                  </div>
                )
              )}
            </div>
          )}

          {(selectedDateFilter || selectedBeneficiaryId || selectedStatusId || selectedPriority) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {selectedDateFilter && (
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(selectedDateFilter + 'T00:00:00').toLocaleDateString('en-GB')}
                  </span>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => setSelectedDateFilter(null)}
                    aria-label="Clear date filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedBeneficiaryId && (
                <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-purple-700">
                  <User className="h-4 w-4" />
                  <span>
                    {beneficiaryOptions.find((opt) => opt.value === selectedBeneficiaryId)?.label ||
                      'Beneficiary'}
                  </span>
                  <button
                    type="button"
                    className="text-purple-600 hover:text-purple-800"
                    onClick={() => setSelectedBeneficiaryId(null)}
                    aria-label="Clear beneficiary filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedServiceTypeId && (
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                  <FileText className="h-4 w-4" />
                  <span>
                    {serviceTypeOptions.find((opt) => opt.value === selectedServiceTypeId)?.label || 'Service'}
                  </span>
                  <button
                    type="button"
                    className="text-indigo-600 hover:text-indigo-800"
                    onClick={() => setSelectedServiceTypeId(null)}
                    aria-label="Clear service type filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedStatusId && (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-green-700">
                  <span>Status: {statusOptions.find((opt) => opt.value === selectedStatusId)?.label || selectedStatusId}</span>
                  <button
                    type="button"
                    className="text-green-600 hover:text-green-800"
                    onClick={() => setSelectedStatusId(null)}
                    aria-label="Clear status filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedPriority && (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  <span>Priority: {selectedPriority}</span>
                  <button
                    type="button"
                    className="text-amber-600 hover:text-amber-800"
                    onClick={() => setSelectedPriority(null)}
                    aria-label="Clear priority filter"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {activeTab === 'list' ? (
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
          ) : (
            <AppointmentCalendar
              branchId={selectedBranchId}
              organizationId={selectedOrganizationId}
              branchesMap={branchesMap}
              beneficiaryMap={beneficiariesMap}
              serviceMap={serviceTypesMap}
              statusLabelMap={statusLabelMap}
              refreshKey={refreshKey}
              uiLang={uiLang}
              onSelectDate={(date) => {
                if (!date) return
                setSelectedDateFilter(date)
                setActiveTab('list')
                setShowFilters(true)
              }}
            />
          )}
        </div>
      </div>
    </div>
      <AppointmentFormModal
        open={showCreateModal}
        mode="create"
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          refresh()
        }}
        organizationOptions={organizationOptions}
        allBranches={allOrganizationBranches}
        beneficiaryOptions={beneficiaryOptions}
        serviceTypeOptions={serviceTypeOptions}
        statusOptions={statusOptions}
        authorizedBranchIds={authorizedBranchIds}
      />
      <AppointmentFormModal
        open={showEditModal}
        mode="edit"
        initial={selectedAppointment}
        onClose={() => {
          setShowEditModal(false)
          setSelectedAppointment(null)
        }}
        onSuccess={() => {
          setShowEditModal(false)
          setSelectedAppointment(null)
          refresh()
        }}
        organizationOptions={organizationOptions}
        allBranches={allOrganizationBranches}
        beneficiaryOptions={beneficiaryOptions}
        serviceTypeOptions={serviceTypeOptions}
        statusOptions={statusOptions}
        authorizedBranchIds={authorizedBranchIds}
      />
    </>
  )
}


import React, { useState, useEffect, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { api } from '@/lib/axios'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import HolidayFormModal from './HolidayFormModal'
import SearchableSelect from '@/components/SearchableSelect'
import { toast } from 'sonner'
import { usePermissionCheck } from '@/contexts/PermissionsContext'

// FullCalendar v6 includes CSS automatically, but we'll add a wrapper to ensure it renders

// Export component directly without memo to debug unmount issue
function HolidayCalendar() {
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedHoliday, setSelectedHoliday] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  
  // Organization and Branch filters
  const [organizationId, setOrganizationId] = useState('')
  const [organizationBranchId, setOrganizationBranchId] = useState('')
  const [allOrganizationBranches, setAllOrganizationBranches] = useState([])
  const [loadingScopedBranches, setLoadingScopedBranches] = useState(false)
  const [branchesMap, setBranchesMap] = useState({})
  const [error, setError] = useState(null)

  const uiLang = (typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ar')) ? 'ar' : 'en'
  const { getSectionPermissions, permissionsData } = usePermissionCheck()
  const lastScopeFetchKeyRef = useRef(null)

  // Debug: Log component mount (only once)
  useEffect(() => {
    console.log('HolidayCalendar component mounted')
    setError(null)
    return () => {
      console.log('HolidayCalendar component unmounted')
    }
  }, [])
  
  // Error boundary - catch any errors and prevent unmount
  useEffect(() => {
    const errorHandler = (event) => {
      console.error('Error caught in HolidayCalendar:', event.error)
      setError(event.error?.message || 'Unknown error')
    }
    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [])

  const extractScopeValueIds = () => {
    let sectionPerms = getSectionPermissions('Appointment Schedule Mangement', 'Appointments')
    if (!sectionPerms?.actions?.length && !sectionPerms?.allActions?.length) {
      sectionPerms = getSectionPermissions('Appointment Schedule Mangement')
    }

    const actions = sectionPerms?.allActions ?? sectionPerms?.actions ?? []
    const ids = new Set()
    actions.forEach((action) => {
      ;(action.scopes ?? []).forEach((scope) => {
        if (scope.effect === 'ALLOW' && scope.scopeValueId) {
          ids.add(scope.scopeValueId)
        }
      })
    })

    return Array.from(ids)
  }

  // Load scoped organizations/branches based on permissions
  useEffect(() => {
    let isActive = true
    const loadScopedBranches = async () => {
      try {
        setLoadingScopedBranches(true)

        const scopeValueIds = extractScopeValueIds()
        const scopeKey = JSON.stringify({ scopeValueIds, lang: uiLang })

        if (!scopeValueIds.length) {
          lastScopeFetchKeyRef.current = scopeKey
          setAllOrganizationBranches([])
          setOrganizationId('')
          setOrganizationBranchId('')
          return
        }

        if (lastScopeFetchKeyRef.current === scopeKey) {
          return
        }

        lastScopeFetchKeyRef.current = scopeKey

        const payload = { scopeValueIds, lang: uiLang }
        const { data } = await api.post('/access/api/dropdowns/organization-branches/by-scope', payload)
        if (!isActive) return

        const items = Array.isArray(data) ? data : []
        setAllOrganizationBranches(items)
      } catch (err) {
        if (!isActive) return
        console.error('Failed to load scoped organizations/branches:', err)
        toast.error('Failed to load organizations')
        setAllOrganizationBranches([])
        lastScopeFetchKeyRef.current = null
      } finally {
        if (isActive) {
          setLoadingScopedBranches(false)
        }
      }
    }
    
    loadScopedBranches()
    
    return () => {
      isActive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiLang, permissionsData])

  const organizationOptions = useMemo(() => {
    const seen = new Set()
    return allOrganizationBranches.reduce((acc, item) => {
      if (!item?.organizationId || seen.has(item.organizationId)) {
        return acc
      }
      seen.add(item.organizationId)
      acc.push({
        value: item.organizationId,
        label: item.organizationName || 'Unknown organization',
      })
      return acc
    }, [])
  }, [allOrganizationBranches])

  const branchOptions = useMemo(() => {
    if (!organizationId) return []
    return allOrganizationBranches
      .filter((item) => item.organizationId === organizationId)
      .map((item) => ({
        value: item.organizationBranchId,
        label: item.organizationBranchName || 'Unknown branch',
      }))
  }, [allOrganizationBranches, organizationId])

  useEffect(() => {
    const map = {}
    allOrganizationBranches.forEach((item) => {
      if (item?.organizationBranchId) {
        map[item.organizationBranchId] = item.organizationBranchName || item.organizationBranchId
      }
    })
    setBranchesMap(map)
  }, [allOrganizationBranches])

  useEffect(() => {
    if (!organizationId) return
    if (!organizationOptions.some((org) => org.value === organizationId)) {
      setOrganizationId('')
      setOrganizationBranchId('')
    }
  }, [organizationOptions, organizationId])

  useEffect(() => {
    if (!organizationId) {
      if (organizationBranchId) {
        setOrganizationBranchId('')
      }
      return
    }

    if (!branchOptions.length) {
      if (organizationBranchId) {
        setOrganizationBranchId('')
      }
      return
    }

    if (!branchOptions.some((branch) => branch.value === organizationBranchId)) {
      setOrganizationBranchId('')
    }
  }, [organizationId, organizationBranchId, branchOptions])

  // Load holidays when branch is selected
  useEffect(() => {
    if (organizationBranchId) {
      loadHolidays()
    } else {
      setHolidays([])
    }
  }, [organizationBranchId])

  const loadHolidays = async () => {
    if (!organizationBranchId) {
      setHolidays([])
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/appointment/api/admin/holidays/filter', {
        criteria: [
          {
            field: 'organizationBranchId',
            operator: 'EQUAL',
            value: organizationBranchId,
            dataType: 'UUID'  // Tell backend this is a UUID, not a String
          }
        ]
      }, {
        params: { page: 0, size: 1000 }
      })
      const holidaysData = response.data?.content || response.data || []
      console.log('Loaded holidays:', holidaysData.length)
      setHolidays(holidaysData)
    } catch (err) {
      console.error('Failed to load holidays:', err)
      // Don't show toast for connection errors - they might be temporary
      setHolidays([])
    } finally {
      setLoading(false)
    }
  }

  // Convert holidays to FullCalendar events
  const calendarEvents = useMemo(() => {
    const events = holidays
      .filter(h => h.isActive !== false)
      .map(holiday => ({
        id: holiday.holidayId,
        title: holiday.name,
        date: holiday.holidayDate,
        backgroundColor: holiday.isRecurringYearly ? '#9333ea' : '#10b981',
        borderColor: holiday.isRecurringYearly ? '#7e22ce' : '#059669',
        textColor: '#ffffff',
        extendedProps: {
          holidayId: holiday.holidayId,
          organizationBranchId: holiday.organizationBranchId,
          reason: holiday.reason,
          isRecurringYearly: holiday.isRecurringYearly,
          branchName: branchesMap[holiday.organizationBranchId] || holiday.organizationBranchId,
        },
      }))
    console.log('Calendar events:', events.length, events)
    return events
  }, [holidays, branchesMap])
  
  // Debug render state
  useEffect(() => {
    if (organizationBranchId) {
      console.log('Render state:', {
        organizationId,
        organizationBranchId,
        holidays: holidays.length,
        calendarEvents: calendarEvents.length,
        loading,
        organizationsCount: organizationOptions.length,
        branchesCount: branchOptions.length
      })
    }
  }, [
    organizationId,
    organizationBranchId,
    holidays.length,
    calendarEvents.length,
    loading,
    organizationOptions.length,
    branchOptions.length,
  ])

  // Handle date click (to add new holiday)
  const handleDateClick = (info) => {
    if (!organizationBranchId) {
      toast.error('Please select an organization and branch first')
      return
    }
    
    const clickedDate = info.dateStr
    // Check if there's already a holiday on this date for this branch
    const existingHoliday = holidays.find(h => 
      h.holidayDate === clickedDate && h.organizationBranchId === organizationBranchId
    )
    
    if (existingHoliday) {
      // Open edit modal
      setSelectedHoliday(existingHoliday)
      setModalMode('edit')
      setSelectedDate(clickedDate)
      setShowModal(true)
    } else {
      // Open create modal with pre-filled organization and branch
      setSelectedHoliday(null)
      setModalMode('create')
      setSelectedDate(clickedDate)
      setShowModal(true)
    }
  }

  // Handle event click (to edit holiday)
  const handleEventClick = (info) => {
    const holidayId = info.event.extendedProps.holidayId
    const holiday = holidays.find(h => h.holidayId === holidayId)
    if (holiday) {
      setSelectedHoliday(holiday)
      setModalMode('edit')
      setSelectedDate(holiday.holidayDate)
      setShowModal(true)
    }
  }

  // Handle modal success
  const handleModalSuccess = () => {
    loadHolidays()
    setShowModal(false)
    setSelectedHoliday(null)
    setSelectedDate(null)
  }

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false)
    setSelectedHoliday(null)
    setSelectedDate(null)
  }

  // Custom event content renderer
  const renderEventContent = (eventInfo) => {
    const { isRecurringYearly, branchName } = eventInfo.event.extendedProps
    return (
      <div className="fc-event-main-frame">
        <div className="fc-event-time">{eventInfo.timeText}</div>
        <div className="fc-event-title-container">
          <div className="fc-event-title fc-sticky">
            {isRecurringYearly && (
              <span className="inline-block mr-1" title="Recurring Yearly">🔄</span>
            )}
            {eventInfo.event.title}
          </div>
          {branchName && (
            <div className="fc-event-title fc-sticky text-xs opacity-80">
              {branchName}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Ensure component always renders something visible
  console.log('Rendering HolidayCalendar:', {
    hasOrganizations: organizationOptions.length > 0,
    hasOrgId: !!organizationId,
    hasBranchId: !!organizationBranchId,
    holidaysCount: holidays.length,
    error: error
  })

  // Show error if any
  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error loading calendar</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null)
              window.location.reload()
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      {/* Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filter Holidays</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Organization <span className="text-red-500">*</span></label>
            <SearchableSelect
              options={organizationOptions}
              value={organizationId}
              onChange={(value) => setOrganizationId(value)}
              placeholder="Select organization"
              isClearable={false}
              isSearchable={true}
              isLoading={loadingScopedBranches}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Center/Branch <span className="text-red-500">*</span></label>
            <SearchableSelect
              options={branchOptions}
              value={organizationBranchId}
              onChange={(value) => setOrganizationBranchId(value)}
              placeholder={organizationId ? 'Select center/branch' : 'Select organization first'}
              isDisabled={!organizationId || branchOptions.length === 0}
              isClearable={false}
              isSearchable={true}
              isLoading={loadingScopedBranches}
            />
          </div>
        </div>

        {!organizationBranchId && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Please select an organization and center/branch</strong> to view the holiday calendar.
            </p>
          </div>
        )}
      </div>

      {/* Only show calendar when branch is selected */}
      {organizationBranchId ? (
        <>
          {/* Action Bar */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => {
                if (!organizationBranchId) {
                  toast.error('Please select an organization and branch first')
                  return
                }
                setSelectedDate(new Date().toISOString().split('T')[0])
                setSelectedHoliday(null)
                setModalMode('create')
                setShowModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus className="h-4 w-4" />
              Add Holiday
            </button>
          </div>

          {/* Legend */}
          <div className="mb-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>One-time Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span>Recurring Yearly</span>
            </div>
            <div className="text-xs text-gray-500">
              💡 Click on any date to add a holiday or click on an event to edit
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-lg p-4" id="fullcalendar-container">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading holidays...</div>
              </div>
            ) : (
              <div style={{ width: '100%', minHeight: '600px', position: 'relative' }} className="fullcalendar-wrapper">
                {(() => {
                  try {
                    console.log('About to render FullCalendar with events:', calendarEvents.length)
                    return (
                      <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={calendarEvents}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        eventContent={renderEventContent}
                        headerToolbar={{
                          left: 'prev,next today',
                          center: 'title',
                          right: 'dayGridMonth,dayGridWeek,dayGridDay'
                        }}
                        editable={false}
                        selectable={false}
                        dayMaxEvents={3}
                        height="auto"
                        aspectRatio={1.8}
                        eventDisplay="block"
                        eventBorderColor="#ffffff"
                        eventTextColor="#ffffff"
                        locale="en"
                        firstDay={0}
                      />
                    )
                  } catch (err) {
                    console.error('Error rendering FullCalendar:', err)
                    return (
                      <div className="p-8 text-center">
                        <p className="text-red-600 mb-4">Error rendering calendar: {err.message}</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg"
                        >
                          Reload
                        </button>
                      </div>
                    )
                  }
                })()}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Calendar Selected</h3>
          <p className="text-sm text-gray-500">
            Please select an organization and center/branch above to view the holiday calendar.
          </p>
        </div>
      )}

      {/* Modal */}
      <HolidayFormModal
        open={showModal}
        mode={modalMode}
        initial={
          modalMode === 'edit' && selectedHoliday
            ? { ...selectedHoliday, holidayDate: selectedHoliday.holidayDate?.split('T')[0] || selectedDate }
            : { 
                holidayDate: selectedDate,
                organizationId: organizationId,
                organizationBranchId: organizationBranchId 
              }
        }
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default HolidayCalendar


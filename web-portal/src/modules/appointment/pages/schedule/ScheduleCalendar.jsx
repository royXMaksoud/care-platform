import React, { useState, useEffect, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { api } from '@/lib/axios'
import { Plus, Calendar as CalendarIcon, Clock } from 'lucide-react'
import ScheduleFormModal from './ScheduleFormModal'
import SearchableSelect from '@/components/SearchableSelect'
import { toast } from 'sonner'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function ScheduleCalendar() {
  const [schedules, setSchedules] = useState([])
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  
  // Organization and Branch filters
  const [organizationId, setOrganizationId] = useState('')
  const [organizationBranchId, setOrganizationBranchId] = useState('')
  const [organizations, setOrganizations] = useState([])
  const [orgBranches, setOrgBranches] = useState([])
  const [loadingOrganizations, setLoadingOrganizations] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [branchesMap, setBranchesMap] = useState({})

  const uiLang = (typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ar')) ? 'ar' : 'en'

  // Debug: Log component mount (only once)
  useEffect(() => {
    console.log('ScheduleCalendar component mounted')
    return () => {
      console.log('ScheduleCalendar component unmounted')
    }
  }, [])

  // Load organizations from dropdown API
  useEffect(() => {
    let isMounted = true
    console.log('Starting to load organizations, isMounted:', isMounted)
    
    const loadOrganizations = async () => {
      try {
        setLoadingOrganizations(true)
        const res = await api.get('/access/api/dropdowns/organizations', {
          params: { lang: uiLang }
        })
        const options = (res?.data || []).map((item) => ({
          value: item.id || item.value,
          label: item.name || item.label || 'Unknown',
        }))
        console.log('Loaded organizations:', options.length, 'isMounted:', isMounted)
        if (isMounted) {
          setOrganizations(options)
        }
      } catch (err) {
        console.error('Failed to load organizations:', err)
        if (isMounted) {
          setOrganizations([])
        }
      } finally {
        if (isMounted) {
          setLoadingOrganizations(false)
        }
      }
    }
    
    loadOrganizations()
    
    return () => {
      console.log('Organizations loader cleanup, setting isMounted=false')
      isMounted = false
    }
  }, [uiLang])

  // Load branches when organization changes (cascade dropdown)
  useEffect(() => {
    let isMounted = true
    
    if (!organizationId) {
      if (isMounted) {
        setOrgBranches([])
        setOrganizationBranchId('')
        setBranchesMap({})
      }
      return () => {
        isMounted = false
      }
    }
    
    const loadBranches = async () => {
      try {
        setLoadingBranches(true)
        const res = await api.get('/access/api/cascade-dropdowns/access.organization-branches-by-organization', {
          params: {
            organizationId: organizationId,
            lang: uiLang
          }
        })
        const options = (res?.data || []).map((item) => ({
          value: item.id || item.value,
          label: item.name || item.label || 'Unknown',
        }))
        
        if (!isMounted) {
          console.log('Component unmounted during branches load, skipping state update')
          return
        }
        
        setOrgBranches(options)
        
        // Create branches map
        const map = {}
        options.forEach((option) => {
          map[option.value] = option.label
        })
        setBranchesMap(map)
        
        // Reset branch selection when organization changes
        setOrganizationBranchId('')
      } catch (err) {
        console.error('Failed to load organization branches:', err)
        if (isMounted) {
          setOrgBranches([])
          setBranchesMap({})
        }
      } finally {
        if (isMounted) {
          setLoadingBranches(false)
        }
      }
    }
    
    loadBranches()
    
    return () => {
      console.log('Branches loader cleanup, setting isMounted=false')
      isMounted = false
    }
  }, [organizationId, uiLang])

  // Load schedules and holidays when branch is selected
  useEffect(() => {
    if (organizationBranchId) {
      loadSchedules()
      loadHolidays()
    } else {
      setSchedules([])
      setHolidays([])
    }
  }, [organizationBranchId])

  const loadSchedules = async () => {
    if (!organizationBranchId) {
      setSchedules([])
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/appointment/api/admin/schedules/filter', {
        criteria: [
          {
            field: 'organizationBranchId',
            operator: 'EQUAL',
            value: organizationBranchId,
            dataType: 'UUID'
          },
          {
            field: 'isActive',
            operator: 'EQUAL',
            value: true,
            dataType: 'BOOLEAN'
          }
        ]
      }, {
        params: { page: 0, size: 1000 }
      })
      const schedulesData = response.data?.content || response.data || []
      console.log('Loaded schedules:', schedulesData.length)
      setSchedules(schedulesData)
    } catch (err) {
      console.error('Failed to load schedules:', err)
      setSchedules([])
    }
  }

  const loadHolidays = async () => {
    if (!organizationBranchId) {
      setHolidays([])
      return
    }

    try {
      const response = await api.post('/appointment/api/admin/holidays/filter', {
        criteria: [
          {
            field: 'organizationBranchId',
            operator: 'EQUAL',
            value: organizationBranchId,
            dataType: 'UUID'
          },
          {
            field: 'isActive',
            operator: 'EQUAL',
            value: true,
            dataType: 'BOOLEAN'
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
      setHolidays([])
    } finally {
      setLoading(false)
    }
  }

  // Convert schedules to FullCalendar events (show for current month + next month)
  // Convert holidays to FullCalendar events
  // Merge them together
  const calendarEvents = useMemo(() => {
    const events = []
    
    // Get current date and calculate dates for next 2 months
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1) // First day of current month
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0) // Last day of next month
    
    // Add schedules as recurring weekly events (official working days)
    schedules.forEach(schedule => {
      const dayOfWeek = schedule.dayOfWeek // 0-6 (Sunday-Saturday)
      
      // Generate events for all occurrences of this day of week in the date range
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        if (currentDate.getDay() === dayOfWeek) {
          events.push({
            id: `schedule-${schedule.scheduleId}-${currentDate.toISOString().split('T')[0]}`,
            title: `${schedule.startTime} - ${schedule.endTime}`,
            date: currentDate.toISOString().split('T')[0],
            backgroundColor: '#3b82f6', // Blue for official working days
            borderColor: '#2563eb',
            textColor: '#ffffff',
            extendedProps: {
              type: 'schedule',
              scheduleId: schedule.scheduleId,
              organizationBranchId: schedule.organizationBranchId,
              dayOfWeek: dayOfWeek,
              dayName: DAY_NAMES[dayOfWeek],
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              slotDurationMinutes: schedule.slotDurationMinutes,
              maxCapacityPerSlot: schedule.maxCapacityPerSlot,
              branchName: branchesMap[schedule.organizationBranchId] || schedule.organizationBranchId,
            },
          })
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    // Add holidays as date-specific events
    holidays
      .filter(h => h.isActive !== false)
      .forEach(holiday => {
        events.push({
          id: `holiday-${holiday.holidayId}`,
          title: holiday.name,
          date: holiday.holidayDate,
          backgroundColor: holiday.isRecurringYearly ? '#ef4444' : '#f59e0b', // Red for recurring, orange for one-time
          borderColor: holiday.isRecurringYearly ? '#dc2626' : '#d97706',
          textColor: '#ffffff',
          extendedProps: {
            type: 'holiday',
            holidayId: holiday.holidayId,
            organizationBranchId: holiday.organizationBranchId,
            reason: holiday.reason,
            isRecurringYearly: holiday.isRecurringYearly,
            branchName: branchesMap[holiday.organizationBranchId] || holiday.organizationBranchId,
          },
        })
      })

    // Add weekend days (Saturday and Sunday) - these are automatically weekends
    // FullCalendar already highlights weekends, but we can add custom events if needed
    
    console.log('Calendar events:', events.length, 'schedules:', schedules.length, 'holidays:', holidays.length)
    return events
  }, [schedules, holidays, branchesMap])

  // Handle date click (to add new schedule)
  const handleDateClick = (info) => {
    if (!organizationBranchId) {
      toast.error('Please select an organization and branch first')
      return
    }
    
    // Get day of week from clicked date (0=Sunday, 6=Saturday)
    const clickedDate = new Date(info.dateStr)
    const dayOfWeek = clickedDate.getDay()
    
    setSelectedDate(info.dateStr)
    setSelectedSchedule(null)
    setModalMode('create')
    setShowModal(true)
  }

  // Handle event click (to edit schedule or view holiday)
  const handleEventClick = (info) => {
    const eventType = info.event.extendedProps.type
    
    if (eventType === 'schedule') {
      // Edit schedule
      const schedule = schedules.find(s => s.scheduleId === info.event.extendedProps.scheduleId)
      if (schedule) {
        setSelectedSchedule(schedule)
        setSelectedDate(null)
        setModalMode('edit')
        setShowModal(true)
      }
    } else if (eventType === 'holiday') {
      // Show holiday info (read-only, or could open holiday modal if needed)
      const holiday = holidays.find(h => h.holidayId === info.event.extendedProps.holidayId)
      if (holiday) {
        toast.info(`${holiday.name}: ${holiday.reason || 'Official holiday'}`, {
          duration: 5000
        })
      }
    }
    
    info.jsEvent.preventDefault()
  }

  // Custom event content renderer
  const renderEventContent = (eventInfo) => {
    const props = eventInfo.event.extendedProps
    const isSchedule = props.type === 'schedule'
    const isHoliday = props.type === 'holiday'
    
    return (
      <div className="fc-event-main-frame">
        <div className="fc-event-time-container">
          <div className="fc-event-time">
            {isSchedule ? (
              <Clock className="h-3 w-3 inline mr-1" />
            ) : isHoliday && props.isRecurringYearly ? (
              <span className="inline-block mr-1">🔄</span>
            ) : null}
          </div>
        </div>
        <div className="fc-event-title-container">
          <div className="fc-event-title fc-sticky">
            {eventInfo.event.title}
          </div>
          {isSchedule && props.dayName && (
            <div className="fc-event-title fc-sticky text-xs opacity-80">
              {props.dayName}
            </div>
          )}
          {isHoliday && props.reason && (
            <div className="fc-event-title fc-sticky text-xs opacity-80">
              {props.reason}
            </div>
          )}
        </div>
      </div>
    )
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedSchedule(null)
    setSelectedDate(null)
  }

  const handleModalSuccess = () => {
    handleModalClose()
    if (organizationBranchId) {
      loadSchedules()
    }
  }

  // Ensure component always renders something visible
  console.log('Rendering ScheduleCalendar:', {
    hasOrganizations: organizations.length > 0,
    hasOrgId: !!organizationId,
    hasBranchId: !!organizationBranchId,
    schedulesCount: schedules.length,
    holidaysCount: holidays.length
  })

  return (
    <div className="min-h-screen p-4">
      {/* Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filter Schedules & Holidays</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Organization <span className="text-red-500">*</span></label>
            <SearchableSelect
              options={organizations}
              value={organizationId}
              onChange={(value) => setOrganizationId(value)}
              placeholder="Select organization"
              isClearable={false}
              isSearchable={true}
              isLoading={loadingOrganizations}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Center/Branch <span className="text-red-500">*</span></label>
            <SearchableSelect
              options={orgBranches}
              value={organizationBranchId}
              onChange={(value) => setOrganizationBranchId(value)}
              placeholder={organizationId ? 'Select center/branch' : 'Select organization first'}
              isDisabled={!organizationId || loadingBranches}
              isClearable={false}
              isSearchable={true}
              isLoading={loadingBranches}
            />
          </div>
        </div>

        {!organizationBranchId && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Please select an organization and center/branch</strong> to view the schedule calendar.
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
                setSelectedSchedule(null)
                setModalMode('create')
                setShowModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus className="h-4 w-4" />
              Add Schedule
            </button>
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span>Official Working Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>Recurring Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span>One-time Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-300 border border-gray-400"></div>
              <span>Weekend (Saturday/Sunday)</span>
            </div>
            <div className="text-xs text-gray-500">
              💡 Click on any date to add a schedule or click on an event to edit
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-lg p-4" id="fullcalendar-container">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading schedules and holidays...</div>
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
                        weekends={true}
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
            Please select an organization and center/branch above to view the schedule calendar.
          </p>
        </div>
      )}

      {/* Modal */}
      <ScheduleFormModal
        open={showModal}
        mode={modalMode}
        initial={
          modalMode === 'edit' && selectedSchedule
            ? { ...selectedSchedule }
            : {
                organizationId: organizationId,
                organizationBranchId: organizationBranchId,
                // Set dayOfWeek from selected date if available
                dayOfWeek: selectedDate ? new Date(selectedDate).getDay() : undefined
              }
        }
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}


import React, { useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

const DEFAULT_EVENT_COLOR = {
  background: '#2563eb',
  border: '#1d4ed8',
}

function normalizeStatus(statusLabel = '') {
  const lower = statusLabel.toLowerCase()
  if (lower.includes('complete') || lower.includes('finish') || lower.includes('done')) {
    return 'completed'
  }
  if (lower.includes('cancel') || lower.includes('reject')) {
    return 'other'
  }
  return 'pending'
}

function summarizeColors({ pending, completed, other }) {
  if (completed && !pending && !other) {
    return { background: '#4ade80', border: '#22c55e' }
  }
  if (pending && !completed && !other) {
    return { background: '#60a5fa', border: '#3b82f6' }
  }
  if (pending && completed) {
    return { background: '#6366f1', border: '#4f46e5' }
  }
  if (other && !pending && !completed) {
    return { background: '#f97316', border: '#ea580c' }
  }
  return DEFAULT_EVENT_COLOR
}

export default function AppointmentCalendar({
  branchId,
  organizationId,
  branchesMap,
  beneficiaryMap,
  serviceMap,
  statusLabelMap,
  refreshKey,
  uiLang,
  onSelectDate,
}) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isActive = true

    const fetchAppointments = async () => {
      if (!branchId) {
        setAppointments([])
        return
      }

      setLoading(true)
      try {
        const criteria = [
          {
            field: 'organizationBranchId',
            operator: 'EQUAL',
            value: branchId,
            dataType: 'UUID',
          },
        ]

        const { data } = await api.post(
          '/appointment-service/api/admin/appointments/filter',
          { criteria },
          {
            params: {
              page: 0,
              size: 1000,
              lang: uiLang,
            },
          }
        )

        if (!isActive) return
        const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []
        setAppointments(content)
      } catch (err) {
        if (!isActive) return
        toast.error(err?.response?.data?.message || 'Failed to load appointments')
        setAppointments([])
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    fetchAppointments()

    return () => {
      isActive = false
    }
  }, [branchId, refreshKey, uiLang])

  const aggregatedByDate = useMemo(() => {
    const map = new Map()

    appointments.forEach((appointment) => {
      const date = appointment.appointmentDate
      if (!date) return

      const statusLabel = statusLabelMap[String(appointment.appointmentStatusId)] || 'Unknown'
      const beneficiaryName =
        beneficiaryMap[appointment.beneficiaryId] ||
        appointment.beneficiaryName ||
        'Beneficiary'
      const serviceName =
        serviceMap[appointment.serviceTypeId] ||
        appointment.serviceTypeName ||
        ''

      const entry =
        map.get(date) ||
        {
          date,
          pending: 0,
          completed: 0,
          other: 0,
          total: 0,
          appointments: [],
        }

      const category = normalizeStatus(statusLabel)
      if (category === 'completed') entry.completed += 1
      else if (category === 'pending') entry.pending += 1
      else entry.other += 1
      entry.total += 1
      entry.appointments.push({
        appointment,
        statusLabel,
        beneficiaryName,
        serviceName,
      })

      map.set(date, entry)
    })

    return Array.from(map.values())
  }, [appointments, beneficiaryMap, serviceMap, statusLabelMap])

  const events = useMemo(() => {
    return aggregatedByDate.map((entry) => {
      const { date, pending, completed, other } = entry
      const colors = summarizeColors(entry)
      const summaryParts = []
      if (pending) summaryParts.push(`Pending: ${pending}`)
      if (completed) summaryParts.push(`Completed: ${completed}`)
      if (other) summaryParts.push(`Other: ${other}`)
      const title = summaryParts.join(' | ') || 'No appointments'

      return {
        id: date,
        title,
        start: date,
        allDay: true,
        backgroundColor: colors.background,
        borderColor: colors.border,
        textColor: '#ffffff',
        extendedProps: {
          date,
          counts: entry,
        },
      }
    })
  }, [aggregatedByDate])

  const renderEventContent = (eventInfo) => {
    const { counts } = eventInfo.event.extendedProps
    return (
      <div className="fc-event-main-frame text-xs leading-tight">
        {counts.pending ? (
          <div className="fc-event-title fc-sticky font-semibold">Pending: {counts.pending}</div>
        ) : null}
        {counts.completed ? (
          <div className="fc-event-title fc-sticky">Completed: {counts.completed}</div>
        ) : null}
        {counts.other ? (
          <div className="fc-event-title fc-sticky text-[11px] opacity-85">
            Other: {counts.other}
          </div>
        ) : null}
        {!counts.pending && !counts.completed && !counts.other ? (
          <div className="fc-event-title fc-sticky">No appointments</div>
        ) : null}
      </div>
    )
  }

  const handleEventClick = (info) => {
    info.jsEvent.preventDefault()
    const date = info.event.extendedProps?.date
    if (date && typeof onSelectDate === 'function') {
      onSelectDate(date)
    }
  }

  if (!branchId) {
    return (
      <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center text-sm text-blue-700">
        {organizationId
          ? 'Select a branch to view all appointments on the calendar.'
          : 'Select an organization and branch to view appointments on the calendar.'}
      </div>
    )
  }

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
          Loading appointments...
        </div>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay',
          }}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
        />
      )}
      {!loading && events.length === 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          No appointments found for the selected branch.
        </div>
      )}
    </div>
  )
}


import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Calendar, RotateCw, Loader2 } from 'lucide-react'
import { api } from '@/lib/axios'

const formatDate = (value) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

const formatTime = (value) => {
  if (!value) return '—'
  return value.slice(0, 5)
}

const formatId = (value) => {
  if (!value) return '—'
  return `${value.slice(0, 8)}…`
}

const renderStatusBadge = (status) => {
  if (!status) {
    return (
      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
        Unknown
      </span>
    )
  }
  const normalized = status.toLowerCase()
  const styles =
    normalized === 'completed'
      ? 'bg-green-100 text-green-800'
      : normalized === 'cancelled' || normalized === 'canceled'
      ? 'bg-red-100 text-red-700'
      : normalized === 'scheduled'
      ? 'bg-indigo-100 text-indigo-700'
      : 'bg-gray-100 text-gray-700'

  return (
    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${styles}`}>
      {status}
    </span>
  )
}

export default function BeneficiaryAppointmentsTab({ beneficiaryId }) {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sort, setSort] = useState({ field: 'appointmentDate', direction: 'desc' })
  const [error, setError] = useState(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  useEffect(() => {
    setPage(0)
  }, [beneficiaryId])

  useEffect(() => {
    let isMounted = true

    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)
        const sortParam = `${sort.field},${sort.direction}`
        const sortParams =
          sort.field === 'appointmentDate'
            ? [sortParam, 'appointmentTime,desc']
            : [sortParam]

        const { data } = await api.get(
          `/appointment-service/api/admin/beneficiaries/${beneficiaryId}/appointments`,
          {
            params: {
              page,
              size: pageSize,
              sort: sortParams,
            },
          }
        )

        if (!isMounted) return

        setAppointments(data?.content || [])
        setTotalElements(data?.totalElements ?? 0)
        setTotalPages(data?.totalPages ?? 0)
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load appointments:', err)
        setError(err)
        toast.error(err.response?.data?.message || 'Failed to load appointments')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAppointments()

    return () => {
      isMounted = false
    }
  }, [beneficiaryId, page, pageSize, sort.field, sort.direction, refreshCounter])

  const handlePageChange = (nextPage) => {
    const effectiveTotalPages =
      totalPages || (totalElements > 0 ? Math.ceil(totalElements / pageSize) : 0)

    if (nextPage < 0) return
    if (effectiveTotalPages > 0 && nextPage >= effectiveTotalPages) return
    setPage(nextPage)
  }

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value))
    setPage(0)
  }

  const handleSort = (field) => {
    setSort((prev) => {
      const isSameField = prev.field === field
      const direction = isSameField && prev.direction === 'desc' ? 'asc' : 'desc'
      return { field, direction }
    })
    setPage(0)
  }

  const handleRefresh = () => {
    setRefreshCounter((count) => count + 1)
  }

  const effectiveTotalPages =
    totalPages || (totalElements > 0 ? Math.ceil(totalElements / pageSize) : 0)
  const isFirstPage = page === 0
  const isLastPage = effectiveTotalPages === 0 ? true : page >= effectiveTotalPages - 1

  const renderSortIndicator = (field) => {
    if (sort.field !== field) return null
    return (
      <span className="text-xs font-semibold text-gray-500">
        {sort.direction === 'desc' ? '↓' : '↑'}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Appointments History</h3>
          <p className="text-sm text-gray-500">
            Review all appointments booked for this beneficiary with latest updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">
            Page Size:
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RotateCw
              className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : 'text-gray-600'}`}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-6">
          <p className="font-medium mb-2">Unable to load appointments</p>
          <p className="text-sm">
            {error.response?.data?.message || error.message || 'Please try again later.'}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No appointments found for this beneficiary.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort('appointmentDate')}
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      Appointment
                      {renderSortIndicator('appointmentDate')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort('createdAt')}
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      Created
                      {renderSortIndicator('createdAt')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.appointmentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900">
                          {formatDate(appointment.appointmentDate)} • {formatTime(appointment.appointmentTime)}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {formatId(appointment.appointmentId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900">
                          {appointment.serviceTypeName || '—'}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {appointment.serviceTypeId || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900">
                          {appointment.branchName || '—'}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {appointment.organizationBranchId || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{renderStatusBadge(appointment.appointmentStatus)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          appointment.priority === 'URGENT'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {appointment.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-gray-900">
                          {appointment.createdAt
                            ? new Date(appointment.createdAt).toLocaleString()
                            : '—'}
                        </span>
                        {appointment.createdById && (
                          <span className="text-xs text-gray-500 font-mono">
                            {appointment.createdById}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium text-gray-900">{appointments.length}</span> of{' '}
              <span className="font-medium text-gray-900">{totalElements}</span> appointments
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={isFirstPage}
                className={`px-3 py-2 rounded-md text-sm ${
                  isFirstPage
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page <span className="font-medium text-gray-900">{page + 1}</span> of{' '}
                <span className="font-medium text-gray-900">
                  {effectiveTotalPages > 0 ? effectiveTotalPages : 1}
                </span>
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={isLastPage}
                className={`px-3 py-2 rounded-md text-sm ${
                  isLastPage
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

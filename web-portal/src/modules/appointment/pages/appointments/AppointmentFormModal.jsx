import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import SearchableSelect from '@/components/SearchableSelect'
import Select from 'react-select'
import { MapPin, Navigation, Calendar as CalendarIcon, Loader2, Route } from 'lucide-react'

const SLOT_DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
  { value: 120, label: '120 minutes' },
]

const PRIORITY_OPTIONS = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'URGENT', label: 'Urgent' },
]

export default function AppointmentFormModal({
  open,
  mode = 'create',
  initial,
  onClose,
  onSuccess,
  organizationOptions = [],
  allBranches = [],
  beneficiaryOptions = [],
  serviceTypeOptions = [],
  statusOptions = [],
  authorizedBranchIds = [],
}) {
  const [saving, setSaving] = useState(false)
  const [beneficiaryLocation, setBeneficiaryLocation] = useState(null)
  const [nearestByLocation, setNearestByLocation] = useState([])
  const [nearestByAvailability, setNearestByAvailability] = useState([])
  const [nearestError, setNearestError] = useState(null)
  const [nearestLimit, setNearestLimit] = useState(5)
  const [loadingNearestLocation, setLoadingNearestLocation] = useState(false)
  const [loadingNearestAvailability, setLoadingNearestAvailability] = useState(false)
  const [form, setForm] = useState({
    organizationId: '',
    organizationBranchId: '',
    appointmentRequestId: '',
    beneficiaryId: '',
    serviceTypeId: '',
    appointmentDate: '',
    appointmentTime: '',
    slotDurationMinutes: 30,
    appointmentStatusId: '',
    priority: 'NORMAL',
    notes: '',
    actionTypeId: '',
    actionNotes: '',
  })

  const branchMap = useMemo(() => {
    const map = {}
    allBranches.forEach((item) => {
      if (!item?.organizationBranchId) return
      map[item.organizationBranchId] = item
    })
    return map
  }, [allBranches])

  const filteredBranchOptions = useMemo(() => {
    const selectedOrg = form.organizationId
    return allBranches
      .filter((item) => {
        if (!item?.organizationBranchId) return false
        if (authorizedBranchIds.length && !authorizedBranchIds.includes(item.organizationBranchId)) {
          return false
        }
        if (selectedOrg && item.organizationId !== selectedOrg) {
          return false
        }
        return true
      })
      .map((item) => ({
        value: item.organizationBranchId,
        label: item.name || item.organizationBranchName || 'Unknown branch',
      }))
  }, [allBranches, authorizedBranchIds, form.organizationId])

  const serviceTypeSelectStyles = useMemo(
    () => ({
      control: (provided, state) => ({
        ...provided,
        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
        '&:hover': {
          borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
        },
        minHeight: 38,
        borderRadius: '0.375rem',
      }),
      option: (provided, state) => {
        const depth = typeof state?.data?.depth === 'number' ? state.data.depth : 0
        const isLeaf = state?.data?.leaf !== false
        return {
          ...provided,
          backgroundColor: state.isSelected
            ? '#3b82f6'
            : state.isFocused
            ? '#dbeafe'
            : 'white',
          color: state.isDisabled ? '#9ca3af' : state.isSelected ? 'white' : '#1f2937',
          cursor: state.isDisabled ? 'not-allowed' : 'pointer',
          fontWeight: isLeaf ? provided.fontWeight || 400 : 600,
          opacity: state.isDisabled ? 0.75 : 1,
          paddingLeft: `${12 + depth * 12}px`,
          '&:active': {
            backgroundColor: '#2563eb',
          },
        }
      },
      menu: (provided) => ({
        ...provided,
        zIndex: 60,
      }),
      input: (provided) => ({
        ...provided,
        margin: 0,
        padding: 0,
      }),
      placeholder: (provided) => ({
        ...provided,
        color: '#9ca3af',
      }),
    }),
    []
  )

  const formatServiceTypeOptionLabel = useCallback((option, { context }) => {
    if (option && Object.prototype.hasOwnProperty.call(option, 'displayLabel')) {
      if (context === 'value') {
        return option.pathLabel || option.label || option.displayLabel
      }
      return option.displayLabel || option.label || ''
    }
    return option?.label ?? ''
  }, [])

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initial) {
      const branch = initial.organizationBranchId ? branchMap[initial.organizationBranchId] : null
      const derivedOrgId = branch?.organizationId || ''

      setForm({
        organizationId: derivedOrgId,
        organizationBranchId: initial.organizationBranchId || '',
        appointmentRequestId: initial.appointmentRequestId || '',
        beneficiaryId: initial.beneficiaryId || '',
        serviceTypeId: initial.serviceTypeId || '',
        appointmentDate: initial.appointmentDate || '',
        appointmentTime: initial.appointmentTime ? initial.appointmentTime.substring(0, 5) : '',
        slotDurationMinutes: initial.slotDurationMinutes || 30,
        appointmentStatusId: initial.appointmentStatusId || '',
        priority: initial.priority || 'NORMAL',
        notes: initial.notes || '',
        actionTypeId: initial.actionTypeId || '',
        actionNotes: initial.actionNotes || '',
      })
    } else {
      setForm({
        organizationId: '',
        organizationBranchId: '',
        appointmentRequestId: '',
        beneficiaryId: '',
        serviceTypeId: '',
        appointmentDate: '',
        appointmentTime: '',
        slotDurationMinutes: 30,
        appointmentStatusId: '',
        priority: 'NORMAL',
        notes: '',
        actionTypeId: '',
        actionNotes: '',
      })
    }
  }, [open, mode, initial, branchMap])

  useEffect(() => {
    if (!form.organizationId) {
      if (form.organizationBranchId) {
        setForm((prev) => ({ ...prev, organizationBranchId: '' }))
      }
      return
    }
    if (!filteredBranchOptions.some((opt) => opt.value === form.organizationBranchId)) {
      setForm((prev) => ({ ...prev, organizationBranchId: '' }))
    }
  }, [form.organizationId, form.organizationBranchId, filteredBranchOptions])

  useEffect(() => {
    if (!form.beneficiaryId) {
      setBeneficiaryLocation(null)
      setNearestByLocation([])
      setNearestByAvailability([])
      setNearestError(null)
      return
    }

    let cancelled = false
    const fetchLocation = async () => {
      try {
        const response = await api.get(
          `/appointment-service/api/admin/beneficiaries/${form.beneficiaryId}`
        )
        if (cancelled) return
        const data = response?.data || {}
        setBeneficiaryLocation({
          name: data.fullName || data.displayName || data.nationalId || 'Beneficiary',
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        })
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load beneficiary location', error)
          setBeneficiaryLocation(null)
        }
      }
    }
    fetchLocation()
    return () => {
      cancelled = true
    }
  }, [form.beneficiaryId])

  useEffect(() => {
    setNearestByLocation([])
    setNearestByAvailability([])
    setNearestError(null)
  }, [form.beneficiaryId, form.serviceTypeId])

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

  const handleNearestSearch = async (mode) => {
    if (!form.beneficiaryId || !form.serviceTypeId) {
      toast.error('Select beneficiary and service type first')
      return
    }
    if (
      !beneficiaryLocation?.latitude ||
      Number.isNaN(beneficiaryLocation.latitude) ||
      !beneficiaryLocation?.longitude ||
      Number.isNaN(beneficiaryLocation.longitude)
    ) {
      toast.error('Beneficiary coordinates are missing')
      return
    }

    const endpoint =
      mode === 'location'
        ? '/appointment-service/api/admin/appointments/nearest/location'
        : '/appointment-service/api/admin/appointments/nearest/availability'

      const limitValue = Number(nearestLimit)
      const effectiveLimit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 50) : 5

      const payload = {
      beneficiaryId: form.beneficiaryId,
      serviceTypeId: form.serviceTypeId,
      latitude: beneficiaryLocation.latitude,
      longitude: beneficiaryLocation.longitude,
        limit: effectiveLimit,
      searchWindowDays: 30,
    }

    try {
      setNearestError(null)
      if (mode === 'location') {
        setLoadingNearestLocation(true)
      } else {
        setLoadingNearestAvailability(true)
      }
      const response = await api.post(endpoint, payload)
      const results = Array.isArray(response?.data) ? response.data : []

      if (mode === 'location') {
        setNearestByLocation(results)
        if (!results.length) toast.info('No nearby centers available.')
      } else {
        setNearestByAvailability(results)
        if (!results.length) toast.info('No available appointments found in the next period.')
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.details?.[0]?.message ||
        'Failed to load nearest centers'
      setNearestError(message)
      toast.error(message)
    } finally {
      if (mode === 'location') {
        setLoadingNearestLocation(false)
      } else {
        setLoadingNearestAvailability(false)
      }
    }
  }

  const ensureOrganizationForBranch = (branchId) => {
    if (!branchId) return
    const branch = branchMap[branchId]
    if (branch?.organizationId) {
      setForm((prev) => ({
        ...prev,
        organizationId: branch.organizationId,
      }))
    }
  }

  const applySuggestion = (suggestion) => {
    if (!suggestion) return
    ensureOrganizationForBranch(suggestion.organizationBranchId)
    setForm((prev) => ({
      ...prev,
      organizationBranchId: suggestion.organizationBranchId || prev.organizationBranchId,
      appointmentDate: suggestion.nextAvailableDate || prev.appointmentDate,
      appointmentTime: suggestion.nextAvailableTime
        ? suggestion.nextAvailableTime.substring(0, 5)
        : prev.appointmentTime,
    }))
  }

  const renderSuggestionList = (items, title, accent) => {
    if (!items.length) return null
    return (
      <div
        className={`rounded-lg border ${accent.border} ${accent.background} p-3 space-y-3 text-sm`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            {accent.icon}
            <span>{title}</span>
          </div>
          <span className="text-xs text-gray-600">{items.length} result(s)</span>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={`${item.organizationBranchId}-${item.nextAvailableDate || 'na'}`}
              className="rounded-md border border-gray-200 bg-white/70 p-3 shadow-xs"
            >
              <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold text-gray-900">
                  {item.branchName || 'Branch'}
                </div>
                {item.organizationName && (
                  <div className="text-xs text-gray-500">{item.organizationName}</div>
                )}
                {item.address && <div className="text-xs text-gray-500">{item.address}</div>}
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span>
                    Distance: <strong>{formatDistance(item.distanceKm)}</strong>
                  </span>
                  <span>
                    Next date: <strong>{formatDateDisplay(item.nextAvailableDate)}</strong>
                  </span>
                  <span>
                    Time: <strong>{formatTimeDisplay(item.nextAvailableTime)}</strong>
                  </span>
                  <span>
                    Capacity:{' '}
                    <strong>
                      {item.remainingCapacity ?? 0} / {item.dailyCapacity ?? '—'}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-blue-500 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  onClick={() => applySuggestion(item)}
                >
                  Use this suggestion
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!open) return null

  const update = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()

    if (!form.organizationBranchId) {
      toast.error('Please select a branch')
      return
    }

    if (!form.beneficiaryId) {
      toast.error('Please select a beneficiary')
      return
    }

    if (!form.serviceTypeId) {
      toast.error('Please select a service type')
      return
    }

    if (!form.appointmentStatusId) {
      toast.error('Please select appointment status')
      return
    }

    try {
      setSaving(true)

      const payload = {
        appointmentRequestId: form.appointmentRequestId || null,
        beneficiaryId: form.beneficiaryId,
        organizationBranchId: form.organizationBranchId,
        serviceTypeId: form.serviceTypeId,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime ? `${form.appointmentTime}:00` : null,
        slotDurationMinutes: form.slotDurationMinutes ? parseInt(form.slotDurationMinutes) : null,
        appointmentStatusId: form.appointmentStatusId,
        priority: form.priority || 'NORMAL',
        notes: form.notes || null,
        actionTypeId: form.actionTypeId || null,
        actionNotes: form.actionNotes || null,
      }

      if (mode === 'edit' && initial?.appointmentId) {
        await api.put(`/appointment-service/api/admin/appointments/${initial.appointmentId}`, {
          ...payload,
          updatedById: initial.updatedById || null,
        })
        toast.success('Appointment updated successfully')
      } else {
        await api.post('/appointment-service/api/admin/appointments', {
          ...payload,
          createdById: initial?.createdById || null,
        })
        toast.success('Appointment created successfully')
      }

      onSuccess?.()
      onClose?.()
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.details?.[0]?.message ||
        'Operation failed'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[95vh] overflow-y-auto space-y-5"
      >
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold">
            {mode === 'edit' ? 'Edit Appointment' : 'Create Appointment'}
          </h2>
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => {
              if (!saving) onClose?.()
            }}
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Beneficiary <span className="text-red-500">*</span>
            </label>
            <Select
              options={beneficiaryOptions}
              value={beneficiaryOptions.find((opt) => opt.value === form.beneficiaryId) || null}
              onChange={(option) => update('beneficiaryId', option ? option.value : '')}
              placeholder="Select beneficiary"
              isSearchable
              isClearable
              styles={{
                control: (provided) => ({ ...provided, minHeight: 38, borderRadius: '0.375rem' }),
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Service Type <span className="text-red-500">*</span>
            </label>
            <Select
              options={serviceTypeOptions}
              value={serviceTypeOptions.find((opt) => opt.value === form.serviceTypeId) || null}
              onChange={(option) => update('serviceTypeId', option ? option.value : '')}
              placeholder="Select service type"
              isSearchable
              isClearable
              styles={serviceTypeSelectStyles}
              formatOptionLabel={formatServiceTypeOptionLabel}
              isOptionDisabled={(option) => Boolean(option?.isDisabled)}
            />
          </div>
        </div>

        {(form.beneficiaryId && form.serviceTypeId) && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 space-y-3 text-sm text-blue-900">
            <div className="flex items-center gap-2 font-medium">
              <MapPin className="h-4 w-4" />
              <span>Nearest center suggestions</span>
            </div>
            {beneficiaryLocation?.latitude && beneficiaryLocation?.longitude ? (
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1 text-xs">
                  <div>
                    Beneficiary:&nbsp;
                    <span className="font-semibold text-blue-700">
                      {beneficiaryLocation?.name || 'Beneficiary'}
                    </span>
                  </div>
                  <div className="text-blue-700/80">
                    Lat: {Number(beneficiaryLocation.latitude).toFixed(4)} · Lng:{' '}
                    {Number(beneficiaryLocation.longitude).toFixed(4)}
                  </div>
                </div>
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
                    className="inline-flex items-center gap-2 rounded-md border border-blue-600 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    onClick={() => handleNearestSearch('location')}
                    disabled={loadingNearestLocation}
                  >
                    {loadingNearestLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    Show nearest branch
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-amber-500 bg-white px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                    onClick={() => handleNearestSearch('availability')}
                    disabled={loadingNearestAvailability}
                  >
                    {loadingNearestAvailability ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarIcon className="h-4 w-4" />
                    )}
                    Show nearest appointment
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-700">
                This beneficiary does not have coordinates saved yet. Update beneficiary location to
                enable nearest branch suggestions.
              </p>
            )}
            {nearestError && <p className="text-xs text-red-600">{nearestError}</p>}
            <div className="space-y-3">
              {renderSuggestionList(nearestByLocation, 'Nearest by location', {
                border: 'border-blue-200',
                background: 'bg-white',
                icon: <Navigation className="h-4 w-4 text-blue-500" />,
              })}
              {renderSuggestionList(nearestByAvailability, 'Nearest by earliest availability', {
                border: 'border-amber-200',
                background: 'bg-white',
                icon: <Route className="h-4 w-4 text-amber-500" />,
              })}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization</label>
            <SearchableSelect
              options={organizationOptions}
              value={form.organizationId}
              onChange={(value) => update('organizationId', value)}
              placeholder="Select organization"
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Center / Branch <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={filteredBranchOptions}
              value={form.organizationBranchId}
              onChange={(value) => update('organizationBranchId', value)}
              placeholder={form.organizationId ? 'Select branch' : 'Select organization first'}
              isDisabled={!form.organizationId && filteredBranchOptions.length === 0}
              isClearable
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Appointment Status <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={statusOptions}
              value={form.appointmentStatusId}
              onChange={(value) => update('appointmentStatusId', value)}
              placeholder="Select status"
              isClearable={false}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <SearchableSelect
              options={PRIORITY_OPTIONS}
              value={form.priority}
              onChange={(value) => update('priority', value || 'NORMAL')}
              placeholder="Select priority"
              isClearable
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Appointment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="border rounded px-3 py-2 w-full"
              value={form.appointmentDate}
              onChange={(e) => update('appointmentDate', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Appointment Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              className="border rounded px-3 py-2 w-full"
              value={form.appointmentTime}
              onChange={(e) => update('appointmentTime', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Slot Duration</label>
            <SearchableSelect
              options={SLOT_DURATION_OPTIONS}
              value={form.slotDurationMinutes}
              onChange={(value) => update('slotDurationMinutes', value)}
              placeholder="Select duration"
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Appointment Request ID (optional)</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              value={form.appointmentRequestId}
              onChange={(e) => update('appointmentRequestId', e.target.value)}
              placeholder="Request ID"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Action Type ID (optional)</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              value={form.actionTypeId}
              onChange={(e) => update('actionTypeId', e.target.value)}
              placeholder="UUID"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Action Notes</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              value={form.actionNotes}
              onChange={(e) => update('actionNotes', e.target.value)}
              placeholder="Action notes"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="border rounded px-3 py-2 w-full min-h-[100px]"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Additional notes"
          />
        </div>

        <div className="flex justify-end gap-2 border-t pt-3">
          <button
            type="button"
            className="border rounded px-4 py-2 hover:bg-gray-50"
            onClick={() => {
              if (!saving) onClose?.()
            }}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="border rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}



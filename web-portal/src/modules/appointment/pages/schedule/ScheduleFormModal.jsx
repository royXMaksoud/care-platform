import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import SearchableSelect from '@/components/SearchableSelect'
import Select from 'react-select'
import { useSystemSectionScopes } from '@/modules/appointment/hooks/useSystemSectionScopes'
import { SYSTEM_SECTIONS } from '@/config/systemSectionConstants'

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday (الأحد)' },
  { value: 1, label: 'Monday (الاثنين)' },
  { value: 2, label: 'Tuesday (الثلاثاء)' },
  { value: 3, label: 'Wednesday (الأربعاء)' },
  { value: 4, label: 'Thursday (الخميس)' },
  { value: 5, label: 'Friday (الجمعة)' },
  { value: 6, label: 'Saturday (السبت)' },
]

const SLOT_DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
  { value: 120, label: '120 minutes' },
]

export default function ScheduleFormModal({ 
  open, 
  mode = 'create', 
  initial, 
  onClose, 
  onSuccess,
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    organizationId: '',
    organizationBranchId: '',
    daysOfWeek: [], // Changed to array for multi-select
    startTime: '',
    endTime: '',
    slotDurationMinutes: 30,
    maxCapacityPerSlot: 10,
    isActive: true,
    startDate: '',
    endDate: '',
    offDays: [],
  })
  
  const [allOrganizationBranches, setAllOrganizationBranches] = useState([])
  const [loadingOrganizations, setLoadingOrganizations] = useState(false)

  const uiLang = (typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ar')) ? 'ar' : 'en'
  const { scopeValueIds, isLoading: scopesLoading } = useSystemSectionScopes(SYSTEM_SECTIONS.APPOINTMENT_SCHEDULING)

  const lastScopeFetchKeyRef = useRef(null)

  useEffect(() => {
    if (!open || scopesLoading) return

    let isActive = true

    const loadScopedBranches = async () => {
      setLoadingOrganizations(true)
      try {
        const allowedScopeIds = Array.isArray(scopeValueIds) ? scopeValueIds : []
        const scopeKey = JSON.stringify({ scopeValueIds: allowedScopeIds, lang: uiLang })

        if (!allowedScopeIds.length) {
          lastScopeFetchKeyRef.current = scopeKey
          setAllOrganizationBranches([])
          setLoadingOrganizations(false)
          return
        }

        if (lastScopeFetchKeyRef.current === scopeKey) {
          setLoadingOrganizations(false)
          return
        }

        lastScopeFetchKeyRef.current = scopeKey

        const payload = { scopeValueIds: allowedScopeIds, lang: uiLang }

        const { data } = await api.post('/access/api/dropdowns/organization-branches/by-scope', payload)
        if (!isActive) return

        const items = Array.isArray(data) ? data : []
        setAllOrganizationBranches(items)
      } catch (err) {
        if (!isActive) return
        toast.error('Failed to load organizations')
        setAllOrganizationBranches([])
        lastScopeFetchKeyRef.current = null
      } finally {
        if (isActive) {
          setLoadingOrganizations(false)
        }
      }
    }

    loadScopedBranches()

    return () => {
      isActive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, uiLang, scopeValueIds, scopesLoading])

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
    if (!form.organizationId) return []
    return allOrganizationBranches
      .filter((item) => item.organizationId === form.organizationId)
      .map((item) => ({
        value: item.organizationBranchId,
        label: item.organizationBranchName || 'Unknown branch',
      }))
  }, [allOrganizationBranches, form.organizationId])

  useEffect(() => {
    if (!form.organizationId) return
    if (!organizationOptions.some((org) => org.value === form.organizationId)) {
      setForm((prev) => ({ ...prev, organizationId: '', organizationBranchId: '' }))
    }
  }, [organizationOptions, form.organizationId])

  useEffect(() => {
    if (!form.organizationId) {
      if (form.organizationBranchId) {
        setForm((prev) => ({ ...prev, organizationBranchId: '' }))
      }
      return
    }

    if (!branchOptions.length) {
      if (form.organizationBranchId) {
        setForm((prev) => ({ ...prev, organizationBranchId: '' }))
      }
      return
    }

    if (!branchOptions.some((branch) => branch.value === form.organizationBranchId)) {
      setForm((prev) => ({ ...prev, organizationBranchId: '' }))
    }
  }, [form.organizationId, form.organizationBranchId, branchOptions])

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setForm({
        organizationId: initial.organizationId || '',
        organizationBranchId: initial.organizationBranchId || '',
        daysOfWeek: initial.dayOfWeek !== null && initial.dayOfWeek !== undefined 
          ? [initial.dayOfWeek] 
          : [], // For edit, convert single day to array
        startTime: initial.startTime?.substring(0, 5) || '',
        endTime: initial.endTime?.substring(0, 5) || '',
        slotDurationMinutes: initial.slotDurationMinutes || 30,
        maxCapacityPerSlot: initial.maxCapacityPerSlot || 10,
        isActive: initial.isActive !== false,
        startDate: initial.startDate || '',
        endDate: initial.endDate || '',
        offDays: Array.isArray(initial.offDays) ? initial.offDays : [],
      })
    } else {
      setForm({
        organizationId: '',
        organizationBranchId: '',
        daysOfWeek: [], // Empty array for new schedule
        startTime: '',
        endTime: '',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 10,
        isActive: true,
        startDate: '',
        endDate: '',
        offDays: [],
      })
    }
  }, [open, mode, initial])

  if (!open) return null

  const extractErrorMessage = (err) => {
    const data = err?.response?.data
    const status = err?.response?.status
    if (Array.isArray(data?.details) && data.details.length) {
      const msgs = data.details.map((d) => d?.message).filter(Boolean)
      if (msgs.length) return msgs.join('\n')
    }
    if (data?.message) return data.message
    if (status === 403) return data?.message || 'You are not allowed to perform this action'
    if (status === 409) return 'Conflict: duplicate or invalid state'
    return 'Operation failed'
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      // Validation: daysOfWeek is required
      if (!Array.isArray(form.daysOfWeek) || form.daysOfWeek.length === 0) {
        toast.error('Please select at least one day of week')
        return
      }

      setSaving(true)

      // Validate all day values are valid
      const daysOfWeekValues = form.daysOfWeek
        .map(d => typeof d === 'number' ? d : parseInt(d))
        .filter(d => !isNaN(d) && d >= 0 && d <= 6)
      
      if (daysOfWeekValues.length === 0) {
        toast.error('Invalid day of week values')
        return
      }

      // Base payload without dayOfWeek
      const basePayload = {
        organizationBranchId: form.organizationBranchId,
        startTime: form.startTime + ':00',
        endTime: form.endTime + ':00',
        slotDurationMinutes: parseInt(form.slotDurationMinutes),
        maxCapacityPerSlot: parseInt(form.maxCapacityPerSlot),
        isActive: form.isActive !== false,
        ...(form.startDate && form.endDate
          ? { dateRanges: [{ startDate: form.startDate, endDate: form.endDate }] }
          : {}),
        ...(Array.isArray(form.offDays) && form.offDays.length > 0
          ? { offDays: form.offDays.map((d) => parseInt(d)) }
          : {}),
      }

      if (mode === 'edit' && initial?.scheduleId) {
        // For edit, update single schedule with first selected day
        await api.put(`/appointment/api/admin/schedules/${initial.scheduleId}`, {
          scheduleId: initial.scheduleId,
          ...basePayload,
          dayOfWeek: daysOfWeekValues[0], // Keep single day for edit mode
        })
        toast.success('Schedule updated successfully')
      } else {
        // For create, send array of days to create multiple schedules
        await api.post('/appointment/api/admin/schedules/batch', {
          ...basePayload,
          daysOfWeek: daysOfWeekValues,
        })
        toast.success(`Schedules created successfully for ${daysOfWeekValues.length} day(s)`)
      }

      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form onSubmit={submit} className="bg-white rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto space-y-4">
        <div className="text-lg font-semibold border-b pb-2">
          {mode === 'edit' ? 'Edit Schedule' : 'Create Schedule'}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Organization</label>
          <SearchableSelect
            options={organizationOptions}
            value={form.organizationId}
            onChange={(value) => update('organizationId', value)}
            placeholder="Select organization"
            isClearable={false}
            isSearchable={true}
            isLoading={loadingOrganizations}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Center/Branch</label>
          <SearchableSelect
            options={branchOptions}
            value={form.organizationBranchId}
            onChange={(value) => update('organizationBranchId', value)}
            placeholder={form.organizationId ? 'Select center/branch' : 'Select organization first'}
            isDisabled={!form.organizationId || branchOptions.length === 0}
            isClearable={false}
            isSearchable={true}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Days of Week <span className="text-red-500">*</span>
          </label>
          <Select
            options={DAY_OPTIONS}
            value={DAY_OPTIONS.filter(opt => form.daysOfWeek.includes(opt.value))}
            onChange={(selectedOptions) => {
              const values = selectedOptions ? selectedOptions.map(opt => opt.value) : []
              update('daysOfWeek', values)
            }}
            placeholder="Select days"
            isMulti={true}
            isClearable={true}
            isSearchable={false}
            required
            styles={{
              control: (provided, state) => ({
                ...provided,
                borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                '&:hover': {
                  borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
                },
                minHeight: '38px',
                borderRadius: '0.375rem',
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected 
                  ? '#3b82f6' 
                  : state.isFocused 
                  ? '#dbeafe' 
                  : 'white',
                color: state.isSelected ? 'white' : '#1f2937',
                cursor: 'pointer',
                '&:active': {
                  backgroundColor: '#2563eb',
                },
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 50,
              }),
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Start Time</label>
            <input
              type="time"
              className="border rounded px-3 py-2"
              value={form.startTime}
              onChange={(e) => update('startTime', e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">End Time</label>
            <input
              type="time"
              className="border rounded px-3 py-2"
              value={form.endTime}
              onChange={(e) => update('endTime', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Slot Duration (minutes)</label>
            <SearchableSelect
              options={SLOT_DURATION_OPTIONS}
              value={form.slotDurationMinutes}
              onChange={(value) => update('slotDurationMinutes', value)}
              placeholder="Select duration"
              isClearable={false}
              isSearchable={false}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Max Capacity per Slot</label>
            <input
              type="number"
              className="border rounded px-3 py-2"
              value={form.maxCapacityPerSlot}
              onChange={(e) => update('maxCapacityPerSlot', e.target.value)}
              min={1}
              max={100}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Start Date (optional)</label>
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">End Date (optional)</label>
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={form.endDate}
              onChange={(e) => update('endDate', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Weekly Off Days (exclude, optional)</label>
          <Select
            options={DAY_OPTIONS}
            value={DAY_OPTIONS.filter(opt => form.offDays.includes(opt.value))}
            onChange={(selectedOptions) => {
              const values = selectedOptions ? selectedOptions.map(opt => opt.value) : []
              update('offDays', values)
            }}
            placeholder="Select off days"
            isMulti={true}
            isClearable={true}
            isSearchable={false}
            styles={{
              control: (provided, state) => ({
                ...provided,
                borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                '&:hover': {
                  borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
                },
                minHeight: '38px',
                borderRadius: '0.375rem',
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected 
                  ? '#3b82f6' 
                  : state.isFocused 
                  ? '#dbeafe' 
                  : 'white',
                color: state.isSelected ? 'white' : '#1f2937',
                cursor: 'pointer',
                '&:active': {
                  backgroundColor: '#2563eb',
                },
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 50,
              }),
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={!!form.isActive}
            onChange={(e) => update('isActive', e.target.checked)}
          />
          <label htmlFor="isActive" className="text-sm">Active</label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button 
            type="button" 
            className="border rounded px-4 py-2 hover:bg-gray-50" 
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="border rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700" 
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}


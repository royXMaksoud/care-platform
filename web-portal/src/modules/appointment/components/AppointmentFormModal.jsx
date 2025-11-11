import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import SearchableSelect from '@/components/SearchableSelect'
import Select from 'react-select'

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
        appointmentTime: initial.appointmentTime
          ? initial.appointmentTime.substring(0, 5)
          : '',
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
              styles={{
                control: (provided) => ({ ...provided, minHeight: 38, borderRadius: '0.375rem' }),
              }}
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


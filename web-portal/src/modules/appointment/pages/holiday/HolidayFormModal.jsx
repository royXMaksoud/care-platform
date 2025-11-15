import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import SearchableSelect from '@/components/SearchableSelect'
import { useSystemSectionScopes } from '@/modules/appointment/hooks/useSystemSectionScopes'
import { SYSTEM_SECTIONS } from '@/config/systemSectionConstants'

export default function HolidayFormModal({ 
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
    holidayDate: '',
    name: '',
    reason: '',
    isRecurringYearly: false,
    isActive: true,
  })
  
  const [allOrganizationBranches, setAllOrganizationBranches] = useState([])
  const [loadingScopedBranches, setLoadingScopedBranches] = useState(false)

  const uiLang = (typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ar')) ? 'ar' : 'en'
  const { scopeValueIds, isLoading: scopesLoading } = useSystemSectionScopes(SYSTEM_SECTIONS.APPOINTMENT_SCHEDULING)
  const lastScopeFetchKeyRef = useRef(null)

  useEffect(() => {
    if (!open || scopesLoading) return

    let isActive = true

    const loadScopedBranches = async () => {
      try {
        setLoadingScopedBranches(true)

        const allowedScopeIds = Array.isArray(scopeValueIds) ? scopeValueIds : []
        const scopeKey = JSON.stringify({ scopeValueIds: allowedScopeIds, lang: uiLang })

        if (!allowedScopeIds.length) {
          lastScopeFetchKeyRef.current = scopeKey
          setAllOrganizationBranches([])
          return
        }

        if (lastScopeFetchKeyRef.current === scopeKey) {
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
        console.error('Failed to load organizations:', err)
        toast.error('Failed to load organizations')
        lastScopeFetchKeyRef.current = null
        setAllOrganizationBranches([])
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
    if (!form.organizationId && form.organizationBranchId) {
      const match = allOrganizationBranches.find(
        (item) => item.organizationBranchId === form.organizationBranchId
      )
      if (match?.organizationId) {
        setForm((prev) => ({ ...prev, organizationId: match.organizationId }))
      }
    }
  }, [form.organizationId, form.organizationBranchId, allOrganizationBranches])

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
        holidayDate: initial.holidayDate ? initial.holidayDate.split('T')[0] : '',
        name: initial.name || '',
        reason: initial.reason || '',
        isRecurringYearly: initial.isRecurringYearly === true,
        isActive: initial.isActive !== false,
      })
    } else {
      setForm({
        organizationId: '',
        organizationBranchId: '',
        holidayDate: '',
        name: '',
        reason: '',
        isRecurringYearly: false,
        isActive: true,
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
      setSaving(true)

      const payload = {
        organizationBranchId: form.organizationBranchId,
        holidayDate: form.holidayDate,
        name: form.name,
        reason: form.reason || null,
        isRecurringYearly: form.isRecurringYearly === true,
        isActive: form.isActive !== false,
      }

      if (mode === 'edit' && initial?.holidayId) {
        await api.put(`/appointment/api/admin/holidays/${initial.holidayId}`, {
          holidayId: initial.holidayId,
          ...payload,
        })
        toast.success('Holiday updated successfully')
      } else {
        await api.post('/appointment/api/admin/holidays', payload)
        toast.success('Holiday created successfully')
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
          {mode === 'edit' ? 'Edit Holiday' : 'Create Holiday'}
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
            isLoading={loadingScopedBranches}
            isDisabled={mode === 'edit'}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Center/Branch <span className="text-red-500">*</span></label>
          <SearchableSelect
            options={branchOptions}
            value={form.organizationBranchId}
            onChange={(value) => update('organizationBranchId', value)}
            placeholder={form.organizationId ? 'Select center/branch' : 'Select organization first'}
            isDisabled={!form.organizationId || branchOptions.length === 0}
            isClearable={false}
            isSearchable={true}
            isLoading={loadingScopedBranches}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Holiday Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={form.holidayDate}
            onChange={(e) => update('holidayDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Holiday Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="border rounded px-3 py-2"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g., Christmas Day, Eid Al-Fitr"
            maxLength={200}
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Reason/Description</label>
          <textarea
            className="border rounded px-3 py-2"
            value={form.reason}
            onChange={(e) => update('reason', e.target.value)}
            placeholder="Why is this a holiday? (optional)"
            rows={3}
            maxLength={1000}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isRecurringYearly"
            type="checkbox"
            checked={!!form.isRecurringYearly}
            onChange={(e) => update('isRecurringYearly', e.target.checked)}
          />
          <label htmlFor="isRecurringYearly" className="text-sm">
            Recurring Yearly
            <span className="text-xs text-gray-500 block">If checked, this holiday will repeat every year on the same date</span>
          </label>
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


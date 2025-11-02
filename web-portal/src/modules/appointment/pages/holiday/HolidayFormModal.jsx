import { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import SearchableSelect from '@/components/SearchableSelect'

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
  
  const [organizations, setOrganizations] = useState([])
  const [orgBranches, setOrgBranches] = useState([])
  const [loadingOrganizations, setLoadingOrganizations] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)

  const uiLang = (typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ar')) ? 'ar' : 'en'

  // Load organizations from dropdown API
  useEffect(() => {
    if (!open) return
    
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
        setOrganizations(options)
      } catch (err) {
        console.error('Failed to load organizations:', err)
        toast.error('Failed to load organizations')
      } finally {
        setLoadingOrganizations(false)
      }
    }
    
    loadOrganizations()
  }, [open, uiLang])

  // Load branches when organization changes (cascade dropdown)
  useEffect(() => {
    if (!form.organizationId) {
      setOrgBranches([])
      setForm(prev => ({ ...prev, organizationBranchId: '' }))
      return
    }
    
    const loadBranches = async () => {
      try {
        setLoadingBranches(true)
        const res = await api.get('/access/api/cascade-dropdowns/access.organization-branches-by-organization', {
          params: {
            organizationId: form.organizationId,
            lang: uiLang
          }
        })
        const options = (res?.data || []).map((item) => ({
          value: item.id || item.value,
          label: item.name || item.label || 'Unknown',
        }))
        setOrgBranches(options)
        // Reset branch selection when organization changes (only in create mode)
        if (mode === 'create') {
          setForm(prev => ({ ...prev, organizationBranchId: '' }))
        }
      } catch (err) {
        console.error('Failed to load organization branches:', err)
        toast.error('Failed to load branches')
        setOrgBranches([])
      } finally {
        setLoadingBranches(false)
      }
    }
    
    loadBranches()
  }, [form.organizationId, uiLang, mode])

  // Load organizationId from branch if not provided in edit mode
  useEffect(() => {
    if (!open || mode !== 'edit' || !initial?.organizationBranchId) return
    if (initial.organizationId) return // Already have organizationId
    
    const loadBranchOrgId = async () => {
      try {
        const res = await api.get(`/access/api/organization-branches/${initial.organizationBranchId}`)
        const orgId = res?.data?.organizationId
        if (orgId) {
          setForm(prev => ({ ...prev, organizationId: orgId }))
        }
      } catch (err) {
        console.error('Failed to load branch organization:', err)
      }
    }
    
    loadBranchOrgId()
  }, [open, mode, initial?.organizationBranchId, initial?.organizationId])

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
            options={organizations}
            value={form.organizationId}
            onChange={(value) => update('organizationId', value)}
            placeholder="Select organization"
            isClearable={false}
            isSearchable={true}
            isLoading={loadingOrganizations}
            isDisabled={mode === 'edit'}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Center/Branch <span className="text-red-500">*</span></label>
          <SearchableSelect
            options={orgBranches}
            value={form.organizationBranchId}
            onChange={(value) => update('organizationBranchId', value)}
            placeholder={form.organizationId ? 'Select center/branch' : 'Select organization first'}
            isDisabled={!form.organizationId || loadingBranches}
            isClearable={false}
            isSearchable={true}
            isLoading={loadingBranches}
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


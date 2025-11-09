import { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import SearchableSelect from '@/components/SearchableSelect'
import Select from 'react-select'
import { usePermissionCheck } from '@/contexts/PermissionsContext'

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
  
  const [organizations, setOrganizations] = useState([])
  const [orgBranches, setOrgBranches] = useState([])
  const [loadingOrganizations, setLoadingOrganizations] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)

  const uiLang = (typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ar')) ? 'ar' : 'en'
  const { getSectionPermissions, permissionsData } = usePermissionCheck()

  // Load organizations based on user permissions
  useEffect(() => {
    if (!open) return

    const loadOrganizations = async () => {
      try {
        setLoadingOrganizations(true)

        // Extract user's permission scopes from permissions context
        let sectionPerms = getSectionPermissions('Appointment Schedule Mangement', 'Appointments')
        console.log('🔍 DEBUG: sectionPerms (with system):', sectionPerms)

        // If no actions found, try without system name
        if (!sectionPerms.actions || sectionPerms.actions.length === 0) {
          console.log('🔍 DEBUG: No actions with system name, trying without...')
          sectionPerms = getSectionPermissions('Appointment Schedule Mangement')
          console.log('🔍 DEBUG: sectionPerms (without system):', sectionPerms)
        }

        console.log('🔍 DEBUG: Final sectionPerms.actions:', sectionPerms.actions)

        // Extract scope values from permission actions
        const scopeValueIds = []
        let systemSectionActionId = null

        sectionPerms.actions?.forEach((action, idx) => {
          console.log(`🔍 DEBUG: action[${idx}]:`, action)
          console.log(`🔍 DEBUG: action[${idx}].scopes:`, action.scopes)

          // Store the first action ID (usually all actions in a section have same action ID)
          if (!systemSectionActionId && action.systemSectionActionId) {
            systemSectionActionId = action.systemSectionActionId
            console.log(`✅ DEBUG: Found systemSectionActionId:`, systemSectionActionId)
          }

          action.scopes?.forEach((scope, sidx) => {
            console.log(`🔍 DEBUG: action[${idx}].scopes[${sidx}]:`, scope)
            if (scope.effect === 'ALLOW' && scope.scopeValueId) {
              console.log(`✅ DEBUG: Adding authorized scope value:`, scope.scopeValueId)
              scopeValueIds.push(scope.scopeValueId)
            }
          })
        })
        console.log('✅ DEBUG: Final scopeValueIds:', scopeValueIds)
        console.log('✅ DEBUG: systemSectionActionId:', systemSectionActionId)

        // Load organizations filtered by user's scope values from JWT
        // Backend extracts scope values from JWT claims and filters automatically
        let filteredOrgs = []

        try {
          console.log('📡 Loading organizations (backend filters by JWT scopes)...')
          console.log('📊 User scopeValueIds from permissions:', scopeValueIds)

          // Simple GET request - backend extracts organizationBranchIds from JWT
          // Same pattern as /organization-branches/filter endpoint
          const orgsRes = await api.get('/access/api/dropdowns/organizations', {
            params: { lang: uiLang }
          })

          filteredOrgs = orgsRes?.data || []
          console.log('✅ Organizations loaded (filtered by JWT scopes on backend):', filteredOrgs.length)
          console.log('🔍 Organization data:', filteredOrgs.map(o => ({
            id: o.organizationId || o.id,
            name: o.name
          })))

          if (filteredOrgs.length === 0) {
            console.warn('⚠️ No organizations found for user')
          }
        } catch (err) {
          console.error('Failed to load organizations:', err)
          toast.error('Failed to load organizations')
          filteredOrgs = []
        }

        console.log('✅ Final filtered organizations:', filteredOrgs.length, filteredOrgs.map(o => ({ id: o.organizationId || o.id, name: o.name })))

        const options = filteredOrgs.map((item) => ({
          value: item.organizationId || item.id || item.value,
          label: item.name || item.label || 'Unknown',
        }))

        setOrganizations(options)
      } catch (err) {
        console.error('Failed to load organizations:', err)
        toast.error('Failed to load organizations')
        setOrganizations([])
      } finally {
        setLoadingOrganizations(false)
      }
    }

    loadOrganizations()
  }, [open, uiLang, permissionsData])

  // Load branches when organization changes (cascade dropdown) - filtered by permissions
  useEffect(() => {
    if (!form.organizationId) {
      setOrgBranches([])
      setForm(prev => ({ ...prev, organizationBranchId: '' }))
      return
    }

    const loadBranches = async () => {
      try {
        setLoadingBranches(true)

        // Extract user's authorized branch IDs from permissions
        let sectionPerms = getSectionPermissions('Appointment Schedule Mangement', 'Appointments')
        console.log('🔍 Branch Loading: sectionPerms:', sectionPerms)

        // If no actions found, try without system name
        if (!sectionPerms.actions || sectionPerms.actions.length === 0) {
          sectionPerms = getSectionPermissions('Appointment Schedule Mangement')
        }

        const scopeValueIds = []
        let systemSectionActionId = null

        sectionPerms.actions?.forEach(action => {
          if (!systemSectionActionId && action.systemSectionActionId) {
            systemSectionActionId = action.systemSectionActionId
          }
          action.scopes?.forEach(scope => {
            if (scope.effect === 'ALLOW' && scope.scopeValueId) {
              scopeValueIds.push(scope.scopeValueId)
            }
          })
        })

        console.log('🔍 Branch Loading: scopeValueIds:', scopeValueIds, 'systemSectionActionId:', systemSectionActionId)

        // Load branches for the selected organization with scope filtering
        // Apply scope restrictions to show only authorized branches for this org
        let filteredBranches = []

        try {
          console.log('📡 Loading branches for org:', form.organizationId)
          console.log('📊 Using scopeValueIds:', scopeValueIds)

          // Load all branches for this organization first
          const branchesRes = await api.get('/access/api/cascade-dropdowns/access.organization-branches-by-organization', {
            params: {
              organizationId: form.organizationId,
              lang: uiLang
            }
          })

          const allBranchesForOrg = branchesRes?.data || []
          console.log('✅ All branches loaded for org:', allBranchesForOrg.length)
          console.log('🔍 All branch IDs:', allBranchesForOrg.map(b => ({ id: b.organizationBranchId || b.id, name: b.name })))

          // Filter branches by user's authorized scope values
          // Only show branches that user has permission to access (from JWT scopes)
          if (scopeValueIds.length > 0) {
            const authorizedBranchIds = new Set(scopeValueIds)
            console.log('🔍 Authorized branch IDs (from user scopes):', Array.from(authorizedBranchIds))

            filteredBranches = allBranchesForOrg.filter(b => {
              const branchId = b.organizationBranchId || b.id || b.value
              const isAuthorized = authorizedBranchIds.has(branchId)
              if (isAuthorized) {
                console.log('✅ Branch authorized:', { id: branchId, name: b.name })
              } else {
                console.log('❌ Branch NOT authorized:', { id: branchId, name: b.name })
              }
              return isAuthorized
            })
            console.log('✅ Final filtered branches for org:', filteredBranches.length)
          } else {
            // If user has no specific branch scopes, show all branches for org
            console.log('⚠️ User has no specific branch scopes, showing all branches')
            filteredBranches = allBranchesForOrg
          }
        } catch (err) {
          console.error('Failed to load branches:', err)
          toast.error('Failed to load branches')
          filteredBranches = []
        }

        const options = filteredBranches.map((item) => ({
          value: item.organizationBranchId || item.id || item.value,
          label: item.name || item.label || item.branchName || 'Unknown',
        }))

        console.log('✅ Branch options:', options)
        setOrgBranches(options)
        // Reset branch selection when organization changes
        setForm(prev => ({ ...prev, organizationBranchId: '' }))
      } catch (err) {
        console.error('Failed to load organization branches:', err)
        toast.error('Failed to load branches')
        setOrgBranches([])
      } finally {
        setLoadingBranches(false)
      }
    }

    loadBranches()
  }, [form.organizationId, uiLang, permissionsData])

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
            options={organizations}
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


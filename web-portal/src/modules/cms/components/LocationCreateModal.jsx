// src/modules/cms/components/LocationCreateModal.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import SearchableSelect from '@/components/SearchableSelect'
import MapPickerModal from '@/components/MapPickerModal'
import { calculateLevel, buildLineagePath } from '../utils/locationHelpers'
import { X, MapPin, Copy } from 'lucide-react'

const LEVEL_OPTIONS = [
  { value: 0, label: 'Governorate' },
  { value: 1, label: 'District' },
  { value: 2, label: 'Subdistrict' },
  { value: 3, label: 'Community' },
  { value: 4, label: 'Neighborhood' },
]

export default function LocationCreateModal({
  open,
  mode = 'create',
  initial,
  onClose,
  onSubmit,
  busy = false,
}) {
  const [form, setForm] = useState({
    countryId: '',
    code: '',
    name: '',
    level: '',
    parentLocationId: '',
    lineagePath: '',
    latitude: '',
    longitude: '',
  })

  const [countries, setCountries] = useState([])
  const [parentLocations, setParentLocations] = useState([])
  const [selectedParent, setSelectedParent] = useState(null)
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingParents, setLoadingParents] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const firstFocusRef = useRef(null)

  // Fetch countries on mount
  useEffect(() => {
    if (!open) return

    const fetchCountries = async () => {
      setLoadingCountries(true)
      try {
        const { data } = await api.post('/access/api/code-countries/filter', {
          criteria: [{ 
            key: 'isActive', 
            operator: 'EQUAL', 
            value: true,
            dataType: 'BOOLEAN' 
          }]
        }, {
          params: { page: 0, size: 1000 }
        })
        setCountries(data.content || [])
      } catch (err) {
        console.error('Failed to load countries:', err)
        toast.error('Failed to load countries')
      } finally {
        setLoadingCountries(false)
      }
    }

    fetchCountries()
  }, [open])

  // Fetch parent locations when country changes
  useEffect(() => {
    if (!open || !form.countryId) {
      setParentLocations([])
      setSelectedParent(null)
      return
    }

    const fetchParents = async () => {
      if (!form.countryId) {
        setParentLocations([])
        return
      }
      
      setLoadingParents(true)
      try {
        // LocationSpecificationBuilder expects 'operator' from Map (line 241)
        const { data } = await api.post('/access/api/locations/filter', {
          criteria: [
            {
              key: 'countryId',
              operator: 'EQUAL',
              value: form.countryId,
              dataType: 'UUID',
            },
            {
              key: 'isActive',
              operator: 'EQUAL',
              value: true,
              dataType: 'BOOLEAN',
            },
          ],
        }, {
          params: { page: 0, size: 1000 }
        })
        setParentLocations(data.content || [])
      } catch (err) {
        console.error('Failed to load parent locations:', err?.response?.data || err)
        toast.error(err?.response?.data?.message || 'Failed to load parent locations')
      } finally {
        setLoadingParents(false)
      }
    }

    fetchParents()
  }, [open, form.countryId])

  // Load parent location details when selected
  useEffect(() => {
    if (!form.parentLocationId) {
      setSelectedParent(null)
      return
    }

    const parent = parentLocations.find(loc => loc.locationId === form.parentLocationId)
    setSelectedParent(parent || null)
  }, [form.parentLocationId, parentLocations])

  // Initialize form from initial prop
  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        countryId: initial.countryId || '',
        code: initial.code || '',
        name: initial.name || '',
        level: initial.level ?? '',
        parentLocationId: initial.parentLocationId || '',
        lineagePath: initial.lineagePath || '',
        latitude: initial.latitude ?? '',
        longitude: initial.longitude ?? '',
      })
    } else {
      setForm({
        countryId: '',
        code: '',
        name: '',
        level: '',
        parentLocationId: '',
        lineagePath: '',
        latitude: '',
        longitude: '',
      })
    }
  }, [open, initial])

  // Auto-calculate level and lineage path when parent changes
  useEffect(() => {
    if (!open || mode === 'edit') return // Only auto-calculate for create mode
    
    if (selectedParent) {
      // Auto-calculate level
      const newLevel = calculateLevel(selectedParent)
      setForm(prev => ({ ...prev, level: newLevel }))

      // Auto-suggest lineage path
      if (form.code) {
        const country = countries.find(c => c.countryId === form.countryId)
        const newPath = buildLineagePath(
          { code: form.code, countryCode: country?.code || '' },
          selectedParent
        )
        setForm(prev => ({ ...prev, lineagePath: newPath }))
      }
    } else {
      // No parent - reset level to 0 and clear lineage path
      setForm(prev => ({ ...prev, level: 0, lineagePath: '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParent, open, mode, form.code, form.countryId, countries])

  // Auto-update lineage path when code changes
  useEffect(() => {
    if (!open || mode === 'edit' || !form.code) return

    if (selectedParent && form.code) {
      const country = countries.find(c => c.countryId === form.countryId)
      const newPath = buildLineagePath(
        { code: form.code, countryCode: country?.code || '' },
        selectedParent
      )
      setForm(prev => ({ ...prev, lineagePath: newPath }))
    } else if (form.countryId && form.code) {
      const country = countries.find(c => c.countryId === form.countryId)
      const countryCode = country?.code || ''
      const newPath = `/${countryCode.toLowerCase()}/${form.code.toLowerCase()}`
      setForm(prev => ({ ...prev, lineagePath: newPath }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.code, form.countryId, selectedParent, open, mode])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = prevOverflow }
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => firstFocusRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  if (!open) return null

  // Safety check: ensure document.body exists before rendering portal
  if (typeof document === 'undefined' || !document.body) {
    console.error('Cannot render LocationCreateModal: document.body not available')
    return null
  }

  const update = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleParentChange = (value) => {
    update('parentLocationId', value || '')
  }

  const handleCopyCoordinates = () => {
    if (selectedParent?.latitude && selectedParent?.longitude) {
      update('latitude', selectedParent.latitude)
      update('longitude', selectedParent.longitude)
      toast.success('Coordinates copied from parent location')
    } else {
      toast.info('Parent location has no coordinates')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!form.countryId) {
      toast.error('Country is required')
      return
    }
    if (!form.code?.trim()) {
      toast.error('Location Code is required')
      return
    }
    if (!form.name?.trim()) {
      toast.error('Location Name is required')
      return
    }
    if (form.level === '' || form.level === null || form.level === undefined) {
      toast.error('Level is required')
      return
    }

    try {
      const payload = {
        countryId: form.countryId,
        code: form.code.trim(),
        name: form.name.trim(),
        level: parseInt(form.level),
        parentLocationId: form.parentLocationId || null,
        lineagePath: form.lineagePath?.trim() || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        isActive: true,
      }

      if (mode === 'edit' && initial?.locationId) {
        payload.locationId = initial.locationId
        if (initial.rowVersion != null) {
          payload.rowVersion = initial.rowVersion
        }
      }

      await onSubmit?.(payload)
      onClose?.()
      // Reset form
      setForm({
        countryId: '',
        code: '',
        name: '',
        level: '',
        parentLocationId: '',
        lineagePath: '',
        latitude: '',
        longitude: '',
      })
    } catch (err) {
      console.error(err)
      // Error is handled by parent component
    }
  }

  const countryOptions = useMemo(() => 
    countries.map(c => ({ value: c.countryId, label: c.name })),
    [countries]
  )

  const parentOptions = useMemo(() => 
    parentLocations.map(loc => ({
      value: loc.locationId,
      label: `${loc.name} (${LEVEL_OPTIONS.find(o => o.value === loc.level)?.label ?? `Level ${loc.level}`})`
    })),
    [parentLocations]
  )

  // Dynamic placeholder based on UI language
  const namePlaceholder = useMemo(() => {
    const uiLang = (typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ar')) ? 'ar' : 'en'
    return uiLang === 'ar' ? 'e.g., Paris, Damascus' : 'e.g., اللاذقية'
  }, [])

  try {
    return ReactDOM.createPortal(
      <>
        <div
          className="fixed inset-0 z-[1000] bg-black/30 backdrop-blur-sm"
          onClick={busy ? undefined : onClose}
          aria-hidden="true"
        />
        <div
          className="fixed left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2
                     w-[min(96vw,720px)] rounded-2xl border bg-white shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label={mode === 'edit' ? 'Edit Location' : 'Create Location'}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">
            {mode === 'edit' ? 'Edit Location' : 'Create Location'}
          </h3>
          <button
            className="rounded-lg px-2 py-1 hover:bg-gray-100 transition"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Country */}
          <div className="grid gap-2">
            <label htmlFor="countryId" className="text-sm font-medium">
              Country <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={countryOptions}
              value={form.countryId}
              onChange={(value) => {
                update('countryId', value)
                update('parentLocationId', '') // Clear parent when country changes
              }}
              placeholder={loadingCountries ? 'Loading...' : 'Select Country'}
              isLoading={loadingCountries}
              isClearable={false}
              isSearchable={true}
            />
          </div>

          {/* Code */}
          <div className="grid gap-2">
            <label htmlFor="code" className="text-sm font-medium">
              Location Code <span className="text-red-500">*</span>
            </label>
            <input
              id="code"
              type="text"
              ref={firstFocusRef}
              value={form.code}
              onChange={(e) => update('code', e.target.value)}
              placeholder="e.g., LOC001"
              className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Name */}
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder={namePlaceholder}
              className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Parent Location */}
          <div className="grid gap-2">
            <label htmlFor="parentLocationId" className="text-sm font-medium">
              Parent Location <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <SearchableSelect
              options={parentOptions}
              value={form.parentLocationId}
              onChange={handleParentChange}
              placeholder={
                !form.countryId 
                  ? 'Select country first' 
                  : loadingParents 
                    ? 'Loading...' 
                    : 'Select parent location (optional)'
              }
              isLoading={loadingParents}
              isDisabled={!form.countryId || loadingParents}
              isClearable={true}
              isSearchable={true}
            />
            {selectedParent && (
              <p className="text-xs text-gray-500">
                Selected: {selectedParent.name} (Level {selectedParent.level ?? 0})
                {mode === 'create' && (
                  <span className="ml-2 text-blue-600">
                    → Level will be set to {calculateLevel(selectedParent)}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Level */}
          <div className="grid gap-2">
            <label htmlFor="level" className="text-sm font-medium">
              Level <span className="text-red-500">*</span>
            </label>
            <select
              id="level"
              value={form.level}
              onChange={(e) => update('level', e.target.value)}
              className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Level</option>
              {LEVEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} - {opt.label}
                </option>
              ))}
            </select>
            {mode === 'create' && selectedParent && (
              <p className="text-xs text-blue-600">
                Auto-calculated from parent location
              </p>
            )}
          </div>

          {/* Lineage Path */}
          <div className="grid gap-2">
            <label htmlFor="lineagePath" className="text-sm font-medium">
              Lineage Path <span className="text-gray-400 text-xs">(optional, auto-generated)</span>
            </label>
            <input
              id="lineagePath"
              type="text"
              value={form.lineagePath}
              onChange={(e) => update('lineagePath', e.target.value)}
              placeholder="e.g., /sy/lattakia/kassab"
              className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {mode === 'create' && (selectedParent || form.countryId) && (
              <p className="text-xs text-blue-600">
                Auto-generated based on parent and code
              </p>
            )}
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label htmlFor="latitude" className="text-sm font-medium">
                Latitude <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => update('latitude', e.target.value)}
                placeholder="e.g., 35.5241"
                className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="-90"
                max="90"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="longitude" className="text-sm font-medium">
                Longitude <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => update('longitude', e.target.value)}
                placeholder="e.g., 35.7924"
                className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="-180"
                max="180"
              />
            </div>
          </div>

          {/* Coordinate Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              <MapPin className="h-4 w-4" />
              Pick on Map
            </button>
            {selectedParent && (selectedParent.latitude || selectedParent.longitude) && (
              <button
                type="button"
                onClick={handleCopyCoordinates}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                <Copy className="h-4 w-4" />
                Copy from Parent
              </button>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-xl border px-3 py-1 hover:bg-gray-50 transition"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-3 py-1 text-white disabled:opacity-60 transition"
              disabled={busy}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Map Picker Modal */}
      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={form.latitude}
        initialLng={form.longitude}
        onPick={({ latitude, longitude }) => {
          update('latitude', latitude)
          update('longitude', longitude)
        }}
      />
    </>,
    document.body
  )
  } catch (error) {
    console.error('Error rendering LocationCreateModal:', error)
    toast.error('Failed to open create location form. Please refresh the page.')
    return null
  }
}


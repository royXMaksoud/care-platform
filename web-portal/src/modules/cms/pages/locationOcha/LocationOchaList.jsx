import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CrudPage from '@/features/crud/CrudPage'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { CMS_SECTIONS, SYSTEMS } from '@/config/permissions-constants'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { Download, Upload } from 'lucide-react'
import LocationOchaImportModal from '../../components/LocationOchaImportModal'

const SECTION_KEY = CMS_SECTIONS.CODE_TABLE

const stringColumn = (id, header, accessorKey = id, extra = {}) => ({
  id,
  accessorKey,
  header,
  cell: ({ getValue }) => getValue() || '-',
  meta: {
    type: 'string',
    filterKey: accessorKey,
    operators: ['EQUAL', 'LIKE', 'STARTS_WITH'],
    ...extra.meta,
  },
  ...extra,
})

const columns = [
  stringColumn('admin0NameEn', 'Admin0 (EN)'),
  stringColumn('admin1NameEn', 'Admin1 (EN)'),
  stringColumn('admin2NameEn', 'Admin2 (EN)'),
  stringColumn('admin3NameEn', 'Admin3 (EN)'),
  stringColumn('admin4NameEn', 'Admin4 (EN)'),
  stringColumn('admin5NameEn', 'Admin5 (EN)'),
  stringColumn('admin0NameAr', 'Admin0 (AR)'),
  stringColumn('admin1NameAr', 'Admin1 (AR)'),
  stringColumn('admin2NameAr', 'Admin2 (AR)'),
  stringColumn('admin3NameAr', 'Admin3 (AR)'),
  stringColumn('admin4NameAr', 'Admin4 (AR)'),
  stringColumn('governorateGuid', 'Governorate GUID'),
  {
    id: 'latitude',
    accessorKey: 'latitude',
    header: 'Latitude',
    cell: ({ getValue }) => (getValue() ?? '-'),
    meta: { type: 'number', filterKey: 'latitude', operators: ['EQUAL', 'GREATER_THAN', 'LESS_THAN'] },
  },
  {
    id: 'longitude',
    accessorKey: 'longitude',
    header: 'Longitude',
    cell: ({ getValue }) => (getValue() ?? '-'),
    meta: { type: 'number', filterKey: 'longitude', operators: ['EQUAL', 'GREATER_THAN', 'LESS_THAN'] },
  },
]

const formFields = [
  { type: 'text', name: 'admin0NameEn', label: 'Admin0 Name (English)', required: true },
  { type: 'text', name: 'admin0NameAr', label: 'Admin0 Name (Arabic)', required: true },
  { type: 'text', name: 'admin0Pcode', label: 'Admin0 P-Code', required: true, placeholder: 'e.g., SYR' },

  { type: 'text', name: 'admin1NameEn', label: 'Admin1 Name (English)', required: true },
  { type: 'text', name: 'admin1NameAr', label: 'Admin1 Name (Arabic)', required: true },
  { type: 'text', name: 'admin1Pcode', label: 'Admin1 P-Code', required: true },
  { type: 'text', name: 'governorateGuid', label: 'Governorate GUID', required: true },

  { type: 'text', name: 'admin2NameEn', label: 'Admin2 Name (English)', required: true },
  { type: 'text', name: 'admin2NameAr', label: 'Admin2 Name (Arabic)', required: true },
  { type: 'text', name: 'admin2Pcode', label: 'Admin2 P-Code', required: true },

  { type: 'text', name: 'admin3NameEn', label: 'Admin3 Name (English)', required: true },
  { type: 'text', name: 'admin3NameAr', label: 'Admin3 Name (Arabic)', required: true },
  { type: 'text', name: 'admin3Pcode', label: 'Admin3 P-Code', required: true },

  { type: 'text', name: 'admin4NameEn', label: 'Admin4 Name (English)', required: true },
  { type: 'text', name: 'admin4NameAr', label: 'Admin4 Name (Arabic)', required: true },
  { type: 'text', name: 'admin4Pcode', label: 'Admin4 P-Code', required: true },

  { type: 'text', name: 'admin5NameEn', label: 'Admin5 Name (English)' },
  { type: 'text', name: 'admin5NameAr', label: 'Admin5 Name (Arabic)' },
  { type: 'text', name: 'admin5Pcode', label: 'Admin5 P-Code' },

  { type: 'number', name: 'latitude', label: 'Latitude', required: true },
  { type: 'number', name: 'longitude', label: 'Longitude', required: true },
  { type: 'map', name: 'mapPicker', label: 'Pick coordinates on map', latName: 'latitude', lngName: 'longitude', buttonLabel: 'Select coordinates on map' },
]

const sanitize = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }
  return value ?? null
}

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(num) ? null : num
}

const buildPayload = (form) => ({
  admin0NameEn: sanitize(form.admin0NameEn),
  admin0NameAr: sanitize(form.admin0NameAr),
  admin0Pcode: sanitize(form.admin0Pcode),
  admin1NameEn: sanitize(form.admin1NameEn),
  admin1NameAr: sanitize(form.admin1NameAr),
  admin1Pcode: sanitize(form.admin1Pcode),
  governorateGuid: sanitize(form.governorateGuid),
  admin2NameEn: sanitize(form.admin2NameEn),
  admin2NameAr: sanitize(form.admin2NameAr),
  admin2Pcode: sanitize(form.admin2Pcode),
  admin3NameEn: sanitize(form.admin3NameEn),
  admin3NameAr: sanitize(form.admin3NameAr),
  admin3Pcode: sanitize(form.admin3Pcode),
  admin4NameEn: sanitize(form.admin4NameEn),
  admin4NameAr: sanitize(form.admin4NameAr),
  admin4Pcode: sanitize(form.admin4Pcode),
  admin5NameEn: sanitize(form.admin5NameEn),
  admin5NameAr: sanitize(form.admin5NameAr),
  admin5Pcode: sanitize(form.admin5Pcode),
  latitude: parseNumber(form.latitude),
  longitude: parseNumber(form.longitude),
})

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      <p className="text-gray-600">Loading permissions...</p>
    </div>
  </div>
)

const AccessDenied = ({ message }) => (
  <div className="flex items-center justify-center py-12">
    <div className="max-w-md text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Access Denied</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
)

export default function LocationOchaList() {
  const { t } = useTranslation()
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  const permissions = useMemo(() => {
    const primary = getSectionPermissions(SECTION_KEY, SYSTEMS.CMS)
    if (primary && Object.values(primary).some(Boolean)) {
      return primary
    }
    return getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS) || {}
  }, [getSectionPermissions])

  if (isLoading) return <LoadingState />

  const canList = permissions?.canList
  const canCreate = permissions?.canCreate
  const canUpdate = permissions?.canUpdate
  const canDelete = permissions?.canDelete

  if (!canList) {
    return <AccessDenied message="You don't have permission to view Location Syria OCHA records." />
  }

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const response = await api.get('/access/api/location-ocha/template', { responseType: 'blob' })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'location_syria_ocha_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Template downloaded')
    } catch (error) {
      console.error('Failed to download template', error)
      toast.error(error?.response?.data?.message || 'Failed to download template')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleImportSuccess = () => {
    setImportModalOpen(false)
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-4 p-6">
      <CMSBreadcrumb />
      <CrudPage
        key={refreshKey}
        title={t('cms.locationSyriaOcha') || 'Location Syria OCHA'}
        service="access"
        resourceBase="/api/location-ocha"
        idKey="id"
        columns={columns}
        pageSize={25}
        formFields={formFields}
        tableId="location-ocha-list"
        enableCreate={!!canCreate}
        enableEdit={!!canUpdate}
        enableDelete={!!canDelete}
        showAddButton={!!canCreate}
        renderHeaderRight={() =>
          !canCreate ? null : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                disabled={downloadingTemplate}
              >
                <Download className="h-4 w-4" />
                {downloadingTemplate ? 'Preparing...' : 'Download Template'}
              </button>
              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Upload className="h-4 w-4" />
                Import Excel
              </button>
            </div>
          )
        }
        toCreatePayload={(form) => buildPayload(form)}
        toUpdatePayload={(form, row) => ({
          ...buildPayload(form),
          id: row?.id ?? form.id,
        })}
      />

      <LocationOchaImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}



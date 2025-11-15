// src/modules/cms/pages/codeTable/CodeTableDetail.jsx
// Tailwind only. Each grid is filtered by the current codeTableId.

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { api } from '@/lib/axios'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

export default function CodeTableDetail() {
  const { codeTableId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tab, setTab] = useState('languages')
  const [copied, setCopied] = useState(false)
  const [codeTableInfo, setCodeTableInfo] = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  const shortId = codeTableId ? `${String(codeTableId).slice(0, 8)}…` : ''

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(codeTableId || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  // Load CodeTable info including parent details
  useEffect(() => {
    if (!codeTableId) return
    
    const loadCodeTableInfo = async () => {
      setLoadingInfo(true)
      try {
        const response = await api.get(`/access/api/code-tables/${codeTableId}`)
        setCodeTableInfo(response.data)
      } catch (err) {
        console.error('Failed to load code table info:', err)
      } finally {
        setLoadingInfo(false)
      }
    }
    
    loadCodeTableInfo()
  }, [codeTableId])

  const displayName = loadingInfo
    ? 'Loading…'
    : codeTableInfo?.name || t('cms.codeTable')

  const description = codeTableInfo?.description || codeTableInfo?.remarks || null

  const createdByRaw =
    codeTableInfo?.createdByName ||
    codeTableInfo?.createdByDisplayName ||
    codeTableInfo?.createdBy ||
    codeTableInfo?.createdById

  const createdByValue =
    typeof createdByRaw === 'string' && /^[0-9a-fA-F-]{36}$/.test(createdByRaw)
      ? null
      : createdByRaw

  const detailItems = [
    codeTableInfo?.codeTableKey
      ? { id: 'key', label: 'Table Key', value: codeTableInfo.codeTableKey }
      : null,
    codeTableInfo?.codeTableType
      ? { id: 'type', label: 'Table Type', value: codeTableInfo.codeTableType }
      : null,
    codeTableInfo?.createdAt
      ? {
          id: 'created',
          label: 'Created At',
          value: new Date(codeTableInfo.createdAt).toLocaleString(),
        }
      : null,
    createdByValue
      ? { id: 'createdBy', label: 'Created By', value: createdByValue }
      : null,
    codeTableInfo?.updatedAt
      ? {
          id: 'updated',
          label: 'Updated At',
          value: new Date(codeTableInfo.updatedAt).toLocaleString(),
        }
      : null,
  ].filter(Boolean)

  const statusBadges = [
    shortId ? { id: 'shortId', label: shortId, tone: 'muted' } : null,
    codeTableInfo?.isActive != null
      ? {
          id: 'status',
          label: codeTableInfo.isActive ? 'Active' : 'Inactive',
          tone: codeTableInfo.isActive ? 'success' : 'muted',
        }
      : null,
  ].filter(Boolean)

  const tabs = [
    { key: 'languages', label: 'Languages' },
    { key: 'values', label: 'Values & Languages' },
  ]

  const badgeToneClass = (tone) => {
    switch (tone) {
      case 'success':
        return 'bg-emerald-50 text-emerald-600 ring-emerald-100'
      default:
        return 'bg-slate-100 text-slate-600 ring-slate-200'
    }
  }

  const SummaryItem = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 break-words">{value || '—'}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4">
          <CMSBreadcrumb currentPageLabel={displayName} />
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
        >
          ← Back
        </button>

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-100">
          <div className="bg-gradient-to-br from-white via-slate-50 to-white px-6 py-8 lg:px-10">
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="flex w-full flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-semibold text-slate-900">{displayName}</h1>
                    {description && (
                      <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {statusBadges.map((badge) => (
                      <span
                        key={badge.id}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeToneClass(
                          badge.tone,
                        )}`}
                      >
                        {badge.label}
                      </span>
                    ))}
                    {codeTableId && (
                      <button
                        onClick={copyId}
                        title="Copy Code Table ID"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-100"
                      >
                        <span className="inline-block h-3 w-3">⧉</span>
                        {copied ? 'Copied' : 'Copy ID'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {detailItems.length > 0 ? (
                    detailItems.map((item) => (
                      <SummaryItem key={item.id} label={item.label} value={item.value} />
                    ))
                  ) : (
                    <SummaryItem label="Table ID" value={codeTableId} />
                  )}
                </div>

                {codeTableInfo?.parentId && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-inner">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Parent Table
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <ParentCodeTableLink parentId={codeTableInfo.parentId} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/70 px-6 lg:px-10">
            <nav className="flex flex-wrap gap-2 py-3">
              {tabs.map((item) => {
                const isActive = tab === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="bg-white px-6 py-8 lg:px-10">
            {tab === 'languages' ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
                  <h2 className="text-xl font-semibold text-slate-900">Table Languages</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Manage the localized names and descriptions for this code table to ensure
                    multilingual support.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <CodeTableLanguages key={`tableLang-${codeTableId}`} codeTableId={codeTableId} />
                </div>
              </div>
            ) : (
              <CodeTableValuesAndLanguages key={`valuesTab-${codeTableId}`} codeTableId={codeTableId} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Tab 1: CodeTable -> Languages */
function CodeTableLanguages({ codeTableId }) {
  const columns = useMemo(() => [
    { 
      id: 'language', 
      accessorKey: 'language', 
      header: 'Lang', 
      cell: (i) => (
        <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
          {i.getValue()}
        </span>
      )
    },
    { 
      id: 'name', 
      accessorKey: 'name', 
      header: 'Name', 
      cell: (i) => (
        <span className="font-medium text-gray-800">
          {i.getValue()}
        </span>
      )
    },
    { 
      id: 'description', 
      accessorKey: 'description', 
      header: 'Description', 
      cell: (i) => (
        <span className="text-gray-600">
          {i.getValue() ?? '-'}
        </span>
      )
    },
    { 
      id: 'isActive', 
      accessorKey: 'isActive', 
      header: 'Active', 
      cell: (i) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          i.getValue() 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {i.getValue() ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ], [])

  const formFields = [
    { type: 'text', name: 'language', label: 'Language (e.g., en, ar, de, fr)', required: true },
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'textarea', name: 'description', label: 'Description' },
    { type: 'checkbox', name: 'isActive', label: 'Active' },
  ]

  const fixedFilters = useMemo(() => ([
    { key: 'codeTableId', operator: 'EQUAL', value: codeTableId, dataType: 'UUID' },
  ]), [codeTableId])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <CrudPage
        title=""
        service="access"
        resourceBase="/api/CodeTableLanguages"
        idKey="codeTableLanguageId"
        columns={columns}
        pageSize={25}
        formFields={formFields}
        fixedFilters={fixedFilters}
        queryParams={{ codeTableId }}
        toCreatePayload={(f) => ({
          codeTableId,
          language: f.language?.trim(),
          name: f.name?.trim(),
          description: f.description?.trim() || null,
          isActive: !!f.isActive,
        })}
        toUpdatePayload={(f, row) => ({
          codeTableLanguageId: row.codeTableLanguageId ?? row.id,
          codeTableId,
          language: f.language?.trim(),
          name: f.name?.trim(),
          description: f.description?.trim() || null,
          isActive: !!f.isActive,
          ...(row.rowVersion != null ? { rowVersion: row.rowVersion } : {}),
        })}
      />
    </div>
  )
}

/** Tab 2: Values (left) + Value Languages (right) */
function CodeTableValuesAndLanguages({ codeTableId }) {
  const [selectedValue, setSelectedValue] = useState(null)

  const valueColumns = useMemo(() => [
    { 
      id: 'shortCode', 
      accessorKey: 'shortCode', 
      header: 'Code', 
      cell: (i) => (
        <span className="font-mono text-sm font-semibold text-blue-600">
          {i.getValue() ?? '-'}
        </span>
      )
    },
    { 
      id: 'name', 
      accessorKey: 'name', 
      header: 'Name', 
      cell: (i) => (
        <span className="font-medium text-gray-800">
          {i.getValue() ?? '-'}
        </span>
      )
    },
    { 
      id: 'sortOrder', 
      accessorKey: 'sortOrder', 
      header: 'Order', 
      cell: (i) => (
        <span className="text-gray-600">
          {i.getValue() ?? '-'}
        </span>
      )
    },
    { 
      id: 'isActive', 
      accessorKey: 'isActive', 
      header: 'Active', 
      cell: (i) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          i.getValue() 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {i.getValue() ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      id: 'parentName',
      header: 'Parent',
      accessorKey: 'parentName',
      cell: ({ row }) => (
        <span className="text-gray-700">
          {row.original.parentName || row.original.parentId || '—'}
        </span>
      )
    },
    {
      id: 'select',
      header: '',
      cell: ({ row }) => (
        <button
          className="rounded-lg border border-slate-200 bg-slate-900 text-white px-4 py-1.5 text-sm font-semibold shadow-sm transition hover:bg-slate-700"
          onClick={(e) => { e.stopPropagation(); setSelectedValue(row.original) }}
          title="Select value to manage its languages"
        >
          Select
        </button>
      ),
    },
  ], [])

  const valueFields = [
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'text', name: 'shortCode', label: 'Code (shortCode)' },
    { type: 'textarea', name: 'description', label: 'Description' },
    { type: 'number', name: 'sortOrder', label: 'Sort Order' },
    { type: 'checkbox', name: 'isActive', label: 'Active' },
  ]

  const fixedValueFilters = useMemo(() => ([
    { key: 'codeTableId', operator: 'EQUAL', value: codeTableId, dataType: 'UUID' },
  ]), [codeTableId])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
        <h2 className="text-xl font-semibold text-slate-900">Values & Languages</h2>
        <p className="mt-2 text-sm text-slate-500">
          Manage the list of available values and maintain localized labels for each entry.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* LEFT: Values */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                •
              </div>
            <div>
                <div className="text-lg font-semibold text-slate-900">Values</div>
                <div className="text-sm text-slate-500">Base entries for this code table</div>
              </div>
            </div>
          </div>
          <div className="p-4">
          <CrudPage
            key={`values-${codeTableId}`}
              title=""
            service="access"
            resourceBase="/api/CodeTableValues"
            idKey="codeTableValueId"
            columns={valueColumns}
            pageSize={25}
            formFields={valueFields}
            fixedFilters={fixedValueFilters}
            queryParams={{ codeTableId }}
            toCreatePayload={(f) => ({
              codeTableId,
              name: f.name?.trim(),
              shortCode: f.shortCode?.trim() || null,
              description: f.description?.trim() || null,
              isActive: !!f.isActive,
            })}
            toUpdatePayload={(f, row) => ({
              codeTableValueId: row.codeTableValueId ?? row.id,
              codeTableId,
              name: f.name?.trim(),
              shortCode: f.shortCode?.trim() || null,
              description: f.description?.trim() || null,
              sortOrder: f.sortOrder != null ? Number(f.sortOrder) : null,
              isActive: !!f.isActive,
              ...(row.rowVersion != null ? { rowVersion: row.rowVersion } : {}),
            })}
          />
        </div>
      </div>

      {/* RIGHT: Value Languages */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  •
                </div>
            <div className="min-w-0">
                  <div className="text-lg font-semibold text-slate-900">Value Languages</div>
                  <div className="text-sm text-slate-500 truncate">
                {selectedValue
                  ? `Translations: ${selectedValue?.shortCode || selectedValue?.name}`
                  : 'Select a value to manage translations'}
              </div>
            </div>
          </div>
          {selectedValue && (
            <button
                  className="flex-shrink-0 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-sm font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50"
              onClick={() => setSelectedValue(null)}
            >
              Clear
            </button>
          )}
            </div>
        </div>

          <div className="p-4">
          {selectedValue ? (
            <CodeTableValueLanguages
              key={`valueLang-${selectedValue.codeTableValueId ?? selectedValue.id}`}
              codeTableId={codeTableId}
              valueId={selectedValue.codeTableValueId ?? selectedValue.id}
            />
          ) : (
            <EmptyState />
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Flat endpoint + fixed filter by codeTableValueId */
function CodeTableValueLanguages({ valueId /* codeTableId not needed for filtering */ }) {
  const columns = useMemo(() => [
    { 
      id: 'language', 
      accessorKey: 'language', 
      header: 'Lang', 
      cell: (i) => (
        <span className="font-mono text-sm font-semibold text-violet-600 bg-violet-50 px-2 py-1 rounded">
          {i.getValue()}
        </span>
      )
    },
    { 
      id: 'name', 
      accessorKey: 'name', 
      header: 'Name', 
      cell: (i) => (
        <span className="font-medium text-gray-800">
          {i.getValue()}
        </span>
      )
    },
    { 
      id: 'description', 
      accessorKey: 'description', 
      header: 'Description', 
      cell: (i) => (
        <span className="text-gray-600">
          {i.getValue() ?? '-'}
        </span>
      )
    },
    { 
      id: 'isActive', 
      accessorKey: 'isActive', 
      header: 'Active', 
      cell: (i) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          i.getValue() 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {i.getValue() ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ], [])

  const formFields = [
    { type: 'text', name: 'language', label: 'Language (e.g., en, ar, de, fr)', required: true },
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'textarea', name: 'description', label: 'Description' },
    { type: 'checkbox', name: 'isActive', label: 'Active' },
  ]

  const fixedFilters = useMemo(() => ([
    { key: 'codeTableValueId', operator: 'EQUAL', value: valueId, dataType: 'UUID' },
  ]), [valueId])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <CrudPage
        title=""
        service="access"
        resourceBase="/api/CodeTableValueLanguages"
        idKey="codeTableValueLanguageId"
        columns={columns}
        pageSize={25}
        formFields={formFields}
        fixedFilters={fixedFilters}
        queryParams={{ codeTableValueId: valueId }}
        toCreatePayload={(f) => ({
          codeTableValueId: valueId,
          language: f.language?.trim(),
          name: f.name?.trim(),
          description: f.description?.trim() || null,
          isActive: !!f.isActive,
        })}
        toUpdatePayload={(f, row) => ({
          codeTableValueLanguageId: row.codeTableValueLanguageId ?? row.id,
          codeTableValueId: valueId,
          language: f.language?.trim(),
          name: f.name?.trim(),
          description: f.description?.trim() || null,
          isActive: !!f.isActive,
          ...(row.rowVersion != null ? { rowVersion: row.rowVersion } : {}),
        })}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        •
      </div>
      <h4 className="text-lg font-semibold text-slate-900">No value selected</h4>
      <p className="max-w-xs text-sm text-slate-500">
        Choose a value from the left panel to view and manage its translations.
      </p>
    </div>
  )
}

/** Component to display parent CodeTable as a clickable link */
function ParentCodeTableLink({ parentId }) {
  const navigate = useNavigate()
  const [parentName, setParentName] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadParentInfo = async () => {
      try {
        const response = await api.get(`/access/api/code-tables/${parentId}`)
        setParentName(response.data?.name || parentId)
      } catch (err) {
        console.error('Failed to load parent info:', err)
        setParentName(parentId)
      } finally {
        setLoading(false)
      }
    }
    
    if (parentId) {
      loadParentInfo()
    }
  }, [parentId])

  if (loading) {
    return <span className="text-muted-foreground">Loading...</span>
  }

  return (
    <button
      onClick={() => navigate(`/cms/codeTable/${parentId}`)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
      title="Navigate to parent table"
    >
      {parentName}
    </button>
  )
}

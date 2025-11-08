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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-4">
        <CMSBreadcrumb currentPageLabel={codeTableInfo?.name || t('cms.codeTable')} />
      </div>

        {/* Modern Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-lg text-white">
        <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition text-white font-bold"
              aria-label="Back"
              title="Back"
            >
              ←
            </button>
                  <h1 className="text-3xl font-bold">
                {loadingInfo ? 'Loading...' : (codeTableInfo?.name || 'Code Table')}
                  </h1>
            </div>
                <p className="text-emerald-100 mt-2 flex items-center gap-3 flex-wrap">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                {shortId}
              </span>
                  {codeTableId && (
              <button
                onClick={copyId}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-sm font-medium transition"
                title="Copy full CodeTableId"
              >
                      <span className="inline-block h-4 w-4">⧉</span>
                      {copied ? 'Copied!' : 'Copy ID'}
              </button>
                  )}
                  {codeTableInfo?.parentId && (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-200">Parent:</span>
                      <ParentCodeTableLink parentId={codeTableInfo.parentId} />
                    </span>
                  )}
                </p>
              </div>
              <div className="text-6xl opacity-20">📊</div>
            </div>
          </div>
      </div>

        {/* Modern Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="flex border-b-2 border-gray-100 bg-gray-50">
          {[
              { key: 'languages', label: '🌐 Languages', icon: '🌐' },
              { key: 'values', label: '🗂️ Values & Languages', icon: '🗂️' },
          ].map(t => (
            <button
              key={t.key}
              role="tab"
              onClick={() => setTab(t.key)}
                className={`px-8 py-4 font-bold transition-all relative ${
                tab === t.key 
                    ? 'text-emerald-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              aria-selected={tab === t.key}
            >
                <span className="flex items-center gap-2">
              {t.label}
                </span>
                {tab === t.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
                )}
            </button>
          ))}
      </div>

          {/* Tab Content */}
          <div className="p-8">
        {tab === 'languages' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                        <span className="text-3xl">🌐</span>
                        Table Languages
                      </h2>
                      <p className="text-gray-600">
                        Manage languages for <span className="font-bold text-emerald-600">{codeTableInfo?.name || 'this code table'}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden">
            <CodeTableLanguages key={`tableLang-${codeTableId}`} codeTableId={codeTableId} />
                </div>
          </div>
        )}

        {tab !== 'languages' && (
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
      id: 'select',
      header: '',
      cell: ({ row }) => (
        <button
          className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-sm"
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
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <span className="text-3xl">🗂️</span>
              Values & Languages
            </h2>
            <p className="text-gray-600">
              Manage values and their translations for <span className="font-bold text-teal-600">this code table</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Values */}
        <div className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗂️</span>
            <div>
                <div className="text-lg font-bold text-gray-800">Values</div>
                <div className="text-sm text-gray-600">Code table values</div>
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
        <div className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-100 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0">🈯</span>
            <div className="min-w-0">
                  <div className="text-lg font-bold text-gray-800">Value Languages</div>
                  <div className="text-sm text-gray-600 truncate">
                {selectedValue
                  ? `Translations: ${selectedValue?.shortCode || selectedValue?.name}`
                  : 'Select a value to manage translations'}
              </div>
            </div>
          </div>
          {selectedValue && (
            <button
                  className="flex-shrink-0 rounded-lg border-2 border-purple-300 bg-white px-3 py-1.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 transition"
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
        <span className="font-mono text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">
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
    <div className="h-full flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="text-6xl opacity-50">🈯</div>
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-2">No value selected</h4>
        <p className="max-w-xs text-sm text-gray-600">
          Choose a value from the left panel to view and manage its translations.
      </p>
      </div>
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
      className="bg-white/30 hover:bg-white/40 px-3 py-1 rounded-lg text-sm font-semibold text-white transition hover:shadow-md"
      title="Navigate to parent table"
    >
      {parentName} →
    </button>
  )
}

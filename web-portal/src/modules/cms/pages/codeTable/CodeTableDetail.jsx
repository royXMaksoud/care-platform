// src/modules/cms/pages/codeTable/CodeTableDetail.jsx
// Tailwind only. Each grid is filtered by the current codeTableId.

import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'

export default function CodeTableDetail() {
  const { codeTableId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('languages')
  const [copied, setCopied] = useState(false)

  const shortId = codeTableId ? `${String(codeTableId).slice(0, 8)}…` : ''

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(codeTableId || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="flex-none border-b bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted transition text-sm"
            aria-label="Back"
            title="Back"
          >
            ←
          </button>
          <div>
            <h2 className="text-base font-semibold">Code Table</h2>
            <p className="text-xs text-muted-foreground">Manage languages, values, and translations</p>
          </div>
        </div>

        {codeTableId && (
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground border border-border">
              {shortId}
            </span>
            <button
              onClick={copyId}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-xs hover:bg-muted transition"
              title="Copy full CodeTableId"
            >
              <span className="inline-block h-3 w-3">⧉</span>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-none border-b bg-card px-4 py-1">
        <div role="tablist" className="inline-flex gap-1">
          {[
            { key: 'languages', label: 'Languages' },
            { key: 'values', label: 'Values & Languages' },
          ].map(t => (
            <button
              key={t.key}
              role="tab"
              onClick={() => setTab(t.key)}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-md transition',
                tab === t.key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              ].join(' ')}
              aria-selected={tab === t.key}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-background">
        {tab === 'languages' && (
          <div className="h-full overflow-y-auto">
            <CodeTableLanguages key={`tableLang-${codeTableId}`} codeTableId={codeTableId} />
          </div>
        )}

        {tab !== 'languages' && (
          <CodeTableValuesAndLanguages key={`valuesTab-${codeTableId}`} codeTableId={codeTableId} />
        )}
      </div>
    </div>
  )
}

/** Tab 1: CodeTable -> Languages */
function CodeTableLanguages({ codeTableId }) {
  const columns = useMemo(() => [
    { id: 'language', accessorKey: 'language', header: 'Lang', cell: (i) => i.getValue() },
    { id: 'name', accessorKey: 'name', header: 'Name', cell: (i) => i.getValue() },
    { id: 'description', accessorKey: 'description', header: 'Description', cell: (i) => i.getValue() ?? '' },
    { id: 'isActive', accessorKey: 'isActive', header: 'Active', cell: (i) => (i.getValue() ? 'Active' : 'Inactive') },
  ], [])

  const formFields = [
    { type: 'text', name: 'language', label: 'Language (e.g., en, ar, de, fr)', required: true },
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'textarea', name: 'description', label: 'Description' },
    { type: 'checkbox', name: 'isActive', label: 'Active' },
  ]

  const fixedFilters = useMemo(() => ([
    { key: 'codeTableId', operator: 'EQUAL', value: codeTableId },
  ]), [codeTableId])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <CrudPage
        title="Table Languages"
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
    { id: 'shortCode', accessorKey: 'shortCode', header: 'Code', cell: (i) => i.getValue() ?? '' },
    { id: 'name', accessorKey: 'name', header: 'Name', cell: (i) => i.getValue() ?? '' },
    { id: 'sortOrder', accessorKey: 'sortOrder', header: 'Order', cell: (i) => i.getValue() ?? '' },
    { id: 'isActive', accessorKey: 'isActive', header: 'Active', cell: (i) => (i.getValue() ? 'Active' : 'Inactive') },
    {
      id: 'select',
      header: '',
      cell: ({ row }) => (
        <button
          className="border rounded-xl px-2 py-1 text-sm hover:bg-gray-50 transition"
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
    { key: 'codeTableId', operator: 'EQUAL', value: codeTableId },
  ]), [codeTableId])

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-px bg-border overflow-hidden">
      {/* LEFT: Values */}
      <div className="flex flex-col bg-card overflow-hidden">
        <div className="flex-none border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4">🗂️</span>
            <div>
              <div className="text-sm font-medium">Values</div>
              <div className="text-xs text-muted-foreground">Code table values</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <CrudPage
            key={`values-${codeTableId}`}
            title="Values"
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
      <div className="flex flex-col bg-card overflow-hidden">
        <div className="flex-none border-b border-border px-3 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block h-4 w-4 flex-shrink-0">🈯</span>
            <div className="min-w-0">
              <div className="text-sm font-medium">Value Languages</div>
              <div className="text-xs text-muted-foreground truncate">
                {selectedValue
                  ? `Translations: ${selectedValue?.shortCode || selectedValue?.name}`
                  : 'Select a value to manage translations'}
              </div>
            </div>
          </div>
          {selectedValue && (
            <button
              className="flex-shrink-0 rounded-md border border-border px-2 py-0.5 text-xs hover:bg-muted transition"
              onClick={() => setSelectedValue(null)}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
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
  )
}

/** Flat endpoint + fixed filter by codeTableValueId */
function CodeTableValueLanguages({ valueId /* codeTableId not needed for filtering */ }) {
  const columns = useMemo(() => [
    { id: 'language', accessorKey: 'language', header: 'Lang', cell: (i) => i.getValue() },
    { id: 'name', accessorKey: 'name', header: 'Name', cell: (i) => i.getValue() },
    { id: 'description', accessorKey: 'description', header: 'Description', cell: (i) => i.getValue() ?? '' },
    { id: 'isActive', accessorKey: 'isActive', header: 'Active', cell: (i) => (i.getValue() ? 'Active' : 'Inactive') },
  ], [])

  const formFields = [
    { type: 'text', name: 'language', label: 'Language (e.g., en, ar, de, fr)', required: true },
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'textarea', name: 'description', label: 'Description' },
    { type: 'checkbox', name: 'isActive', label: 'Active' },
  ]

  const fixedFilters = useMemo(() => ([
    { key: 'codeTableValueId', operator: 'EQUAL', value: valueId },
  ]), [valueId])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <CrudPage
        title="Value Languages"
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
    <div className="h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
      <div className="text-xl">💡</div>
      <h4 className="text-xs font-medium text-foreground">No value selected</h4>
      <p className="max-w-xs text-xs text-muted-foreground">
        Choose a value to view and edit its translations.
      </p>
    </div>
  )
}

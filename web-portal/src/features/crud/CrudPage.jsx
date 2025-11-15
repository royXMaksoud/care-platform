// src/features/crud/CrudPage.jsx
// Generic CRUD page with server-backed table + filter bar.
// Sends fixedFilters + userFilters in body, and queryParams in URL.

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import DataTable from '@/packages/datatable/DataTable'
import ConfirmDialog from '@/components/ConfirmDialog'
import CrudFormModal from '@/components/CrudFormModal'
import FilterBar from '@/packages/datatable/FilterBar'
import { exportXlsx } from '@/packages/export/xlsx'
import { printTable } from '@/packages/export/print'

export default function CrudPage({
  title,
  service = '',
  resourceBase,
  idKey,
  columns,
  pageSize = 10,
  formFields,
  toCreatePayload,
  toUpdatePayload,

  // ALWAYS-ON filters (in request body -> /filter)
  fixedFilters = [],

  // Extra query-string params (in URL -> /filter?...&codeTableId=xxx)
  queryParams = {},

  // Optional UI
  renderCreate,
  renderEdit,
  showAddButton = true,
  renderHeaderRight,
  enableCreate = true,
  enableEdit = true,
  enableDelete = true,
  onRowClick,  // Custom row click handler
  
  // Table preferences - unique identifier for localStorage
  tableId, // e.g., 'tenants-list', 'systems-list', etc.
}) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null, name: '' })
  const [busy, setBusy] = useState(false)

  // Filters coming from the FilterBar (user edits)
  const [userFilters, setUserFilters] = useState([])
  
  // UI state for expandable sections
  const [showFilterSection, setShowFilterSection] = useState(false)
  const [showControlsDropdown, setShowControlsDropdown] = useState(false)
  const [showPivot, setShowPivot] = useState(false)
  
  // Ref for controls dropdown and data table
  const controlsDropdownRef = useRef(null)
  const dataTableRef = useRef(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (controlsDropdownRef.current && !controlsDropdownRef.current.contains(event.target)) {
        setShowControlsDropdown(false)
      }
    }
    
    if (showControlsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showControlsDropdown])

  // Merge fixed + user filters (fixed first)
  const mergedFilters = useMemo(
    () => {
      const merged = [...(fixedFilters || []), ...(userFilters || [])]
      // console.log('📦 DEBUG CrudPage - mergedFilters:', merged)
      // console.log('📦 DEBUG CrudPage - fixedFilters:', fixedFilters)
      // console.log('📦 DEBUG CrudPage - userFilters:', userFilters)
     return merged
    },
    [fixedFilters, userFilters]
  )

  const full = (p) => `${service ? `/${service}` : ''}${p}`

  const filterMeta = useMemo(() => ({
    fields: (columns || [])
      .filter((c) => c.id !== 'rowActions')
      .map((c, idx) => ({
        name: c.meta?.filterKey || c.accessorKey || c.id || `col_${idx}`,
        label:
          (typeof c.header === 'string' && c.header) ||
          c.meta?.label ||
          c.accessorKey ||
          c.id ||
          `Column ${idx + 1}`,
        type: c.meta?.type || 'string',
        enumValues: c.meta?.enumValues,
        operators: c.meta?.operators,
      })),
  }), [columns])

  // Don't use useMemo - recreate columns array every time to ensure fresh cell renderers
  const cols = [
    // Enable sorting for all columns by default
    ...columns.map(col => ({
      ...col,
      enableSorting: col.enableSorting !== false,
    })),
    {
      id: 'rowActions',
      header: '',
      enableSorting: false,
      enableHiding: false, // Don't allow hiding this column
      size: 200,
      cell: ({ row }) => {
        const r = row.original
        const isSelected = selected && selected[idKey] === r[idKey]
        if (!isSelected) return null
        
        return (
          <div className="flex items-center gap-2 justify-end">
            {enableEdit && (
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowEdit(true)
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            {enableDelete && (
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmDel({
                    open: true,
                    id: String(r[idKey]),
                    name: String(r.name || r.code || r[idKey]),
                  })
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        )
      },
    },
  ]

  const refresh = () => setRefreshKey((k) => k + 1)

  const resolveErrorMessage = (err, fallbackMessage) =>
    err?.response?.data?.message || err?.message || fallbackMessage

  // Store displayed data for export (will be empty for now - export feature needs redesign)
  const [displayedData, setDisplayedData] = useState([])
  
  // Control actions
  const handlePrint = () => {
    window.print()
    toast.success('Opening print dialog...')
  }

  // Export only the currently displayed data (current page)
  const handleExportDisplayed = () => {
    try {
      if (!displayedData || displayedData.length === 0) {
        toast.warning('No data to export')
        return
      }
      
      // Prepare columns for export
      const exportCols = columns
        .filter(c => c.id !== 'rowActions')
        .map((c, idx) => ({
          header: typeof c.header === 'string' ? c.header : c.meta?.label || c.accessorKey || c.id || `col_${idx}`,
          key: c.accessorKey || c.id || `col_${idx}`,
        }))
      
      exportXlsx(exportCols, displayedData, `${title}_displayed.xlsx`)
      toast.success(`Exported ${displayedData.length} displayed records!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  // Export ALL data from server
  const handleExportAll = async () => {
    try {
      toast.info('Fetching all data for export...')
      
      // Step 1: Get first page to know total count
      const firstPageResponse = await api.post(full(`${resourceBase}/filter`), {
        filters: mergedFilters,
        page: 0,
        size: 1, // Just get total count
        sorts: []
      }, { params: queryParams })
      
      const totalElements = firstPageResponse.data?.totalElements || 0
      
      if (totalElements === 0) {
        toast.warning('No data to export')
        return
      }
      
      toast.info(`Fetching ${totalElements} records from server...`)
      
      // Step 2: Fetch all data in one or multiple requests
      let allData = []
      const batchSize = 5000 // Fetch in batches of 5000
      const totalPages = Math.ceil(totalElements / batchSize)
      
      for (let i = 0; i < totalPages; i++) {
        const response = await api.post(full(`${resourceBase}/filter`), {
          filters: mergedFilters,
          page: i,
          size: batchSize,
          sorts: []
        }, { params: queryParams })
        
        const batchData = response.data?.content || []
        allData = [...allData, ...batchData]
        
        if (totalPages > 1) {
          toast.info(`Fetching... ${Math.round((i + 1) / totalPages * 100)}%`)
        }
      }
      
      if (allData.length === 0) {
        toast.warning('No data to export')
        return
      }
      
      // Prepare columns for export
      const exportCols = columns
        .filter(c => c.id !== 'rowActions')
        .map((c, idx) => ({
          header: typeof c.header === 'string' ? c.header : c.meta?.label || c.accessorKey || c.id || `col_${idx}`,
          key: c.accessorKey || c.id || `col_${idx}`,
        }))
      
      exportXlsx(exportCols, allData, `${title}_all_data.xlsx`)
      toast.success(`Exported ${allData.length} records successfully!`)
    } catch (error) {
     // console.error('Export error:', error)
      toast.error('Failed to export data: ' + (error?.response?.data?.message || error.message))
    }
  }

  const handlePivot = () => {
    setShowPivot(true)
    toast.info('Pivot view - Coming soon')
  }

  const createItem = async (form) => {
    setBusy(true)
    try {
      await api.post(full(resourceBase), toCreatePayload(form))
      toast.success('Created successfully')
      refresh()
      setShowCreate(false)
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'Create failed'))
    } finally {
      setBusy(false)
    }
  }

  const updateItem = async (form) => {
    if (!selected) return
    setBusy(true)
    try {
      const id = selected[idKey]
      await api.put(full(`${resourceBase}/${id}`), toUpdatePayload(form, selected))
      toast.success('Updated successfully')
      refresh()
      setShowEdit(false)
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'Update failed'))
    } finally {
      setBusy(false)
    }
  }

  const doDelete = async () => {
    if (!confirmDel.id) return
    setBusy(true)
    try {
      await api.delete(full(`${resourceBase}/${confirmDel.id}`))
      toast.success('Deleted')
      setConfirmDel({ open: false, id: null, name: '' })
      setSelected(null)
      refresh()
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'Delete failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header Section */}
      <div className="flex-none flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-bold text-gray-800 truncate">{title}</h1>
          <span className="text-xs text-gray-500 hidden sm:inline">Manage and organize your data</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {typeof renderHeaderRight === 'function' &&
            renderHeaderRight({ selected, refresh, openCreate: () => setShowCreate(true) })}
        </div>
      </div>

      {/* Toolbar: Controls + Add Filter + Add New */}
      <div className="flex-none px-6 py-3 bg-white border-b">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Controls Dropdown Button */}
          <div className="relative" ref={controlsDropdownRef}>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              onClick={() => setShowControlsDropdown(!showControlsDropdown)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Controls
              <svg className={`w-4 h-4 transition-transform ${showControlsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Controls Dropdown */}
            {showControlsDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                {/* Header */}
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Table Controls</h3>
                </div>
                
                <div className="py-2">
                  <button
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    onClick={() => {
                      handlePrint()
                      setShowControlsDropdown(false)
                    }}
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="font-medium">Print</span>
                  </button>

                  <div className="border-t border-gray-200 my-1"></div>

                  {/* Export Displayed Data */}
                  <button
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors border-l-4 border-transparent hover:border-blue-500"
                    onClick={() => {
                      handleExportDisplayed()
                      setShowControlsDropdown(false)
                    }}
                  >
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">Export Displayed Data</span>
                        <span className="px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">PAGE</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-0.5">Export current page only</span>
                    </div>
                  </button>

                  {/* Export All Data */}
                  <button
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center gap-3 transition-colors border-l-4 border-transparent hover:border-green-500"
                    onClick={() => {
                      handleExportAll()
                      setShowControlsDropdown(false)
                    }}
                  >
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">Export All Data</span>
                        <span className="px-1.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded">ALL</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-0.5">Fetch and export all records</span>
                    </div>
                  </button>

                  <button
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    onClick={() => {
                      handlePivot()
                      setShowControlsDropdown(false)
                    }}
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Pivot View</span>
                  </button>

                  <div className="border-t border-gray-200 my-1"></div>

                  <button
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    onClick={() => {
                      refresh()
                      setShowControlsDropdown(false)
                    }}
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="font-medium">Refresh</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Filter Button */}
          <button
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm ${
              showFilterSection
                ? 'text-blue-700 bg-blue-50 border border-blue-300 hover:bg-blue-100'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
            onClick={() => setShowFilterSection(!showFilterSection)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Add Filter
            {userFilters.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full">
                {userFilters.length}
              </span>
            )}
          </button>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Add New Button */}
          {showAddButton && enableCreate && (
            <button
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
              onClick={() => setShowCreate(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filter Section */}
      {showFilterSection && (
        <div className="flex-none px-6 py-4 bg-blue-50 border-b border-blue-200 animate-slideDown">
          <FilterBar
            meta={filterMeta}
            value={userFilters}
            onChange={setUserFilters}
            onApply={refresh}
            onClear={() => {
              setUserFilters([])
              refresh()
            }}
          />
        </div>
      )}

      {/* Data Table - Takes remaining space */}
      <div className="flex-1 overflow-hidden bg-card min-h-0">
        <DataTable
          title={title}
          service={service}
          resourceBase={resourceBase}
          columns={cols}
          pageSize={pageSize}
          refreshKey={refreshKey}
          filters={mergedFilters}
          queryParams={queryParams}
          selectedId={selected ? selected[idKey] : undefined}
          onRowClick={(row) => {
            if (onRowClick) {
              onRowClick(row)
            } else {
              setSelected((prev) => (prev && prev[idKey] === row[idKey] ? null : row))
            }
          }}
          getRowId={(r) => r[idKey]}
          tableId={tableId} // Pass tableId for column preferences persistence
        />
      </div>

      {renderCreate ? (
        renderCreate({
          open: showCreate,
          onClose: () => setShowCreate(false),
          onSuccess: () => {
            refresh()
            setShowCreate(false)
          },
        })
      ) : (
        <CrudFormModal
          open={showCreate}
          mode="create"
          title={`Create ${title}`}
          fields={formFields}
          onClose={() => setShowCreate(false)}
          onSubmit={createItem}
          busy={busy}
        />
      )}

      {renderEdit ? (
        renderEdit({
          open: showEdit,
          initial: selected || undefined,
          onClose: () => setShowEdit(false)}
        )
      ) : (
        <CrudFormModal
          open={showEdit}
          mode="edit"
          title={`Edit ${title}`}
          fields={formFields}
          initial={selected || undefined}
          onClose={() => setShowEdit(false)}
          onSubmit={updateItem}
          busy={busy}
        />
      )}

      <ConfirmDialog
        open={confirmDel.open}
        title={`Delete ${title}`}
        message={`Are you sure you want to delete “${confirmDel.name}”?`}
        onCancel={() => setConfirmDel({ open: false, id: null, name: '' })}
        onConfirm={doDelete}
        busy={busy}
      />
    </div>
  )
}

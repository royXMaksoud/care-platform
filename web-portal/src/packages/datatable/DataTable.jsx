import React, { useMemo, useState, useRef, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { useServerTable } from '@/packages/datatable/useServerTable'
import { exportXlsx } from '@/packages/export/xlsx'
import { printTable } from '@/packages/export/print'
import PivotModal from '@/packages/pivot/PivotModal'
import { useAppearance } from '@/contexts/AppearanceContext'
import { useTablePreferences } from '@/hooks/useTablePreferences'

/**
 * Props:
 * - columns: ColumnDef[]
 * - data: local rows (used when resourceBase is empty)
 * - pageSize, title
 * - service, resourceBase, filters, sorting, refreshKey
 * - selectedId: selected row id
 * - onRowClick: (rowOriginal) => void
 * - getRowId: (rowOriginal) => string|number (default: r?.id)
 * - onRefresh?: () => void
 * - tableId: unique identifier for saving preferences (e.g., 'tenants-list', 'systems-list')
 * - onDataChange?: (data) => void - callback with currently displayed data
 */
export default function DataTable({
  columns = [],
  data: dataProp = [],
  pageSize = 10,
  title = 'Table',
  service,
  resourceBase,
  queryParams = {},  
  filters = [],
  sorting: sortingProp = [],
  refreshKey = 0,
  selectedId,
  onRowClick,
  getRowId = (r) => r?.id,
  onRefresh,
  tableId, // New prop for table preferences
  onDataChange, // Callback to pass displayed data to parent
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSz, setPageSz] = useState(pageSize)
  const [sorting, setSorting] = useState(sortingProp)
  const [localRefresh, setLocalRefresh] = useState(0)
  const [pivotOpen, setPivotOpen] = useState(false)
  const [searchText, setSearchText] = useState('') // Client-side search
  const { fontClasses } = useAppearance()
  
  // Column preferences (order and visibility) with localStorage persistence
  const tablePrefs = useTablePreferences(tableId, columns)
  
  // UI state for column controls dropdown
  const [showColumnControls, setShowColumnControls] = useState(false)
  const columnControlsRef = useRef(null)
  
  // Drag and drop state for column reordering
  const [draggedColumnIndex, setDraggedColumnIndex] = useState(null)
  
  // Close column controls dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnControlsRef.current && !columnControlsRef.current.contains(event.target)) {
        setShowColumnControls(false)
      }
    }
    
    if (showColumnControls) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColumnControls])

  const server = useServerTable({
    base: resourceBase || '',
    service,
    pageIndex,
    pageSize: pageSz,
    queryParams,
    sorting,
    filters,
    enabled: !!resourceBase,
    refreshKey: Number(refreshKey) + Number(localRefresh),
  })

  const isServer = !!resourceBase

  const safeRows = useMemo(
    () => (Array.isArray(server.rows) ? server.rows : Array.isArray(dataProp) ? dataProp : []),
    [server.rows, dataProp]
  )
  
  // Use columns directly - always get fresh cell renderers from parent
  const safeCols = !Array.isArray(columns) ? [] : columns

  // Client-side search filtering
  const filteredRows = useMemo(() => {
    if (!searchText || searchText.trim() === '') {
      return safeRows
    }

    const searchLower = searchText.toLowerCase().trim()
    
    return safeRows.filter((row) => {
      // Search in all string values of the row
      return Object.values(row).some((value) => {
        if (value == null) return false
        return String(value).toLowerCase().includes(searchLower)
      })
    })
  }, [safeRows, searchText])

  const total = isServer ? server.total ?? 0 : filteredRows.length

  // Force table to re-render when columns change by using columns in getCoreRowModel
  const coreRowModel = useMemo(() => getCoreRowModel(), [safeCols])
  
  // Ensure rowActions is always visible
  const columnVisibility = { ...tablePrefs.columnVisibility, rowActions: true }
  
  const table = useReactTable({
    data: filteredRows, // Use filtered rows instead of all rows
    columns: safeCols,
    state: { 
      pagination: { pageIndex, pageSize: pageSz }, 
      sorting,
      columnVisibility, // Apply column visibility with rowActions forced to true
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize: pageSz }) : updater
      setPageIndex(next.pageIndex ?? 0)
      setPageSz(next.pageSize ?? pageSz)
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: tablePrefs.setColumnVisibility, // Handle visibility changes
    getCoreRowModel: coreRowModel,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: isServer,
    manualSorting: isServer,
    pageCount: isServer ? Math.max(1, Math.ceil((total || 0) / (pageSz || 1))) : undefined,
  })

  const exportCols = useMemo(
    () =>
      safeCols.map((c, idx) => ({
        header: typeof c.header === 'string' ? c.header : c.meta?.label || c.accessorKey || c.id || `col_${idx}`,
        key: c.accessorKey || c.id || `col_${idx}`,
      })),
    [safeCols]
  )

  // Get visible rows from table (not memoized to ensure fresh data)
  const visibleRows = table.getRowModel().rows.map((r) => r.original)
  const pageCount = table.getPageCount()

  const pivotRows = useMemo(() => {
    return table.getRowModel().rows.map((row) => {
      const obj = {}
      row.getVisibleCells().forEach((cell) => {
        const def = cell.column.columnDef
        const key =
          typeof def.header === 'string'
            ? def.header
            : def.meta?.label || def.accessorKey || def.id
        let val = cell.getValue?.()
        if (val === true) val = 'true'
        if (val === false) val = 'false'
        if (val == null) val = ''
        obj[key] = val
      })
      return obj
    })
  }, [filteredRows, safeCols, pageIndex, pageSz, sorting, searchText])

  const handleRefresh = () => {
    if (typeof onRefresh === 'function') onRefresh()
    else setLocalRefresh((t) => t + 1)
  }

  const isFetching = Boolean(server.loading || server.isLoading || server.fetching || server.isFetching)
  
  // Pass displayed data to parent when it changes
  // DISABLED: Causes infinite loop - needs proper fix with refs or different approach
  // useEffect(() => {
  //   if (typeof onDataChange === 'function') {
  //     onDataChange(visibleRows)
  //   }
  // }, [visibleRows])
  
  // Drag and drop handlers for column reordering
  const handleDragStart = (e, columnIndex) => {
    setDraggedColumnIndex(columnIndex)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget)
  }

  const handleDragOver = (e, columnIndex) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedColumnIndex === null || draggedColumnIndex === columnIndex) return
    
    // Visual feedback
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const midpoint = rect.left + rect.width / 2
    
    if (e.clientX < midpoint) {
      target.style.borderLeft = '2px solid #3b82f6'
      target.style.borderRight = ''
    } else {
      target.style.borderRight = '2px solid #3b82f6'
      target.style.borderLeft = ''
    }
  }

  const handleDragLeave = (e) => {
    e.currentTarget.style.borderLeft = ''
    e.currentTarget.style.borderRight = ''
  }

  const handleDrop = (e, columnIndex) => {
    e.preventDefault()
    e.currentTarget.style.borderLeft = ''
    e.currentTarget.style.borderRight = ''
    
    if (draggedColumnIndex === null || draggedColumnIndex === columnIndex) {
      setDraggedColumnIndex(null)
      return
    }
    
    // Reorder columns
    tablePrefs.reorderColumn(draggedColumnIndex, columnIndex)
    setDraggedColumnIndex(null)
  }

  const handleDragEnd = (e) => {
    e.currentTarget.style.borderLeft = ''
    e.currentTarget.style.borderRight = ''
    setDraggedColumnIndex(null)
  }
  
  // Get visible column count
  const visibleColumnCount = useMemo(() => {
    return Object.values(tablePrefs.columnVisibility).filter(v => v).length
  }, [tablePrefs.columnVisibility])

  return (
    <div className="space-y-4">
      {/* Modern Header with Search and Controls */}
      <div className="flex items-center gap-2 justify-between flex-wrap bg-card p-3 rounded-lg border">
        {/* Search Box - Compact Design */}
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <svg className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value)
              setPageIndex(0)
            }}
            placeholder="Search..."
            className={`flex-1 pl-8 pr-8 py-2 ${fontClasses.base} border border-border rounded-md bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all`}
          />
          {searchText && (
            <button
              onClick={() => {
                setSearchText('')
                setPageIndex(0)
              }}
              className="absolute right-2 p-0.5 rounded hover:bg-muted transition-colors"
              title="Clear"
            >
              <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Column Controls Dropdown - Only show if tableId is provided */}
        {tableId && (
          <div className="relative" ref={columnControlsRef}>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setShowColumnControls(!showColumnControls)}
              title="Manage Columns"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span>Columns</span>
              <span className="px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                {visibleColumnCount}
              </span>
            </button>

            {/* Column Controls Dropdown Menu */}
            {showColumnControls && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Manage Columns</h3>
                    <button
                      onClick={() => setShowColumnControls(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Drag to reorder • Click to show/hide
                  </p>
                </div>

                {/* Column List */}
                <div className="py-2">
                  {tablePrefs.columnOrder
                    .filter(colId => colId !== 'rowActions') // Don't show rowActions in controls
                    .map((colId, idx) => {
                      const col = columns.find(c => c.id === colId)
                      if (!col) return null
                      
                      const isVisible = tablePrefs.columnVisibility[colId] !== false
                      const colHeader = typeof col.header === 'string' ? col.header : col.id
                      
                      return (
                        <div
                          key={colId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, idx)}
                          onDragEnd={handleDragEnd}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-move transition-colors"
                        >
                          {/* Drag Handle */}
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                          
                          {/* Checkbox */}
                          <label className="flex items-center gap-2 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => tablePrefs.toggleColumnVisibility(colId)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {colHeader}
                            </span>
                          </label>
                        </div>
                      )
                    })}
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                  <button
                    onClick={() => {
                      tablePrefs.showAllColumns()
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Reset column order and visibility to defaults?')) {
                        tablePrefs.resetPreferences()
                      }
                    }}
                    className="text-xs font-medium text-gray-600 hover:text-gray-700"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page Size Dropdown - Compact */}
        <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
          <span className={`${fontClasses.base} font-medium text-muted-foreground`}>Show:</span>
          <select
            value={pageSz}
            onChange={(e) => {
              const newSize = Number(e.target.value)
              setPageSz(newSize)
              setPageIndex(0)
            }}
            className={`border-0 bg-transparent ${fontClasses.base} font-medium focus:outline-none rounded px-1`}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={5000}>5000</option>
          </select>
        </div>
      </div>

      {/* Compact Table */}
      <div className="relative rounded-lg border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)] scrollbar-modern">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border bg-muted/30">
                  {hg.headers.map((h, headerIdx) => {
                    const canSort = h.column.getCanSort()
                    const sortDir = h.column.getIsSorted()
                    const columnId = h.column.columnDef.id
                    const isDraggable = tableId && columnId !== 'rowActions' // Enable drag for all columns except rowActions
                    
                    return (
                      <th 
                        key={h.id}
                        draggable={isDraggable}
                        onDragStart={isDraggable ? (e) => handleDragStart(e, headerIdx) : undefined}
                        onDragOver={isDraggable ? (e) => handleDragOver(e, headerIdx) : undefined}
                        onDragLeave={isDraggable ? handleDragLeave : undefined}
                        onDrop={isDraggable ? (e) => handleDrop(e, headerIdx) : undefined}
                        onDragEnd={isDraggable ? handleDragEnd : undefined}
                        className={`px-4 py-3 text-left ${fontClasses.tableHeader} font-semibold text-foreground uppercase tracking-wide transition-colors ${canSort ? 'select-none' : ''} ${isDraggable ? 'cursor-move' : ''}`}
                        title={isDraggable ? 'Drag to reorder • Click to sort' : (canSort ? 'Click to sort' : undefined)}
                      >
                        {h.isPlaceholder ? null : (
                          <div className="flex items-center gap-2">
                            {/* Drag handle icon - only show when tableId is provided and not rowActions */}
                            {isDraggable && (
                              <svg className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            )}
                            <span 
                              onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                              className={canSort ? 'cursor-pointer hover:text-primary' : ''}
                            >
                              {flexRender(h.column.columnDef.header, h.getContext())}
                            </span>
                            {canSort && (
                              <div 
                                className="flex flex-col cursor-pointer"
                                onClick={h.column.getToggleSortingHandler()}
                              >
                                {sortDir === 'asc' ? (
                                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                  </svg>
                                ) : sortDir === 'desc' ? (
                                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-muted-foreground opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border bg-background/50">
              {table.getRowModel().rows.map((row, idx) => {
                const original = row.original
                const rid = getRowId(original)
                const isSelected = selectedId != null && rid === selectedId
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/5 hover:bg-primary/10' 
                        : 'hover:bg-muted/30'
                    }`}
                    onClick={() => onRowClick?.(original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={`px-4 py-3 ${fontClasses.table} text-foreground`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Pagination */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-card px-3 py-2 rounded-lg border">
        <div className="flex items-center gap-1.5">
          <button
            className={`inline-flex items-center justify-center p-1.5 ${fontClasses.base} font-medium rounded-md border border-border bg-background hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          <button
            className={`inline-flex items-center justify-center p-1.5 ${fontClasses.base} font-medium rounded-md border border-border bg-background hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className={`flex items-center gap-1.5 px-3 py-1 ${fontClasses.base} font-medium bg-muted/30 rounded-md`}>
            <span className="text-muted-foreground">Page</span>
            <span className="text-foreground font-semibold">{pageIndex + 1}</span>
            <span className="text-muted-foreground">of</span>
            <span className="text-foreground font-semibold">{pageCount}</span>
          </div>

          <button
            className={`inline-flex items-center justify-center p-1.5 ${fontClasses.base} font-medium rounded-md border border-border bg-background hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            className={`inline-flex items-center justify-center p-1.5 ${fontClasses.base} font-medium rounded-md border border-border bg-background hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {isServer && (
          <div className={`flex items-center gap-1.5 ${fontClasses.base}`}>
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold text-foreground">{total ?? 0}</span>
          </div>
        )}
      </div>

      <PivotModal open={pivotOpen} rows={pivotRows} onClose={() => setPivotOpen(false)} />
    </div>
  )
}

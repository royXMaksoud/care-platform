// Custom hook for managing table column preferences (order & visibility) in localStorage
// Each table has a unique identifier to store its preferences separately

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook to manage table column preferences with localStorage persistence
 * @param {string} tableId - Unique identifier for the table
 * @param {Array} defaultColumns - Default columns configuration
 * @returns {Object} Column preferences and methods to update them
 */
export function useTablePreferences(tableId, defaultColumns = []) {
  const storageKey = `table-prefs-${tableId}`

  // Initialize state with default column order and visibility
  const [columnOrder, setColumnOrder] = useState(() => {
    if (!tableId) return defaultColumns.map(col => col.id)
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate that stored order contains valid column IDs
        if (parsed.columnOrder && Array.isArray(parsed.columnOrder)) {
          const defaultIds = defaultColumns.map(c => c.id)
          // Merge stored order with any new columns that might have been added
          const validStored = parsed.columnOrder.filter(id => defaultIds.includes(id))
          const newCols = defaultIds.filter(id => !validStored.includes(id))
          return [...validStored, ...newCols]
        }
      }
    } catch (e) {
      console.error('Error loading table preferences:', e)
    }
    
    return defaultColumns.map(col => col.id)
  })

  const [columnVisibility, setColumnVisibility] = useState(() => {
    if (!tableId) {
      // Default: all columns visible except rowActions
      return defaultColumns.reduce((acc, col) => {
        acc[col.id] = col.id !== 'rowActions'
        return acc
      }, {})
    }
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.columnVisibility && typeof parsed.columnVisibility === 'object') {
          // Merge with defaults for any new columns
          const defaults = defaultColumns.reduce((acc, col) => {
            acc[col.id] = col.id !== 'rowActions' && (parsed.columnVisibility[col.id] !== false)
            return acc
          }, {})
          return defaults
        }
      }
    } catch (e) {
      console.error('Error loading table preferences:', e)
    }
    
    // Default: all columns visible except rowActions
    return defaultColumns.reduce((acc, col) => {
      acc[col.id] = col.id !== 'rowActions'
      return acc
    }, {})
  })

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!tableId) return
    
    try {
      const preferences = {
        columnOrder,
        columnVisibility,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(preferences))
    } catch (e) {
      console.error('Error saving table preferences:', e)
    }
  }, [columnOrder, columnVisibility, storageKey, tableId])

  // Reorder columns
  const reorderColumn = useCallback((fromIndex, toIndex) => {
    setColumnOrder(prev => {
      const newOrder = [...prev]
      const [removed] = newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, removed)
      return newOrder
    })
  }, [])

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnId) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }))
  }, [])

  // Show all columns
  const showAllColumns = useCallback(() => {
    setColumnVisibility(prev => {
      const newVisibility = { ...prev }
      Object.keys(newVisibility).forEach(key => {
        if (key !== 'rowActions') {
          newVisibility[key] = true
        }
      })
      return newVisibility
    })
  }, [])

  // Hide all columns (except required ones)
  const hideAllColumns = useCallback(() => {
    setColumnVisibility(prev => {
      const newVisibility = { ...prev }
      Object.keys(newVisibility).forEach(key => {
        if (key !== 'rowActions') {
          newVisibility[key] = false
        }
      })
      return newVisibility
    })
  }, [])

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    const defaultOrder = defaultColumns.map(col => col.id)
    const defaultVisibility = defaultColumns.reduce((acc, col) => {
      acc[col.id] = col.id !== 'rowActions'
      return acc
    }, {})
    
    setColumnOrder(defaultOrder)
    setColumnVisibility(defaultVisibility)
    
    if (tableId) {
      try {
        localStorage.removeItem(storageKey)
      } catch (e) {
        console.error('Error resetting table preferences:', e)
      }
    }
  }, [defaultColumns, storageKey, tableId])

  // Get ordered columns with visibility applied
  const getOrderedColumns = useCallback(() => {
    // Create a map for quick lookup
    const columnsMap = defaultColumns.reduce((acc, col) => {
      acc[col.id] = col
      return acc
    }, {})
    
    // Order columns according to saved preference
    const ordered = columnOrder
      .map(id => columnsMap[id])
      .filter(col => col !== undefined)
    
    // Add any new columns that aren't in the order yet
    const orderedIds = new Set(columnOrder)
    const newCols = defaultColumns.filter(col => !orderedIds.has(col.id))
    
    return [...ordered, ...newCols]
  }, [defaultColumns, columnOrder])

  return {
    columnOrder,
    columnVisibility,
    reorderColumn,
    toggleColumnVisibility,
    showAllColumns,
    hideAllColumns,
    resetPreferences,
    getOrderedColumns,
    setColumnOrder,
    setColumnVisibility
  }
}


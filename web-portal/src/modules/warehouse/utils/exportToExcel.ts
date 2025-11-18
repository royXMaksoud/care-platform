/**
 * Excel Export Utility
 * 
 * Generic utility for exporting data to Excel/CSV format.
 * Uses SheetJS (xlsx) library for Excel generation.
 * 
 * @author CARE Team
 */

/**
 * Column definition for export
 */
export interface ExportColumn {
  /**
   * Key in the data object
   */
  key: string
  
  /**
   * Display label for the column header
   */
  label: string
  
  /**
   * Optional formatter function
   */
  formatter?: (value: any, row: any) => string | number
}

/**
 * Export data to Excel file
 * 
 * @param data Array of data objects to export
 * @param columns Column definitions
 * @param fileName Base filename (without extension)
 * 
 * @example
 * ```ts
 * exportToExcel(
 *   warehouses,
 *   [
 *     { key: 'code', label: 'Code' },
 *     { key: 'displayName', label: 'Name' },
 *     { key: 'city', label: 'City' },
 *   ],
 *   'warehouses'
 * )
 * ```
 */
export function exportToExcel(
  data: any[],
  columns: ExportColumn[],
  fileName: string = 'export'
): void {
  try {
    // Dynamic import of xlsx library
    // TODO: Install xlsx package: npm install xlsx
    // import * as XLSX from 'xlsx'
    
    // For now, show a TODO comment
    console.warn('Excel export requires xlsx library. Install with: npm install xlsx')
    
    /**
     * TODO: Implement Excel export using SheetJS (xlsx)
     * 
     * Implementation example:
     * ```ts
     * import * as XLSX from 'xlsx'
     * 
     * // Prepare worksheet data
     * const worksheetData = [
     *   // Header row
     *   columns.map(col => col.label),
     *   // Data rows
     *   ...data.map(row =>
     *     columns.map(col => {
     *       const value = row[col.key]
     *       return col.formatter ? col.formatter(value, row) : value
     *     })
     *   ),
     * ]
     * 
     * // Create workbook and worksheet
     * const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
     * const workbook = XLSX.utils.book_new()
     * XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
     * 
     * // Generate filename with timestamp
     * const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
     * const fullFileName = `${fileName}_${timestamp}.xlsx`
     * 
     * // Download file
     * XLSX.writeFile(workbook, fullFileName)
     * ```
     */
    
    // Fallback: Export as CSV for now
    exportToCSV(data, columns, fileName)
  } catch (error) {
    console.error('Failed to export to Excel:', error)
    throw error
  }
}

/**
 * Export data to CSV file
 * 
 * @param data Array of data objects
 * @param columns Column definitions
 * @param fileName Base filename
 */
export function exportToCSV(
  data: any[],
  columns: ExportColumn[],
  fileName: string = 'export'
): void {
  try {
    // Generate CSV content
    const headers = columns.map(col => col.label).join(',')
    const rows = data.map(row =>
      columns
        .map(col => {
          const value = row[col.key]
          const formatted = col.formatter ? col.formatter(value, row) : value
          // Escape commas and quotes in CSV
          const stringValue = String(formatted ?? '')
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(',')
    )
    
    const csvContent = [headers, ...rows].join('\n')
    
    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19)
      .replace('T', '_')
    const fullFileName = `${fileName}_${timestamp}.csv`
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', fullFileName)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export to CSV:', error)
    throw error
  }
}

/**
 * Generate filename with timestamp
 * 
 * Format: {entity}_{YYYYMMDD}_{HHmm}.{ext}
 * 
 * @param entity Entity name (e.g., 'warehouses', 'materials')
 * @param extension File extension (default: 'xlsx')
 */
export function generateExportFileName(entity: string, extension: string = 'xlsx'): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  return `${entity}_${year}${month}${day}_${hours}${minutes}.${extension}`
}


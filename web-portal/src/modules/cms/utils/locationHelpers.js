// src/modules/cms/utils/locationHelpers.js
import * as XLSX from 'xlsx'

/**
 * Parse Excel file and return array of rows
 * @param {File} file - Excel file
 * @returns {Promise<Array>} Array of row objects
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
        resolve(rows)
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Normalize column names (supports both English and Arabic)
 * Maps common variations to standard keys
 */
const COLUMN_MAPPING = {
  // Country variations
  'country code': 'countryCode',
  'country_code': 'countryCode',
  'country': 'countryCode',
  'الدولة': 'countryCode',
  'كود الدولة': 'countryCode',
  
  // Code variations
  'code': 'code',
  'location code': 'code',
  'location_code': 'code',
  'الكود': 'code',
  'كود الموقع': 'code',
  
  // Name variations
  'name': 'name',
  'location name': 'name',
  'location_name': 'name',
  'الاسم': 'name',
  'اسم الموقع': 'name',
  
  // Parent variations
  'parent code': 'parentCode',
  'parent_code': 'parentCode',
  'parent location code': 'parentCode',
  'parent location code (optional)': 'parentCode',
  'الوالد': 'parentCode',
  'كود الوالد': 'parentCode',
  'كود الموقع الأب': 'parentCode',
  
  // Level variations
  'level': 'level',
  'المستوى': 'level',
  
  // Latitude variations
  'latitude': 'latitude',
  'lat': 'latitude',
  'عرض': 'latitude',
  
  // Longitude variations
  'longitude': 'longitude',
  'lng': 'longitude',
  'long': 'longitude',
  'طول': 'longitude',
  
  // Lineage Path variations
  'lineage path': 'lineagePath',
  'lineage_path': 'lineagePath',
  'path': 'lineagePath',
  'المسار': 'lineagePath',
}

/**
 * Normalize row keys to standard format
 */
export function normalizeRowKeys(row) {
  const normalized = {}
  for (const [key, value] of Object.entries(row)) {
    const lowerKey = key.trim().toLowerCase()
    const mappedKey = COLUMN_MAPPING[lowerKey] || lowerKey
    normalized[mappedKey] = value
  }
  return normalized
}

/**
 * Validate a single location row
 * @param {Object} row - Normalized row data
 * @param {number} index - Row index (0-based, for display: index + 2)
 * @param {Array} allRows - All rows for duplicate checking
 * @param {Array} existingLocations - Existing locations from API (for parent validation)
 * @param {Array} countries - Available countries
 * @returns {Array} Array of error messages (empty if valid)
 */
export function validateLocationRow(row, index, allRows = [], existingLocations = [], countries = []) {
  const errors = []
  const rowNum = index + 2 // Excel row number (header is row 1)

  // Required: countryCode
  const countryCode = String(row.countryCode || '').trim().toUpperCase()
  if (!countryCode) {
    errors.push(`Row ${rowNum}: Country Code is required`)
  } else {
    // Check if country exists
    const countryExists = countries.some(c => 
      c.code?.toUpperCase() === countryCode || 
      c.countryId === countryCode ||
      c.name?.toUpperCase() === countryCode
    )
    if (!countryExists && countries.length > 0) {
      errors.push(`Row ${rowNum}: Country Code "${countryCode}" not found`)
    }
  }

  // Required: code
  const code = String(row.code || '').trim()
  if (!code) {
    errors.push(`Row ${rowNum}: Location Code is required`)
  } else if (code.length > 100) {
    errors.push(`Row ${rowNum}: Location Code exceeds 100 characters`)
  } else {
    // Check for duplicates in current import
    const duplicates = allRows.filter((r, i) => 
      i !== index && String(r.code || '').trim().toUpperCase() === code.toUpperCase()
    )
    if (duplicates.length > 0) {
      errors.push(`Row ${rowNum}: Location Code "${code}" is duplicated in import`)
    }
  }

  // Required: name
  const name = String(row.name || '').trim()
  if (!name) {
    errors.push(`Row ${rowNum}: Location Name is required`)
  } else if (name.length > 200) {
    errors.push(`Row ${rowNum}: Location Name exceeds 200 characters`)
  }

  // Optional: parentCode - if provided, validate
  const parentCode = String(row.parentCode || '').trim()
  if (parentCode) {
    // Check if parent exists in existing locations or in current import
    const parentExists = existingLocations.some(loc => 
      loc.code?.toUpperCase() === parentCode.toUpperCase()
    ) || allRows.some((r, i) => 
      i < index && String(r.code || '').trim().toUpperCase() === parentCode.toUpperCase()
    )
    if (!parentExists) {
      errors.push(`Row ${rowNum}: Parent Code "${parentCode}" not found (must be imported before this row)`)
    }
  }

  // Optional: level - if provided, validate
  if (row.level !== undefined && row.level !== null && row.level !== '') {
    const level = parseInt(row.level)
    if (isNaN(level) || level < 0) {
      errors.push(`Row ${rowNum}: Level must be a non-negative integer`)
    }
  }

  // Optional: latitude - if provided, validate
  if (row.latitude !== undefined && row.latitude !== null && row.latitude !== '') {
    const lat = parseFloat(row.latitude)
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push(`Row ${rowNum}: Latitude must be a number between -90 and 90`)
    }
  }

  // Optional: longitude - if provided, validate
  if (row.longitude !== undefined && row.longitude !== null && row.longitude !== '') {
    const lng = parseFloat(row.longitude)
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push(`Row ${rowNum}: Longitude must be a number between -180 and 180`)
    }
  }

  // Optional: lineagePath - if provided, validate length
  const lineagePath = String(row.lineagePath || '').trim()
  if (lineagePath && lineagePath.length > 1000) {
    errors.push(`Row ${rowNum}: Lineage Path exceeds 1000 characters`)
  }

  return errors
}

/**
 * Calculate level from parent location
 * @param {Object|null} parentLocation - Parent location object
 * @returns {number} Level (0 if no parent, parent.level + 1 otherwise)
 */
export function calculateLevel(parentLocation) {
  if (!parentLocation) return 0 // Root level
  const parentLevel = parentLocation.level ?? 0
  return parentLevel + 1
}

/**
 * Build lineage path for a location
 * @param {Object} location - Location object with code and optional countryCode
 * @param {Object|null} parentLocation - Parent location object
 * @returns {string} Lineage path
 */
export function buildLineagePath(location, parentLocation) {
  const code = String(location.code || '').trim().toLowerCase()
  if (!code) return null

  if (!parentLocation) {
    // Root level: /countryCode/code
    const countryCode = String(location.countryCode || '').trim().toLowerCase()
    if (countryCode) {
      return `/${countryCode}/${code}`
    }
    return `/${code}`
  }

  // Child level: parent.lineagePath/code
  const parentPath = parentLocation.lineagePath || ''
  if (parentPath) {
    return `${parentPath}/${code}`
  }
  // Fallback if parent has no path
  return `/${code}`
}

/**
 * Resolve parent location by code
 * @param {string} code - Parent location code
 * @param {Array} locations - Array of location objects (existing or from import)
 * @returns {Object|null} Parent location or null
 */
export function resolveParentByCode(code, locations) {
  if (!code || !locations) return null
  const codeUpper = String(code).trim().toUpperCase()
  return locations.find(loc => 
    String(loc.code || '').trim().toUpperCase() === codeUpper
  ) || null
}

/**
 * Process rows for import - normalize, validate, and prepare for API
 * @param {Array} rows - Raw rows from Excel
 * @param {Array} existingLocations - Existing locations from API
 * @param {Array} countries - Available countries
 * @returns {Object} { validRows, errors, warnings }
 */
export function processImportRows(rows, existingLocations = [], countries = []) {
  const normalizedRows = rows.map(normalizeRowKeys)
  const errors = []
  const warnings = []
  const validRows = []

  // Build location map for quick lookup (code -> location)
  const locationMap = new Map()
  existingLocations.forEach(loc => {
    if (loc.code) {
      locationMap.set(loc.code.toUpperCase(), loc)
    }
  })

  // First pass: validate all rows
  normalizedRows.forEach((row, index) => {
    const rowErrors = validateLocationRow(row, index, normalizedRows, existingLocations, countries)
    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
    }
  })

  // If there are validation errors, don't process further
  if (errors.length > 0) {
    return { validRows: [], errors, warnings }
  }

  // Second pass: resolve parents and calculate derived fields
  normalizedRows.forEach((row, index) => {
    try {
      const processedRow = { ...row }

      // Resolve countryId from countryCode
      const countryCode = String(row.countryCode || '').trim().toUpperCase()
      const country = countries.find(c => 
        c.code?.toUpperCase() === countryCode || 
        c.countryId === countryCode ||
        c.name?.toUpperCase() === countryCode
      )
      if (country) {
        processedRow.countryId = country.countryId
      }

      // Resolve parent location
      const parentCode = String(row.parentCode || '').trim()
      let parentLocation = null
      if (parentCode) {
        // First check in existing locations
        parentLocation = locationMap.get(parentCode.toUpperCase())
        
        // If not found, check in already-processed rows from this import
        if (!parentLocation) {
          const parentIndex = normalizedRows.findIndex((r, i) => 
            i < index && String(r.code || '').trim().toUpperCase() === parentCode.toUpperCase()
          )
          if (parentIndex >= 0 && validRows[parentIndex]) {
            parentLocation = validRows[parentIndex]
          }
        }

        if (!parentLocation) {
          warnings.push(`Row ${index + 2}: Parent Code "${parentCode}" will be resolved during import`)
        } else {
          processedRow.parentLocationId = parentLocation.locationId || parentLocation._tempId
        }
      }

      // Calculate level if not provided
      if (processedRow.level === undefined || processedRow.level === null || processedRow.level === '') {
        processedRow.level = calculateLevel(parentLocation)
      } else {
        processedRow.level = parseInt(processedRow.level) || 0
      }

      // Build lineage path if not provided
      if (!processedRow.lineagePath || processedRow.lineagePath.trim() === '') {
        processedRow.lineagePath = buildLineagePath(processedRow, parentLocation)
      }

      // Convert coordinates to numbers
      if (processedRow.latitude !== undefined && processedRow.latitude !== null && processedRow.latitude !== '') {
        processedRow.latitude = parseFloat(processedRow.latitude)
      } else {
        processedRow.latitude = null
      }

      if (processedRow.longitude !== undefined && processedRow.longitude !== null && processedRow.longitude !== '') {
        processedRow.longitude = parseFloat(processedRow.longitude)
      } else {
        processedRow.longitude = null
      }

      // Generate temp ID for parent resolution
      if (!processedRow.locationId) {
        processedRow._tempId = `temp_${index}_${Date.now()}`
      }

      validRows.push(processedRow)
    } catch (error) {
      errors.push(`Row ${index + 2}: Processing error - ${error.message}`)
    }
  })

  return { validRows, errors, warnings }
}

/**
 * Convert processed row to API payload
 * @param {Object} row - Processed row
 * @returns {Object} API payload
 */
export function rowToApiPayload(row) {
  return {
    countryId: row.countryId,
    code: String(row.code || '').trim(),
    name: String(row.name || '').trim(),
    level: row.level ?? 0,
    parentLocationId: row.parentLocationId || null,
    lineagePath: row.lineagePath || null,
    latitude: row.latitude || null,
    longitude: row.longitude || null,
    isActive: true,
  }
}


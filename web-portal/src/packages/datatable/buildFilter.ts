// Build FilterRequest that your Spring endpoint expects
// We'll send always POST -> /filter with { criteria: [...], scopes: [...] }
export type UiCriterion = {
  field?: string
  key?: string      // Support both 'field' and 'key'
  fieldName?: string // Also support fieldName for scopes
  op?: string
  operator?: string // Support both 'op' and 'operator'
  value?: any
  allowedValues?: any[]  // Support allowedValues for scopes
  value2?: any    // for BETWEEN
  dataType?: string // For type conversion (UUID, STRING, NUMBER, etc.)
  type?: string     // 'criteria' or 'scope' - indicates if this is a search criterion or permission scope
}

export type FilterRequestBody = {
  criteria?: any[]
  scopes?: any[]
  groups?: any[]
}

export function buildFilterRequest(filters: UiCriterion[] | undefined): FilterRequestBody {
  if (!filters || filters.length === 0) return { criteria: [], scopes: [] }

  const criteria: any[] = []
  const scopes: any[] = []

  filters.forEach(f => {
    // Check if this is a scope filter
    if (f.type === 'scope') {
      const scopeObj: any = {
        fieldName: f.fieldName || f.field || f.key,
        allowedValues: f.allowedValues || f.value || [],
      }
      if (f.dataType) scopeObj.dataType = f.dataType
      console.log('📤 DEBUG buildFilterRequest - Building scope:', scopeObj)
      scopes.push(scopeObj)
    } else {
      // Regular search criterion
      if ((f.field || f.key) && (f.op || f.operator)) {
        const result: any = {
          field: f.field || f.key,
          op: f.op || f.operator,
          value: f.value,
        }
        if (f.value2 !== undefined) result.value2 = f.value2
        if (f.dataType) result.dataType = f.dataType
        criteria.push(result)
      }
    }
  })

  const result = {
    criteria: criteria.length > 0 ? criteria : undefined,
    scopes: scopes.length > 0 ? scopes : undefined,
  }
  console.log('📤 DEBUG buildFilterRequest - Final result:', result)
  return result
}

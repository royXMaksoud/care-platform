// Build FilterRequest that your Spring endpoint expects
// We'll send always POST -> /filter with { criteria: [...], scopes: [...] }
export type UiCriterion = {
  field?: string
  key?: string      // Support both 'field' and 'key'
  op?: string
  operator?: string // Support both 'op' and 'operator'
  value?: any
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
        fieldName: f.field || f.key,
        allowedValues: f.value || f.allowedValues || [],
      }
      if (f.dataType) scopeObj.dataType = f.dataType
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

  return {
    criteria: criteria.length > 0 ? criteria : undefined,
    scopes: scopes.length > 0 ? scopes : undefined,
  }
}

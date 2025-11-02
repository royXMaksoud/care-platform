// Build FilterRequest that your Spring endpoint expects
// We'll send always POST -> /filter with { criteria: [...] }
export type UiCriterion = {
  field?: string
  key?: string      // Support both 'field' and 'key'
  op?: string
  operator?: string // Support both 'op' and 'operator'
  value?: any
  value2?: any    // for BETWEEN
  dataType?: string // For type conversion (UUID, STRING, NUMBER, etc.)
}

export function buildFilterRequest(criteria: UiCriterion[] | undefined) {
  if (!criteria || criteria.length === 0) return { criteria: [] }
  const normalized = criteria
    .filter(c => (c.field || c.key) && (c.op || c.operator))
    .map(c => {
      const result: any = {
        field: c.field || c.key,     // Use 'field' or 'key'
        op: c.op || c.operator,       // Use 'op' or 'operator' - keep names like EQUAL, LIKE, STARTS_WITH, ENDS_WITH, IN, BETWEEN...
        value: c.value,
      }
      if (c.value2 !== undefined) result.value2 = c.value2
      if (c.dataType) result.dataType = c.dataType  // Include dataType if provided
      return result
    })
  return { criteria: normalized }
}

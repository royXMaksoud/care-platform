// Build FilterRequest that your Spring endpoint expects
// We’ll send always POST -> /filter with { criteria: [...] }
export type UiCriterion = {
  field: string
  op: string
  value?: any
  value2?: any    // for BETWEEN
}

export function buildFilterRequest(criteria: UiCriterion[] | undefined) {
  if (!criteria || criteria.length === 0) return { criteria: [] }
  const normalized = criteria
    .filter(c => c.field && c.op)
    .map(c => ({
      field: c.field,
      op: c.op,       // keep names like EQUAL, LIKE, STARTS_WITH, ENDS_WITH, IN, BETWEEN...
      value: c.value,
      value2: c.value2,
    }))
  return { criteria: normalized }
}

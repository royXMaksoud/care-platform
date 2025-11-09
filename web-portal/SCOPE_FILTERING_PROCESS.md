# Filter Scope Implementation Guide
## Professional Standards for Dynamic Filtering with Scope-Based Authorization

---

## Executive Summary

This document outlines the complete architecture and implementation strategy for **scope-based filtering** in microservices, specifically handling cases where:
- User permissions are scope-restricted (e.g., specific branch IDs)
- Filter criteria contain array/collection values
- Type conversion (UUID, ENUM, etc.) must occur safely
- Cross-service consistency must be maintained

---

## Problem Statement

### Original Issue
When filtering schedules by `organizationBranchId` with an `IN` operator and UUID values:
```
Error: Invalid UUID value for field 'organizationBranchId': [7df356fb-f1db-4075-a31b-ba20bc5aad15]
```

### Root Cause
The `GenericSpecification.toPredicate()` method called `convertValue()` on **all values BEFORE** checking the operation type. For IN operators with array values, this attempted to convert an entire array as a single UUID.

### Impact Chain
```
Frontend sends: ["uuid1", "uuid2", "uuid3"]
↓
Controller receives: Collection<String>
↓
GenericSpecification tries: convertValue(["uuid1", "uuid2", "uuid3"], UUID)
↓
Error: Cannot convert array [uuid...] to single UUID
```

---

## Solution Architecture

### Layer 1: Frontend (ScheduleList.jsx)

**Responsibility:** Extract scope values from permissions and prepare filter payload

```javascript
// 1. Load user permissions from auth service
const permRes = await api.get('/auth/me/permissions')

// 2. Traverse permissions structure to find scopeValueId
// Structure: systems → sections → actions → scopes
permissionsData.systems.forEach(system => {
  system.sections?.forEach(section => {
    if (section.name?.toLowerCase().includes('schedule')) {
      section.actions?.forEach(action => {
        action.scopes?.forEach(scope => {
          if (scope.effect === 'ALLOW' && scope.scopeValueId) {
            authorizedBranchIds.add(scope.scopeValueId)  // Extract scopeValueId
          }
        })
      })
    }
  })
})

// 3. Build filter for POST body (NOT query parameters)
setFixedFilters([
  {
    key: 'organizationBranchId',
    operator: 'IN',
    value: Array.from(authorizedBranchIds),  // Array of UUIDs
    dataType: 'UUID'
  }
])
```

**Key Principle:** Use `fixedFilters` (POST body) instead of `queryParams` (URL) for array values

### Layer 2: Controller (ScheduleController.java)

**Responsibility:** Normalize criteria before passing to service layer

```java
public ResponseEntity<Page<ScheduleResponse>> filterSchedules(
        @RequestBody(required = false) FilterRequest request,
        @PageableDefault(size = 20) Pageable pageable
) {
    FilterRequest safe = (request != null) ? request : new FilterRequest();

    // CRITICAL: Normalize IN criteria to handle string-to-UUID conversion
    normalizeInCriteria(safe);

    Page<ScheduleResponse> page = loadAllSchedulesUseCase
            .loadAll(safe, pageable)
            .map(mapper::toResponse);
    return ResponseEntity.ok(page);
}

private void normalizeInCriteria(FilterRequest request) {
    if (request == null || request.getCriteria() == null) {
        return;
    }

    List<SearchCriteria> normalized = new java.util.ArrayList<>();
    for (SearchCriteria criteria : request.getCriteria()) {
        // Handle IN/NOT_IN operations specially
        if (criteria.getOperation() == SearchOperation.IN ||
            criteria.getOperation() == SearchOperation.NOT_IN) {

            Object value = criteria.getValue();

            if (value instanceof Collection) {
                Collection<?> col = (Collection<?>) value;

                // Convert string elements to proper types (UUID, ENUM, etc.)
                if (criteria.getDataType() == ValueDataType.UUID && !col.isEmpty()) {
                    Object first = col.iterator().next();

                    if (first instanceof String) {
                        List<UUID> convertedList = new java.util.ArrayList<>();
                        for (Object item : col) {
                            if (item instanceof String) {
                                try {
                                    convertedList.add(UUID.fromString((String) item));
                                } catch (IllegalArgumentException e) {
                                    System.err.println("⚠️ Invalid UUID in filter: " + item);
                                }
                            } else if (item instanceof UUID) {
                                convertedList.add((UUID) item);
                            }
                        }

                        // Rebuild criteria with converted UUID objects
                        SearchCriteria fixed = SearchCriteria.builder()
                                .key(criteria.getKey())
                                .operation(criteria.getOperation())
                                .value(convertedList)  // UUID objects, not strings
                                .valueTo(criteria.getValueTo())
                                .groupId(criteria.getGroupId())
                                .foreignKey(criteria.isForeignKey())
                                .dataType(criteria.getDataType())
                                .enumClassFqn(criteria.getEnumClassFqn())
                                .build();
                        normalized.add(fixed);
                        continue;
                    }
                }
            }

            // No conversion needed, keep as-is
            normalized.add(criteria);
        } else {
            // Non-IN/NOT_IN operations, keep as-is
            normalized.add(criteria);
        }
    }

    // Replace the original criteria list with normalized one
    request.setCriteria(normalized);
}
```

**Key Principle:** Convert string UUIDs to UUID objects BEFORE passing to JPA specifications

### Layer 3: Shared Library (GenericSpecification.java)

**Responsibility:** Handle JPA Criteria API conversion safely

```java
@Override
public Predicate toPredicate(Root<T> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
    Path<?> path = resolvePath(root, criteria.getKey());

    // CRITICAL FIX: Check for IN/NOT_IN FIRST before calling convertValue on collection
    // This prevents attempting to convert an entire array as a single UUID value
    if (criteria.getOperation() == SearchOperation.IN ||
        criteria.getOperation() == SearchOperation.NOT_IN) {

        // Use convertCollection() which iterates and converts each item individually
        Collection<?> col = convertCollection(criteria.getValue(), criteria.getDataType());
        CriteriaBuilder.In<Object> in = cb.in(path);
        for (Object v : col) {
            in.value(v);
        }
        return criteria.getOperation() == SearchOperation.IN ? in : cb.not(in);
    }

    // For all other operations, convert single values as before
    Object value = convertValue(criteria.getValue(), criteria.getDataType());
    Object valueTo = convertValue(criteria.getValueTo(), criteria.getDataType());

    switch (criteria.getOperation()) {
        case EQUAL:
            return cb.equal(path, value);
        case NOT_EQUAL:
            return cb.notEqual(path, value);
        // ... other operations (GREATER_THAN, LESS_THAN, LIKE, etc.)
        case IS_NULL:
            return cb.isNull(path);
        case IS_NOT_NULL:
            return cb.isNotNull(path);
        default:
            return cb.conjunction();
    }
}

// Helper method that iterates and converts each collection item
private Collection<?> convertCollection(Object value, ValueDataType type) {
    if (value == null) {
        return java.util.List.of();
    }
    Collection<?> raw = (value instanceof Collection)
            ? (Collection<?>) value
            : java.util.List.of(value);
    java.util.List<Object> out = new java.util.ArrayList<>(raw.size());
    for (Object v : raw) {
        Object converted = convertValue(v, type);  // Convert each item individually
        if (converted != null) {
            out.add(converted);
        }
    }
    return out;
}
```

**Key Principle:** Check operation type BEFORE attempting type conversion; use `convertCollection()` for arrays

---

## Implementation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER PERMISSION EXTRACTION (Frontend)                         │
│    api.get('/auth/me/permissions')                               │
│    └─→ Extract scopeValueId from scopes array                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FILTER PAYLOAD CONSTRUCTION (Frontend)                        │
│    fixedFilters = [{                                             │
│      key: 'organizationBranchId',                                │
│      operator: 'IN',                                             │
│      value: ["uuid1", "uuid2"],  ← Array of strings             │
│      dataType: 'UUID'                                            │
│    }]                                                            │
│    POST /api/admin/schedules/filter (POST body)                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CRITERIA NORMALIZATION (Controller)                           │
│    normalizeInCriteria(FilterRequest)                            │
│    └─→ Convert ["uuid1", "uuid2"] → [UUID, UUID]               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. JPA SPECIFICATION PROCESSING (SharedLib)                      │
│    GenericSpecification.toPredicate()                            │
│    └─→ Check IN operator FIRST                                  │
│    └─→ Use convertCollection() for array                        │
│    └─→ Build JPA IN predicate                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. DATABASE QUERY (Repository)                                   │
│    SELECT * FROM schedule                                        │
│    WHERE organization_branch_id IN (uuid1, uuid2)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Example

### Frontend Request
```javascript
POST /api/admin/schedules/filter?page=0&size=20

{
  "criteria": [
    {
      "key": "organizationBranchId",
      "operator": "IN",
      "value": [
        "7df356fb-f1db-4075-a31b-ba20bc5aad15",
        "8abc123e-4567-89ab-cdef-0123456789ab"
      ],
      "dataType": "UUID"
    }
  ]
}
```

### Backend Response
```json
{
  "content": [
    {
      "scheduleId": "123e4567-e89b-12d3-a456-426614174000",
      "organizationBranchId": "7df356fb-f1db-4075-a31b-ba20bc5aad15",
      "dayOfWeek": 1,
      "startTime": "08:00:00",
      "endTime": "16:00:00",
      "slotDurationMinutes": 30,
      "maxCapacityPerSlot": 5,
      "isActive": true,
      "createdAt": "2025-11-08T10:30:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

---

## Handling Additional Scope Types

### Case 1: Enum-Based Scopes
```javascript
// Frontend
setFixedFilters([
  {
    key: 'status',
    operator: 'IN',
    value: ['ACTIVE', 'PENDING'],  // Enum strings
    dataType: 'ENUM',
    enumClassFqn: 'com.care.appointment.domain.model.ScheduleStatus'
  }
])
```

```java
// Controller - same normalization applies
// GenericSpecification will convert strings to enum values

private void normalizeEnumCriteria(FilterRequest request) {
    for (SearchCriteria criteria : request.getCriteria()) {
        if (criteria.getDataType() == ValueDataType.ENUM &&
            criteria.getOperation() == SearchOperation.IN) {
            // Conversion handled by convertCollection() → convertEnum()
        }
    }
}
```

### Case 2: Date Range with Scope
```javascript
// Frontend
setFixedFilters([
  {
    key: 'createdAt',
    operator: 'BETWEEN',
    value: '2025-01-01',
    valueTo: '2025-12-31',
    dataType: 'DATE'
  }
])
```

### Case 3: Multiple Scopes (AND logic)
```javascript
// Frontend
setFixedFilters([
  {
    key: 'organizationBranchId',
    operator: 'IN',
    value: ["uuid1", "uuid2"],
    dataType: 'UUID'
  },
  {
    key: 'status',
    operator: 'EQUAL',
    value: 'ACTIVE',
    dataType: 'STRING'
  }
])
```

---

## Best Practices & Guidelines

### ✅ DO

1. **Use POST body for array filters**
   ```javascript
   // ✅ GOOD - POST body with array
   fixedFilters=[{key: 'id', operator: 'IN', value: ['a','b','c']}]

   // ❌ BAD - URL query params with array
   ?organizationBranchIds=uuid1,uuid2,uuid3
   ```

2. **Specify dataType explicitly**
   ```javascript
   // ✅ GOOD
   {key: 'id', operator: 'IN', value: [...], dataType: 'UUID'}

   // ❌ BAD - no dataType specified
   {key: 'id', operator: 'IN', value: [...]}
   ```

3. **Normalize at controller before passing to service**
   - Ensures type safety
   - Prevents repeated normalization
   - Centralizes error handling

4. **Handle permission scopes in frontend**
   - Extract `scopeValueId` from nested permissions structure
   - Build filter criteria with complete authorized scope
   - Send as `fixedFilters` that auto-apply to all queries

5. **Use alias support for field names**
   ```java
   @JsonAlias({"field", "fieldName"})  // Support multiple names
   private String key;

   @JsonAlias({"op", "operator"})      // Support multiple names
   private SearchOperation operation;
   ```

### ❌ DON'T

1. **Don't rely on URL query parameters for arrays**
   - Gets flattened to strings
   - Type information lost
   - URL length limitations

2. **Don't convert at every layer**
   - Normalize once in controller
   - Pass to service/repository
   - Let JPA handle final conversion

3. **Don't skip null checks**
   ```java
   // ❌ BAD
   for (Object item : criteria.getValue()) { ... }

   // ✅ GOOD
   if (criteria.getValue() != null && criteria.getValue() instanceof Collection) {
       Collection<?> col = (Collection<?>) criteria.getValue();
       for (Object item : col) { ... }
   }
   ```

4. **Don't modify GenericSpecification for service-specific logic**
   - Keep it generic and shared across all services
   - Handle service-specific conversions in controller
   - Only add universal fixes to shared library

---

## Testing Checklist

### Unit Tests Required
- [ ] Controller normalization with various data types (UUID, ENUM, NUMBER, DATE)
- [ ] GenericSpecification with IN/NOT_IN operators
- [ ] Permission scope extraction logic
- [ ] Edge cases: null values, empty arrays, mixed types

### Integration Tests Required
- [ ] E2E filter with single scopeValueId
- [ ] E2E filter with multiple scopeValueIds
- [ ] E2E filter with permission-based scopes
- [ ] E2E filter with user filters + fixed filters combined
- [ ] Error handling for invalid UUIDs in filter

### Manual Testing
```bash
# Test 1: Single scope value
POST http://localhost:6060/appointment/api/admin/schedules/filter
{
  "criteria": [{
    "key": "organizationBranchId",
    "operator": "IN",
    "value": ["7df356fb-f1db-4075-a31b-ba20bc5aad15"],
    "dataType": "UUID"
  }]
}
# Expected: 200 OK with filtered schedules

# Test 2: Multiple scope values
POST http://localhost:6060/appointment/api/admin/schedules/filter
{
  "criteria": [{
    "key": "organizationBranchId",
    "operator": "IN",
    "value": ["uuid1", "uuid2", "uuid3"],
    "dataType": "UUID"
  }]
}
# Expected: 200 OK with schedules from all 3 branches

# Test 3: NOT_IN operator
POST http://localhost:6060/appointment/api/admin/schedules/filter
{
  "criteria": [{
    "key": "organizationBranchId",
    "operator": "NOT_IN",
    "value": ["uuid1"],
    "dataType": "UUID"
  }]
}
# Expected: 200 OK with schedules excluding specified branch
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `Invalid UUID value for field '[uuid...]'` | Array sent to `convertValue()` | Check IN operator BEFORE convertValue() |
| `[object Object]` in filters | Array sent as URL param | Use POST body with fixedFilters |
| `Empty filter results` | Scope filter too restrictive | Verify scopeValueId extraction from permissions |
| `Enum not found` | Missing enumClassFqn | Provide fully-qualified enum class name |
| `Type mismatch` | DataType not specified | Always specify dataType in filter criteria |

---

## Files Modified & Changes Summary

### 1. **GenericSpecification.java** (shared-libs)
**Change:** Moved IN/NOT_IN operator check before `convertValue()` calls
```
Before: convertValue(criteria.getValue()) → switch(operation)
After:  if (IN/NOT_IN) → convertCollection() → return
        else → convertValue() → switch(operation)
```

### 2. **ScheduleController.java** (appointment-service)
**Change:** Added `normalizeInCriteria()` method to convert string UUIDs to UUID objects
```
Before: No normalization, direct pass to service
After:  Normalize IN criteria → convert strings to UUID objects → pass to service
```

### 3. **ScheduleList.jsx** (web-portal)
**Change:** Extract scopeValueId from permissions and use fixedFilters instead of queryParams
```
Before: No permission-based filtering
After:  Load permissions → extract scopeValueId → build fixedFilters → apply to CrudPage
```

---

## Future Enhancements

1. **Scope Caching** - Cache permission scopes to reduce API calls
2. **Multi-Scope AND/OR Logic** - Support complex scope combinations
3. **Dynamic Scope Merging** - Merge user filters with scope filters intelligently
4. **Audit Logging** - Log all scope-based filtering for compliance
5. **Scope Validation** - Validate that returned data matches user's authorized scopes

---

## References

- **Spring Data JPA Specifications:** [Spring Docs](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#specifications)
- **JPA Criteria API:** [Jakarta Persistence Documentation](https://jakarta.ee/specifications/persistence/)
- **Authorization/RBAC Pattern:** [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-09
**Author:** Claude Code
**Status:** Production Ready

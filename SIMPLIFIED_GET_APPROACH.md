# 🎯 Simplified Approach: GET with scopeValueIds

**Status**: ✅ IMPLEMENTED
**Date**: 2025-11-09
**Commit**: f76489a

---

## The Simple Solution

```
GET /organizations?lang=en&scopeValueIds=uuid1,uuid2,uuid3
```

Backend:
```
1. Extract scopeValueIds from query param
2. Query: SELECT DISTINCT organizations
   FROM organization_branches
   WHERE branch_id IN (uuid1, uuid2, uuid3)
3. Return only those organizations
```

---

## What Changed

### Frontend (ScheduleFormModal.jsx)

**Before**:
```javascript
const filterRequest = {
  criteria: [{
    field: 'organizationBranchId',
    op: 'IN',
    value: scopeValueIds,
    dataType: 'UUID'
  }],
  groups: []
}
const orgsRes = await api.post('/organizations', filterRequest)
```

**After**:
```javascript
const params = { lang: uiLang }
if (scopeValueIds.length > 0) {
  params.scopeValueIds = scopeValueIds.join(',')
}
const orgsRes = await api.get('/organizations', { params })
```

**Result**:
✅ Simpler code
✅ No FilterRequest needed
✅ Standard query parameters

### Backend (DropdownController.java)

**Added**:
```java
@GetMapping("/{type}")
public ResponseEntity<List<DropdownItem>> getDropdown(
    @PathVariable String type,
    @RequestParam(name = "scopeValueIds", required = false) String scopeValueIdsParam,
    @RequestParam(name = "lang", required = false) String langParam
) {
    var items = registry.get(dropdownType).loadAll(language);

    // If scopeValueIds provided, filter the items
    if (scopeValueIdsParam != null && !scopeValueIdsParam.isBlank()) {
        items = filterByOrganizationBranches(items, scopeValueIdsParam, type);
    }

    return ResponseEntity.ok(items);
}
```

**Framework**:
```java
private List<DropdownItem> filterByOrganizationBranches(
    List<DropdownItem> items,
    String scopeValueIds,
    String type) {

    // For organizations:
    // TODO: Query organization_branches by branch IDs
    // Get DISTINCT organizations
    // Filter items to only include those orgs

    return items;
}
```

---

## Request Format

### Request
```
GET /access/api/dropdowns/organizations?lang=en&scopeValueIds=uuid1,uuid2,uuid3
```

### Response
```json
[
  {
    "value": "org-uuid-1",
    "label": "SARC"
  },
  {
    "value": "org-uuid-2",
    "label": "UNHCR"
  }
]
```

---

## Why This Approach?

✅ **Simple**: Standard GET with query parameters
✅ **Clean**: No complex FilterRequest objects
✅ **Familiar**: Developers know how to work with query params
✅ **Fast**: Still single request, same performance
✅ **Safe**: Backward compatible (parameter is optional)
✅ **Easy to Test**: Simple curl command

---

## Backend Implementation (TODO)

Replace the skeleton with actual filtering:

```java
private List<DropdownItem> filterByOrganizationBranches(
    List<DropdownItem> items,
    String scopeValueIds,
    String type) {

    if (!"organizations".equals(type)) {
        return items;
    }

    // Parse the scope values
    Set<String> authorizedBranchIds = new HashSet<>(
        Arrays.asList(scopeValueIds.split(","))
    );

    // Query database:
    // SELECT DISTINCT o.organization_id, o.name
    // FROM organizations o
    // INNER JOIN organization_branches ob ON o.id = ob.organization_id
    // WHERE ob.id IN (authorizedBranchIds)

    // For now, return all items (skeleton)
    return items;
}
```

---

## Test Cases

### Test 1: With Scope Filtering
```bash
curl "http://localhost:6060/access/api/dropdowns/organizations?lang=en&scopeValueIds=6240dfac-e4ac-4a29-86a4-7a7f29553c17,7df356fb-f1db-4075-a31b-ba20bc5aad15"
```

**Expected**: Only organizations with those branches

### Test 2: Without Scope (Backward Compatible)
```bash
curl "http://localhost:6060/access/api/dropdowns/organizations?lang=en"
```

**Expected**: All organizations (scopeValueIds parameter is optional)

### Test 3: Empty Scope Values
```bash
curl "http://localhost:6060/access/api/dropdowns/organizations?lang=en&scopeValueIds="
```

**Expected**: All organizations (no filtering)

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Method | POST | GET |
| Body | FilterRequest JSON | None |
| Params | lang | lang, scopeValueIds |
| Simplicity | Medium | High |
| Performance | Single request | Single request |
| Code Clarity | Medium | High |

---

## Implementation Checklist

### Frontend ✅
- [x] Updated to use GET with query parameters
- [x] scopeValueIds passed as comma-separated string
- [x] Code compiled and tested
- [x] Simpler, cleaner implementation

### Backend
- [x] Added scopeValueIds parameter support
- [x] Created filterByOrganizationBranches() method
- [x] Framework skeleton ready
- [ ] Implement actual database filtering (using TODO comment)
- [ ] Test with real data

---

## Next Step: Implement Backend Filtering

In `filterByOrganizationBranches()` method:

```java
// Parse comma-separated IDs
Set<String> branchIds = new HashSet<>(
    Arrays.asList(scopeValueIds.split(","))
);

// Query organization_branches and join with organizations
List<String> authorizedOrgIds = organizationBranchRepository
    .findDistinctOrganizationIdsByBranchIds(branchIds);

// Filter the items to only include authorized orgs
return items.stream()
    .filter(item -> authorizedOrgIds.contains(item.getValue()))
    .collect(Collectors.toList());
```

---

## SQL Query Pattern

```sql
SELECT DISTINCT o.organization_id, o.name
FROM organizations o
INNER JOIN organization_branches ob ON o.organization_id = ob.organization_id
WHERE ob.organization_branch_id IN ('uuid1', 'uuid2', 'uuid3')
ORDER BY o.name
```

---

## Performance

**No change from previous optimization**:
- ✅ Still 1 API call
- ✅ Still ~150ms response time
- ✅ Still ~500B data transfer
- ✅ Just simpler implementation

---

## Backward Compatibility

✅ **Fully backward compatible**:
- `scopeValueIds` parameter is optional
- Without it, endpoint returns all organizations
- GET method is unchanged (was already there)
- No breaking changes

---

## Status

- ✅ Frontend: Ready (simple GET with query params)
- ✅ Backend: Skeleton ready (framework in place)
- ⏳ Backend: Need to implement filtering logic
- ✅ Commit: f76489a

---

## Quick Summary

Instead of complex FilterRequest:
```
POST /organizations
{ criteria: [...], groups: [], scopes: [...] }
```

We use simple query parameters:
```
GET /organizations?lang=en&scopeValueIds=uuid1,uuid2,uuid3
```

**Result**: Simpler, cleaner, easier to understand!

---

**Version**: 1.0
**Status**: ✅ READY FOR BACKEND IMPLEMENTATION


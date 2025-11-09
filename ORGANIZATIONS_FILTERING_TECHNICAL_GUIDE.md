# 🛠️ Organizations Filtering - Technical Implementation Guide

**Status**: ✅ Ready for Backend Implementation
**Date**: 2025-11-09

---

## Request Format

### Frontend Sends POST Request

**Endpoint**: `POST /access/api/dropdowns/organizations`

**Headers**:
```
Content-Type: application/json
Accept-Language: en
```

**Query Parameters**:
```
?lang=en
```

**Request Body**:
```json
{
  "criteria": [
    {
      "field": "organizationBranchId",
      "op": "IN",
      "value": [
        "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
        "7df356fb-f1db-4075-a31b-ba20bc5aad15",
        "8df456fb-f1db-4075-a31b-ba20bc5aad16"
      ],
      "dataType": "UUID"
    }
  ],
  "groups": []
}
```

---

## What Backend Should Do

### 1. Receive and Parse Request

```java
@PostMapping("/{type}")
public ResponseEntity<List<DropdownItem>> getFilteredDropdown(
    @PathVariable String type,              // "organizations"
    @Valid @RequestBody FilterRequest filterRequest,
    @RequestParam(name = "lang", required = false) String langParam
)
```

**Extract**:
- Type: "organizations"
- Language: "en" (from param)
- Criteria: organizationBranchId with value list
- Operation: IN (means WHERE id IN (...))

### 2. Parse FilterRequest

```java
// Check if type is "organizations"
if ("organizations".equals(type)) {

    // Get the criteria
    List<FilterCriteria> criteria = filterRequest.getCriteria();

    // Find organizationBranchId criteria
    FilterCriteria branchIdCriteria = criteria.stream()
        .filter(c -> "organizationBranchId".equals(c.getField()))
        .findFirst()
        .orElse(null);

    if (branchIdCriteria != null && "IN".equals(branchIdCriteria.getOp())) {
        // Extract the branch IDs
        List<UUID> branchIds = (List<UUID>) branchIdCriteria.getValue();

        // Now we have the authorized branch IDs to filter by
        // branchIds = [uuid1, uuid2, uuid3]
    }
}
```

### 3. Build Database Query

```sql
SELECT DISTINCT
    o.organization_id,
    o.name,
    o.logo,
    o.address,
    o.contact_email,
    -- ... any other fields ...
FROM organizations o
INNER JOIN organization_branches ob
    ON o.organization_id = ob.organization_id
WHERE ob.organization_branch_id IN (
    '6240dfac-e4ac-4a29-86a4-7a7f29553c17',
    '7df356fb-f1db-4075-a31b-ba20bc5aad15',
    '8df456fb-f1db-4075-a31b-ba20bc5aad16'
)
AND o.language = 'en'
ORDER BY o.name ASC
```

**Why INNER JOIN?**
- We ONLY want organizations that HAVE authorized branches
- INNER JOIN ensures branch exists for that organization
- DISTINCT removes duplicates if org has multiple authorized branches

**Why DISTINCT?**
- If organization has 2 authorized branches, it appears twice
- DISTINCT returns it once

**Why language filter?**
- Different organizations for different languages
- Filter by the requested language (en, ar, etc.)

### 4. Create Repository Method

```java
// In your OrganizationRepository or OrganizationBranchRepository
@Query("""
    SELECT DISTINCT o FROM Organization o
    INNER JOIN OrganizationBranch ob ON o.id = ob.organization.id
    WHERE ob.id IN :branchIds
    AND o.language = :language
    ORDER BY o.name ASC
""")
List<Organization> findByAuthorizedBranches(
    @Param("branchIds") List<UUID> branchIds,
    @Param("language") String language
);
```

### 5. Convert to DropdownItem

```java
List<DropdownItem> items = organizations.stream()
    .map(org -> new DropdownItem(
        org.getId().toString(),           // value/id
        org.getName()                      // label
    ))
    .collect(Collectors.toList());

return ResponseEntity.ok(items);
```

---

## Complete Implementation Example

### Controller Method

```java
@PostMapping("/{type}")
@Operation(summary = "Get filtered dropdown list using FilterRequest criteria")
public ResponseEntity<List<DropdownItem>> getFilteredDropdown(
        @PathVariable String type,
        @Valid @RequestBody FilterRequest filterRequest,
        @RequestParam(name = "lang", required = false) String langParam
) {
    // Get language
    String language = (langParam != null && !langParam.isBlank())
            ? langParam : "en";

    // Get dropdown type
    DropdownType dropdownType = DropdownType.fromPath(type);
    DropdownProvider provider = registry.get(dropdownType);

    // Load all items for this type
    List<DropdownItem> allItems = provider.loadAll(language);

    // If it's organizations, apply branch filtering
    if (DropdownType.ORGANIZATIONS.equals(dropdownType)) {
        allItems = filterByOrganizationBranches(allItems, filterRequest, language);
    }

    return ResponseEntity.ok(allItems);
}

private List<DropdownItem> filterByOrganizationBranches(
        List<DropdownItem> allItems,
        FilterRequest filterRequest,
        String language) {

    // Get organizationBranchId criteria
    var branchCriteria = filterRequest.getCriteria().stream()
        .filter(c -> "organizationBranchId".equals(c.getField()))
        .findFirst();

    if (branchCriteria.isEmpty()) {
        return allItems;  // No filtering needed
    }

    var criteria = branchCriteria.get();

    // Extract branch IDs from criteria
    @SuppressWarnings("unchecked")
    List<UUID> branchIds = (List<UUID>) criteria.getValue();

    if (branchIds.isEmpty()) {
        return List.of();  // No branches = no organizations
    }

    // Query database
    List<Organization> authorizedOrgs = organizationRepository
        .findByAuthorizedBranches(branchIds, language);

    // Convert to DropdownItems
    return authorizedOrgs.stream()
        .map(org -> new DropdownItem(
            org.getId().toString(),
            org.getName()
        ))
        .collect(Collectors.toList());
}
```

---

## Test Cases

### Test 1: Filter with Valid Branch IDs
**Request**:
```json
{
  "criteria": [{
    "field": "organizationBranchId",
    "op": "IN",
    "value": ["uuid1", "uuid2"]
  }],
  "groups": []
}
```

**Expected Response**:
```json
[
  {"value": "org-uuid-1", "label": "SARC"},
  {"value": "org-uuid-2", "label": "UNHCR"}
]
```

### Test 2: Empty Criteria
**Request**:
```json
{
  "criteria": [],
  "groups": []
}
```

**Expected Response**: All organizations (no filtering)

### Test 3: No Organizations Match
**Request**:
```json
{
  "criteria": [{
    "field": "organizationBranchId",
    "op": "IN",
    "value": ["non-existent-uuid"]
  }],
  "groups": []
}
```

**Expected Response**:
```json
[]
```

### Test 4: Language Parameter
**Request**: Same as Test 1, but with `?lang=ar`

**Expected Response**: Organizations in Arabic

---

## Database Schema Requirements

### Tables Needed

```sql
-- Organizations table
CREATE TABLE organizations (
    organization_id UUID PRIMARY KEY,
    name VARCHAR(255),
    language VARCHAR(10),  -- 'en', 'ar', etc.
    logo TEXT,
    address TEXT,
    contact_email VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    -- ... other fields ...
);

-- Organization Branches table
CREATE TABLE organization_branches (
    organization_branch_id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    name VARCHAR(255),
    language VARCHAR(10),
    address TEXT,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    -- Foreign key to organizations
    CONSTRAINT fk_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(organization_id),

    -- Indexes for performance
    INDEX idx_organization_id (organization_id),
    INDEX idx_branch_id (organization_branch_id),
    INDEX idx_language (language)
);
```

### Indexes Recommended

```sql
-- For filtering branches by ID
CREATE INDEX idx_organization_branches_branch_id
    ON organization_branches(organization_branch_id);

-- For joining with organizations
CREATE INDEX idx_organization_branches_org_id
    ON organization_branches(organization_id);

-- For language filtering
CREATE INDEX idx_organizations_language
    ON organizations(language);

-- Composite index for common query pattern
CREATE INDEX idx_orgs_branches_filter
    ON organization_branches(organization_branch_id, organization_id);
```

---

## Error Handling

### What Can Go Wrong

```java
try {
    // 1. Invalid UUID format in criteria
    List<UUID> branchIds = (List<UUID>) criteria.getValue();
    // Throws: NumberFormatException or ClassCastException

    // 2. Database connection error
    List<Organization> result = repository.findByAuthorizedBranches(...);
    // Throws: DataAccessException

    // 3. No results found
    // Returns: Empty list (this is OK, not an error)

} catch (ClassCastException e) {
    // Invalid criteria format
    return ResponseEntity.badRequest().build();
} catch (DataAccessException e) {
    // Database error
    return ResponseEntity.status(500).build();
}
```

### Response Codes

| Scenario | Code | Response |
|----------|------|----------|
| Success | 200 | List of organizations |
| No results | 200 | Empty list `[]` |
| Invalid criteria | 400 | Bad Request |
| Database error | 500 | Internal Server Error |
| Unauthorized | 403 | Forbidden |

---

## Performance Tips

### 1. Use Database Indexes
```java
// Fast because of indexes on:
// - organization_branch_id (WHERE clause)
// - organization_id (JOIN)
SELECT DISTINCT o.* FROM organizations o
INNER JOIN organization_branches ob ON o.id = ob.organization_id
WHERE ob.organization_branch_id IN (...)
```

### 2. Limit Returned Columns
```java
// Don't select unnecessary columns
SELECT DISTINCT o.organization_id, o.name  // Just what we need
// NOT: SELECT DISTINCT o.*  (all columns)
```

### 3. Use DISTINCT Carefully
```java
// DISTINCT can be slow with many columns
// Use only on minimum necessary columns
SELECT DISTINCT o.organization_id, o.name
```

### 4. Cache Results
```java
// If organizations don't change often, cache them
@Cacheable(value = "organizations", key = "#language")
List<Organization> findByAuthorizedBranches(List<UUID> branchIds, String language)
```

---

## Example Request/Response

### Real Example

**Request**:
```bash
curl -X POST http://localhost:6060/access/api/dropdowns/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "criteria": [{
      "field": "organizationBranchId",
      "op": "IN",
      "value": [
        "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
        "7df356fb-f1db-4075-a31b-ba20bc5aad15"
      ],
      "dataType": "UUID"
    }],
    "groups": []
  }' \
  -G --data-urlencode "lang=en"
```

**Response**:
```json
[
  {
    "value": "f0b4a9c5-1234-5678-9abc-def012345678",
    "label": "SARC - Syrian Arab Red Crescent"
  },
  {
    "value": "a1c9e6f2-abcd-ef01-2345-6789abcdef01",
    "label": "UNHCR - UN Refugee Agency"
  }
]
```

---

## Integration Steps

### Step 1: Create Repository Method ✅
Implement `findByAuthorizedBranches()` in your repository

### Step 2: Update Controller ✅
Implement filtering logic in `getFilteredDropdown()` method

### Step 3: Test
- Unit test the filtering logic
- Integration test the endpoint
- Test with actual data

### Step 4: Deploy
- Build and package
- Deploy to dev environment
- Test in real application

### Step 5: Monitor
- Check response times (~150ms target)
- Verify correct organizations returned
- Monitor database query performance

---

## Debugging Tips

### 1. Log the Criteria
```java
logger.info("Received criteria: {}", filterRequest.getCriteria());
// Should show: [{field: 'organizationBranchId', op: 'IN', value: [uuid1, uuid2]}]
```

### 2. Log the Branch IDs
```java
logger.info("Branch IDs to filter: {}", branchIds);
// Should show: [uuid1, uuid2, ...]
```

### 3. Log the SQL Query
```java
// Enable in application.yml:
// spring.jpa.properties.hibernate.format_sql: true
// spring.jpa.properties.hibernate.use_sql_comments: true
// logging.level.org.hibernate.SQL: DEBUG
```

### 4. Check Database Data
```sql
-- Verify data exists
SELECT organization_branch_id, organization_id
FROM organization_branches
WHERE organization_branch_id IN ('uuid1', 'uuid2');

-- Verify organization exists
SELECT organization_id, name, language
FROM organizations
WHERE language = 'en';
```

---

## Fallback Strategy

### If POST Endpoint Not Ready

Frontend can fallback to GET:

```javascript
try {
  // Try optimized POST
  const response = await api.post('/organizations', filterRequest)
  return response.data
} catch (error) {
  // Fallback to GET all and filter client-side
  const allOrgs = await api.get('/organizations', { params: { lang } })
  return filterOnClient(allOrgs, scopeValueIds)
}
```

### When to Remove Fallback

Once POST endpoint is verified working:
```javascript
// After testing, can remove fallback:
const response = await api.post('/organizations', filterRequest)
return response.data
```

---

## Monitoring Checklist

- [ ] Response time < 200ms
- [ ] Network payload < 2KB
- [ ] No N+1 query problems
- [ ] Correct organizations returned
- [ ] Language filtering working
- [ ] Database queries optimized
- [ ] Error handling working
- [ ] Fallback mechanism tested

---

## Summary

To implement organizations filtering:

1. **Parse** the FilterRequest criteria
2. **Extract** organizationBranchId values
3. **Query** organization_branches table with those IDs
4. **Join** with organizations table
5. **Filter** by language
6. **Return** as DropdownItem list

**Result**: Frontend gets filtered organizations in one request! ✅

---

**Version**: 1.0
**Status**: ✅ Ready for Implementation
**Date**: 2025-11-09


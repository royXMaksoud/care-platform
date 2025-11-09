# Scope Filtering: Frontend to Backend Flow

## Overview

This document explains how the system filters organizations and branches based on user permissions using scope values, starting from the Frontend (React) through the Backend (microservices).

**Key Concept**: Instead of the Frontend loading all data and filtering locally, the user's `scopeValueIds` are sent to the Backend, which performs server-side filtering and returns only authorized data.

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend (React) - ScheduleFormModal.jsx                             │
├─────────────────────────────────────────────────────────────────────┤
│ 1. User opens ScheduleFormModal                                      │
│ 2. Component extracts user permissions from PermissionsContext       │
│ 3. Extracts systemSectionActionId & scopeValueIds from permissions   │
│ 4. Sends to Backend with request payload                             │
└──────────────────────────┬──────────────────────────────────────────┘
                          │
                          │ HTTP Request with:
                          │ - systemSectionActionId
                          │ - scopeValueIds []
                          │ - language (en/ar)
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API Gateway (Port 6060)                                              │
├─────────────────────────────────────────────────────────────────────┤
│ Routes request to appropriate Backend Service                        │
│ - /access/api/dropdowns/... → access-management-service             │
│ - /appointment/api/admin/... → appointment-service                   │
└──────────────────────────┬──────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Backend Service (access-management-service or appointment-service)   │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Receive request with scopeValueIds                                │
│ 2. Create FilterRequest with scope criteria                          │
│ 3. Pass to GenericSpecificationBuilder                               │
│ 4. Builder applies scopes as database filter                         │
│ 5. Execute JPA query with scope restrictions                         │
│ 6. Return only authorized records                                    │
└──────────────────────────┬──────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Database (PostgreSQL)                                                │
├─────────────────────────────────────────────────────────────────────┤
│ WHERE organization_branch_id IN (scope values from user)             │
│ Returns only records matching scope restrictions                     │
└──────────────────────────┬──────────────────────────────────────────┘
                          │
                          ▼ Filtered Results
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend receives filtered data                                       │
│ - Only organizations with authorized branches shown                  │
│ - Only branches the user has permission to access shown              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Implementation (React)

### 1. Permission Extraction

**File**: `web-portal/src/modules/appointment/pages/schedule/ScheduleFormModal.jsx`

```javascript
// Extract permissions from context
const { getSectionPermissions, permissionsData } = usePermissionCheck()

// Get section permissions for Appointment Schedule Management
let sectionPerms = getSectionPermissions('Appointment Schedule Mangement', 'Appointments')

// Extract scope values
const scopeValueIds = []
let systemSectionActionId = null

sectionPerms.actions?.forEach(action => {
  // Store action ID (e.g., "ec37e595-d7d6-4daf-9149-70815959ddf2")
  if (!systemSectionActionId && action.systemSectionActionId) {
    systemSectionActionId = action.systemSectionActionId
  }

  // Extract all allowed scope values (organization branch IDs)
  action.scopes?.forEach(scope => {
    if (scope.effect === 'ALLOW' && scope.scopeValueId) {
      scopeValueIds.push(scope.scopeValueId)
    }
  })
})

console.log('Scope values:', scopeValueIds)
// Output: ["uuid1", "uuid2", "uuid3"]
```

### 2. Permission Structure (from Backend)

The permissions returned from `/access/api/user/profile` look like:

```json
{
  "sections": [
    {
      "sectionName": "Appointment Schedule Mangement",
      "actions": [
        {
          "systemSectionActionId": "ec37e595-d7d6-4daf-9149-70815959ddf2",
          "actionName": "CREATE_SCHEDULE",
          "scopes": [
            {
              "scopeValueId": "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
              "effect": "ALLOW",
              "scopeTypeId": "ORG_BRANCH"
            },
            {
              "scopeValueId": "7df356fb-f1db-4075-a31b-ba20bc5aad15",
              "effect": "ALLOW",
              "scopeTypeId": "ORG_BRANCH"
            }
          ]
        }
      ]
    }
  ]
}
```

### 3. Frontend Request Examples

#### A. Load Organizations by Branches (Preferred)

**Endpoint**: `POST /access/api/dropdowns/organizations-by-branches`

```javascript
const orgRes = await api.post('/access/api/dropdowns/organizations-by-branches', {
  systemSectionActionId: "ec37e595-d7d6-4daf-9149-70815959ddf2",
  scopeValueIds: [
    "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
    "7df356fb-f1db-4075-a31b-ba20bc5aad15"
  ]
}, {
  params: { lang: 'en' }
})

// Response: Array of organizations that contain authorized branches
// [
//   { organizationId: "org-uuid-1", name: "Organization 1" },
//   { organizationId: "org-uuid-2", name: "Organization 2" }
// ]
```

#### B. Load Branches by Organization (with scope filtering)

**Endpoint**: `POST /access/api/cascade-dropdowns/organization-branches-by-organization-filtered`

```javascript
const branchRes = await api.post(
  '/access/api/cascade-dropdowns/organization-branches-by-organization-filtered',
  {
    organizationId: "org-uuid-1",
    systemSectionActionId: "ec37e595-d7d6-4daf-9149-70815959ddf2",
    scopeValueIds: [
      "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
      "7df356fb-f1db-4075-a31b-ba20bc5aad15"
    ]
  },
  {
    params: { lang: 'en' }
  }
)

// Response: Array of branches for this org that user has access to
// [
//   { organizationBranchId: "uuid1", name: "Branch 1", organizationId: "org-uuid-1" },
//   { organizationBranchId: "uuid2", name: "Branch 2", organizationId: "org-uuid-1" }
// ]
```

#### C. Load Schedules with Scope Filtering

**Endpoint**: `POST /appointment/api/admin/schedules/filter`

```javascript
const schedulesRes = await api.post('/appointment/api/admin/schedules/filter', {
  criteria: [], // Frontend filter criteria
  groups: [],
  scopes: [{
    fieldName: 'organizationBranchId',
    allowedValues: [
      "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
      "7df356fb-f1db-4075-a31b-ba20bc5aad15"
    ],
    dataType: 'UUID'
  }]
}, {
  params: { page: 0, size: 10000, language: 'en' }
})

// Response: Schedules filtered by scope
```

---

## Backend Implementation (Java)

### 1. Controller Layer - Scope Extraction

**File**: `appointment-service/src/main/java/com/care/appointment/web/controller/admin/ScheduleController.java`

```java
@PostMapping("/filter")
public ResponseEntity<Page<ScheduleResponse>> filterSchedules(
        @RequestBody(required = false) FilterRequest request,
        @PageableDefault(size = 20) Pageable pageable
) {
    FilterRequest safe = (request != null) ? request : new FilterRequest();

    // Step 1: Normalize criteria (String → UUID conversion)
    FilterNormalizer.normalize(safe);

    // Step 2: Apply user's scope-based permissions from JWT
    applyUserScopes(safe);

    // Step 3: Pass enriched filter to service
    Page<ScheduleResponse> page = loadAllSchedulesUseCase
            .loadAll(safe, pageable)
            .map(mapper::toResponse);
    return ResponseEntity.ok(page);
}

/**
 * Extract user's scopes from JWT claims and add to FilterRequest
 * Scopes from JWT override/merge with frontend scopes
 */
private void applyUserScopes(FilterRequest filter) {
    try {
        // Get user from security context (populated by JwtAuthenticationFilter)
        var currentUser = CurrentUserContext.get();
        if (currentUser == null) {
            return;
        }

        // Extract organizationBranchIds from JWT claims
        Object scopeValue = currentUser.claims().get("organizationBranchIds");

        if (scopeValue != null) {
            List<UUID> allowedBranchIds = extractUUIDs(scopeValue);

            if (!allowedBranchIds.isEmpty()) {
                List<ScopeCriteria> scopes = (filter.getScopes() != null)
                    ? new ArrayList<>(filter.getScopes())
                    : new ArrayList<>();

                // Only add if not already present from request
                boolean hasBranchScope = scopes.stream()
                    .anyMatch(s -> "organizationBranchId".equals(s.getFieldName()));

                if (!hasBranchScope) {
                    scopes.add(ScopeCriteria.builder()
                        .fieldName("organizationBranchId")
                        .allowedValues(new ArrayList<>(allowedBranchIds))
                        .dataType(ValueDataType.UUID)
                        .build());

                    filter.setScopes(scopes);
                }
            }
        }
    } catch (Exception e) {
        // Gracefully fail if user context not available
    }
}

private List<UUID> extractUUIDs(Object scopeValue) {
    List<UUID> result = new ArrayList<>();

    if (scopeValue instanceof List<?>) {
        ((List<?>) scopeValue).forEach(item -> {
            try {
                if (item instanceof UUID uuid) {
                    result.add(uuid);
                } else if (item instanceof String str) {
                    result.add(UUID.fromString(str.trim()));
                }
            } catch (Exception ignored) {}
        });
    }
    // ... handle other types

    return result;
}
```

### 2. Service Layer - No Changes Needed

**File**: `ScheduleService.java`

The service layer simply receives the enriched `FilterRequest` and passes it to the database adapter. No scope handling needed here.

```java
@Override
@Transactional(readOnly = true)
public Page<Schedule> loadAll(FilterRequest filter, Pageable pageable) {
    // Service just delegates to adapter
    // All scope handling done by adapter
    return scheduleSearchPort.search(filter, pageable);
}
```

### 3. Database Adapter - Scope Processing

**File**: `ScheduleDbAdapter.java`

```java
@Override
public Page<Schedule> search(FilterRequest filter, Pageable pageable) {
    log.debug("Building specification with scopes: {}",
              filter.getScopes() != null ? filter.getScopes().size() : 0);

    // GenericSpecificationBuilder handles scope processing
    Specification<CenterWeeklyScheduleEntity> spec = buildSpecification(filter);

    // Execute query with scope restrictions
    Page<CenterWeeklyScheduleEntity> result = repository.findAll(spec, pageable);

    return result.map(mapper::toDomain);
}

private Specification<CenterWeeklyScheduleEntity> buildSpecification(FilterRequest filter) {
    // GenericSpecificationBuilder automatically:
    // 1. Applies scopes FIRST (with AND logic)
    // 2. Then applies criteria
    // 3. Builds complete JPA Specification
    return new GenericSpecificationBuilder<CenterWeeklyScheduleEntity>(
            ScheduleFilterConfig.ALLOWED_FIELDS)
        .withCriteria(filter.getCriteria())
        .withGroups(filter.getGroups())
        .withScopes(filter.getScopes())
        .build();
}
```

### 4. SQL Query Generated

The GenericSpecificationBuilder and GenericSpecification classes convert the scopes to a JPA query:

```sql
SELECT * FROM center_weekly_schedule
WHERE organization_branch_id IN (
    '6240dfac-e4ac-4a29-86a4-7a7f29553c17',
    '7df356fb-f1db-4075-a31b-ba20bc5aad15'
)
AND [additional criteria from frontend filter]
```

---

## Data Flow Diagram - Complete Journey

```
User opens Schedule Form Modal
├─ React Component: ScheduleFormModal.jsx
│  └─ useEffect triggered (open = true)
│
├─ Step 1: Extract Permissions
│  ├─ Call: getSectionPermissions('Appointment Schedule Mangement')
│  ├─ From: PermissionsContext (populated on app load)
│  └─ Extract: systemSectionActionId, scopeValueIds
│
├─ Step 2: Frontend Calls Backend
│  ├─ Endpoint: POST /access/api/dropdowns/organizations-by-branches
│  ├─ Payload:
│  │  {
│  │    "systemSectionActionId": "ec37e595-d7d6-4daf-9149-70815959ddf2",
│  │    "scopeValueIds": ["uuid1", "uuid2", "uuid3"]
│  │  }
│  ├─ Query Params: lang=en
│  └─ Via: API Gateway (port 6060)
│
├─ Step 3: API Gateway Routes to Backend
│  └─ Determines service: access-management-service (port 6062)
│
├─ Step 4: Backend Service Receives Request
│  ├─ Controller parses scopeValueIds
│  ├─ Calls service.findOrganizationsByBranches(scopeValueIds)
│  └─ Adds scope criteria to FilterRequest
│
├─ Step 5: GenericSpecificationBuilder Processes Scopes
│  ├─ Creates ScopeCriteria
│  │  {
│  │    fieldName: "organizationBranchId",
│  │    allowedValues: ["uuid1", "uuid2", "uuid3"]
│  │  }
│  ├─ Converts to SearchCriteria with IN operator
│  └─ Builds JPA Specification
│
├─ Step 6: JPA Query Execution
│  ├─ Hibernat generates SQL:
│  │  SELECT * FROM organization
│  │  WHERE organization_id IN (
│  │    SELECT DISTINCT organization_id
│  │    FROM organization_branch
│  │    WHERE organization_branch_id IN (uuid1, uuid2, uuid3)
│  │  )
│  └─ Database filters results
│
├─ Step 7: Backend Returns Results
│  └─ Response: [Organization1, Organization2, Organization3]
│
└─ Step 8: Frontend Populates Dropdown
   └─ User sees only organizations they have access to
```

---

## Request/Response Examples

### Example 1: Load Organizations

**Frontend Request**:
```javascript
POST http://localhost:6060/access/api/dropdowns/organizations-by-branches
Content-Type: application/json

{
  "systemSectionActionId": "ec37e595-d7d6-4daf-9149-70815959ddf2",
  "scopeValueIds": [
    "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
    "7df356fb-f1db-4075-a31b-ba20bc5aad15"
  ]
}
Query Params: lang=en
```

**Backend Response**:
```json
[
  {
    "organizationId": "org-uuid-1",
    "name": "Organization 1",
    "branchCount": 2
  },
  {
    "organizationId": "org-uuid-2",
    "name": "Organization 2",
    "branchCount": 1
  }
]
```

### Example 2: Load Branches for Selected Organization

**Frontend Request**:
```javascript
POST http://localhost:6060/access/api/cascade-dropdowns/organization-branches-by-organization-filtered
Content-Type: application/json

{
  "organizationId": "org-uuid-1",
  "systemSectionActionId": "ec37e595-d7d6-4daf-9149-70815959ddf2",
  "scopeValueIds": [
    "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
    "7df356fb-f1db-4075-a31b-ba20bc5aad15"
  ]
}
Query Params: lang=en
```

**Backend Response**:
```json
[
  {
    "organizationBranchId": "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
    "name": "Main Branch",
    "organizationId": "org-uuid-1",
    "address": "123 Main St"
  },
  {
    "organizationBranchId": "7df356fb-f1db-4075-a31b-ba20bc5aad15",
    "name": "Secondary Branch",
    "organizationId": "org-uuid-1",
    "address": "456 Secondary Ave"
  }
]
```

---

## Error Handling

### Scenario 1: Endpoint Not Implemented

If the Backend doesn't have the new scope-filtered endpoint:

```javascript
// Frontend tries POST endpoint
try {
  const orgRes = await api.post(
    '/access/api/dropdowns/organizations-by-branches',
    { systemSectionActionId, scopeValueIds }
  )
} catch (err) {
  // 404 or other error

  // Fallback: Load all branches and extract org IDs
  const branchesRes = await api.post(
    '/appointment/api/admin/schedules/filter',
    {
      criteria: [],
      groups: [],
      scopes: [{
        fieldName: 'organizationBranchId',
        allowedValues: scopeValueIds,
        dataType: 'UUID'
      }]
    }
  )

  // Use branches to determine which organizations to show
}
```

### Scenario 2: No Scopes in JWT

If `organizationBranchIds` not in JWT claims, the backend applies no additional filtering:

```java
Object scopeValue = currentUser.claims().get("organizationBranchIds");
if (scopeValue == null) {
    // No scopes found - return all results (or apply minimum restrictions)
    return;
}
```

### Scenario 3: Empty Scope Values

If user has no authorized branches:

```javascript
scopeValueIds = [] // Empty array

// Send to backend - will return 0 results
const orgRes = await api.post(
  '/access/api/dropdowns/organizations-by-branches',
  {
    systemSectionActionId,
    scopeValueIds: [] // Empty
  }
)
// Response: [] (no organizations)
```

---

## Implementation Checklist

- [x] Frontend: Extract `systemSectionActionId` and `scopeValueIds` from permissions
- [x] Frontend: Send scope values with API requests
- [x] Frontend: Implement fallback mechanisms for missing endpoints
- [ ] Backend: Create new scope-filtered endpoints
  - [ ] `POST /access/api/dropdowns/organizations-by-branches`
  - [ ] `POST /access/api/cascade-dropdowns/organization-branches-by-organization-filtered`
- [ ] Backend: Controller extracts scope values from JWT
- [ ] Backend: Service applies scope criteria via GenericSpecificationBuilder
- [ ] Backend: Test scope filtering with various scenarios
- [x] Documentation: Complete (this file)

---

## Testing Scenarios

### Test Case 1: User with Multiple Branches

**Setup**:
- User has access to: Branch1, Branch2, Branch3
- These branches belong to: Org1, Org2

**Expected Result**:
- Load Organizations endpoint returns: [Org1, Org2]
- Load Branches for Org1 returns: [Branch1, Branch2]
- Load Branches for Org2 returns: [Branch3]

### Test Case 2: User with Single Branch

**Setup**:
- User has access to: Branch1 only
- Branch1 belongs to: Org1

**Expected Result**:
- Load Organizations endpoint returns: [Org1]
- Load Branches for Org1 returns: [Branch1]
- Trying to access other organizations returns empty

### Test Case 3: User with Cross-Organization Branches

**Setup**:
- User has access to: Branch1 (Org1), Branch2 (Org1), Branch3 (Org2)

**Expected Result**:
- Load Organizations returns: [Org1, Org2]
- Load Branches for Org1 returns: [Branch1, Branch2]
- Load Branches for Org2 returns: [Branch3]

---

## Performance Considerations

1. **Scope Values List Size**:
   - Most users: 1-10 scope values
   - Admin users: 50-100 scope values
   - Database IN clause handles 1000+ values efficiently

2. **Query Performance**:
   - Index on `organization_branch_id` required
   - Scope values are known upfront (from JWT)
   - Query filtered at DB level (efficient)

3. **Frontend Performance**:
   - Scope extraction: O(n) where n = actions
   - Network request: minimal (small JSON payload)
   - No local filtering needed

---

## Version Information

- **System**: Care Management System
- **Last Updated**: 2025-11-09
- **Status**:
  - ✅ Frontend: Implemented (ScheduleFormModal.jsx)
  - ✅ Backend: Implemented (ScheduleController.java)
  - 🔄 Pending: Additional scope-filtered endpoints in access-management-service

---

## Related Documentation

- [SCOPE_FILTERING_PROCESS.md](SCOPE_FILTERING_PROCESS.md) - Configuration & Mapping
- [SCHEDULE_SCOPE_FILTERING_FIX.md](SCHEDULE_SCOPE_FILTERING_FIX.md) - Backend Implementation Details


# Scope Filtering Process - Configuration & Mapping

## Overview
This document defines the scope filtering mechanism for the Care Management System. It provides a centralized mapping between JWT claim identifiers, filter fields, and database columns.

**Purpose**: When a user makes a filter request with a specific `sectionId`, this document helps identify:
1. Which JWT claim contains the allowed values (`scopeValueId`)
2. Which database column to apply the scope filter on
3. The data type for conversion
4. Which services and entities are affected

---

## Scope Mapping Table

| SectionId | Description | JWT Claim | ScopeValueId | Database Column | Data Type | Service | Entity | Configuration |
|-----------|-------------|-----------|--------------|-----------------|-----------|---------|--------|-----------------|
| `ORG_BRANCH` | Organization Branch Access | `organizationBranchIds` | `organizationBranchIds` | `organization_branch_id` | UUID | appointment-service | CenterWeeklySchedule | ScheduleFilterConfig |
| `TENANT` | Tenant Access | `tenantIds` | `tenantIds` | `tenant_id` | UUID | access-management-service | TenantSubscription | TenantFilterConfig |
| `ORG` | Organization Access | `organizationIds` | `organizationIds` | `organization_id` | UUID | reference-data-service | Organization | OrgFilterConfig |
| `LOCATION` | Location Access | `locationIds` | `locationIds` | `location_id` | UUID | reference-data-service | Location | LocationFilterConfig |
| `DUTY_STATION` | Duty Station Access | `dutyStationIds` | `dutyStationIds` | `duty_station_id` | UUID | reference-data-service | DutyStation | DutyStationFilterConfig |

---

## Detailed Configuration

### 1. ORG_BRANCH (Organization Branch)

**JWT Claim Structure**:
```json
{
  "organizationBranchIds": [
    "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
    "7df356fb-f1db-4075-a31b-ba20bc5aad15",
    "39d4039f-dfd6-4ddb-9b73-5424b5b2d59e"
  ]
}
```

**Affected Services**:
- `appointment-service` - ScheduleController, AppointmentAdminController
- `reference-data-service` - DutyStationController

**Affected Entities**:
- `CenterWeeklySchedule` (center_weekly_schedule table)
- `Appointment` (appointment table)
- `AppointmentProvider` (appointment_provider table)
- `DutyStation` (duty_station table)

**Filter Configuration**:
```java
// ScheduleFilterConfig.ALLOWED_FIELDS
Set.of(
    "scheduleId",
    "organizationBranchId",  // ← Filter column
    "dayOfWeek",
    "startTime",
    "endTime",
    // ...
)
```

**Database Column**:
```sql
center_weekly_schedule.organization_branch_id UUID NOT NULL
```

**Filtering Implementation** (ScheduleController):
```java
private void applyUserScopes(FilterRequest filter) {
    var currentUser = CurrentUserContext.get();
    Object scopeValue = currentUser.claims().get("organizationBranchIds");

    if (scopeValue != null) {
        List<UUID> allowedBranchIds = extractUUIDs(scopeValue);

        List<ScopeCriteria> scopes = // ...
        scopes.add(ScopeCriteria.builder()
            .fieldName("organizationBranchId")  // ← Database column name
            .allowedValues(allowedBranchIds)
            .dataType(ValueDataType.UUID)
            .build());
    }
}
```

**Example Query**:
```sql
SELECT * FROM center_weekly_schedule
WHERE organization_branch_id IN (
    '6240dfac-e4ac-4a29-86a4-7a7f29553c17',
    '7df356fb-f1db-4075-a31b-ba20bc5aad15',
    '39d4039f-dfd6-4ddb-9b73-5424b5b2d59e'
)
```

---

### 2. TENANT (Tenant Scope)

**JWT Claim Structure**:
```json
{
  "tenantIds": [
    "tenant-uuid-1",
    "tenant-uuid-2"
  ]
}
```

**Affected Services**:
- `access-management-service`
- `auth-service`

**Affected Entities**:
- `TenantSubscription`
- `UserTenant`

**Filter Configuration**:
```java
Set.of(
    "tenantId",  // ← Filter column
    "subscriptionStatus",
    "createdAt"
)
```

**Implementation Pattern**:
```java
private void applyUserScopes(FilterRequest filter) {
    var currentUser = CurrentUserContext.get();
    Object scopeValue = currentUser.claims().get("tenantIds");

    List<ScopeCriteria> scopes = // ...
    scopes.add(ScopeCriteria.builder()
        .fieldName("tenantId")  // ← Database column
        .allowedValues(extractUUIDs(scopeValue))
        .dataType(ValueDataType.UUID)
        .build());
}
```

---

### 3. LOCATION (Location Scope)

**JWT Claim Structure**:
```json
{
  "locationIds": [
    "location-uuid-1",
    "location-uuid-2",
    "location-uuid-3"
  ]
}
```

**Affected Services**:
- `reference-data-service`

**Affected Entities**:
- `Location`
- `DutyStation` (has location_id)

**Filter Configuration**:
```java
Set.of(
    "locationId",  // ← Filter column
    "locationName",
    "regionId",
    "createdAt"
)
```

---

## Scope Filtering Flow

```
1. Frontend Request
   ├─ Filter Criteria: {"field": "organizationBranchId", "op": "IN", "value": [...]}
   └─ JWT Token contains: {"organizationBranchIds": [...]}

2. Controller (ScheduleController)
   ├─ Extract JWT claims
   ├─ Get scopeValueId: "organizationBranchIds"
   ├─ Map to field name: "organizationBranchId"
   └─ Add ScopeCriteria to FilterRequest

3. Service Layer
   ├─ Receive enriched FilterRequest
   └─ Pass to database adapter

4. Database Adapter (ScheduleDbAdapter)
   ├─ Build GenericSpecificationBuilder
   ├─ Add scopes (applied FIRST with AND)
   ├─ Add criteria (applied with AND/OR based on groups)
   └─ Execute JPA query

5. Database Query Execution
   ├─ WHERE organizationBranchId IN (scope values)  ← From JWT
   └─ AND organizationBranchId IN (filter values)   ← From frontend

6. Results Returned
   └─ Only records matching BOTH scope and criteria
```

---

## How to Add a New Scope

### Step 1: Define in JWT Claims
The Auth Service must include the scope in the JWT token during login:

```java
// In AuthService.generateToken()
Map<String, Object> claims = new HashMap<>();
claims.put("organizationBranchIds", userAllowedBranchIds);
claims.put("locationIds", userAllowedLocationIds);
// ...
```

### Step 2: Add to Service Controller
Implement scope extraction in the controller's filter endpoint:

```java
@PostMapping("/filter")
public ResponseEntity<Page<MyResponse>> filter(
    @RequestBody(required = false) FilterRequest request,
    @PageableDefault(size = 20) Pageable pageable
) {
    FilterRequest safe = (request != null) ? request : new FilterRequest();
    FilterNormalizer.normalize(safe);

    // NEW: Apply scope filtering
    applyUserScopes(safe);

    // Pass to service
    Page<MyResponse> page = service.loadAll(safe, pageable);
    return ResponseEntity.ok(page);
}

private void applyUserScopes(FilterRequest filter) {
    var currentUser = CurrentUserContext.get();
    if (currentUser == null) return;

    Object scopeValue = currentUser.claims().get("myNewScopeId");
    if (scopeValue != null) {
        List<UUID> allowedIds = extractUUIDs(scopeValue);

        List<ScopeCriteria> scopes = (filter.getScopes() != null)
            ? new ArrayList<>(filter.getScopes())
            : new ArrayList<>();

        scopes.add(ScopeCriteria.builder()
            .fieldName("myDatabaseColumnName")  // ← Map to actual DB column
            .allowedValues(allowedIds)
            .dataType(ValueDataType.UUID)
            .build());

        filter.setScopes(scopes);
    }
}
```

### Step 3: Verify FilterConfig
Ensure the column is in the ALLOWED_FIELDS:

```java
public class MyFilterConfig {
    public static final Set<String> ALLOWED_FIELDS = Set.of(
        "id",
        "myDatabaseColumnName",  // ← Must be here
        // ...
    );
}
```

### Step 4: Update This Document
Add a new row to the Scope Mapping Table above.

---

## ScopeCriteria to Database Column Mapping

```
ScopeCriteria Structure
├─ fieldName: "organizationBranchId"  ← Maps to database column name
├─ allowedValues: [UUID, UUID, ...]   ← From JWT claim
└─ dataType: UUID                      ← Type for conversion

↓ Converted to ↓

SearchCriteria
├─ key: "organizationBranchId"        ← Field name (must be whitelisted)
├─ operation: IN
├─ value: [UUID, UUID, ...]           ← Converted values
└─ dataType: UUID

↓ Executed as ↓

SQL WHERE Clause
└─ WHERE organization_branch_id IN ('uuid1', 'uuid2', 'uuid3')
```

---

## JWT Claims → Database Column Resolution

### For ORG_BRANCH:
```
JWT Claim: organizationBranchIds
    ↓
Extract: ["uuid1", "uuid2", "uuid3"]
    ↓
Create ScopeCriteria
    ├─ fieldName: "organizationBranchId"  ← Matches FilterConfig.ALLOWED_FIELDS
    ├─ allowedValues: [uuid1, uuid2, uuid3]
    └─ dataType: UUID
    ↓
GenericSpecification converts to
    ├─ Path: root.get("organizationBranchId")  ← JPA attribute name
    └─ Predicate: cb.in(path).value(uuid1).value(uuid2)...
    ↓
SQL Query
    └─ WHERE center_weekly_schedule.organization_branch_id IN (?, ?, ?)
```

---

## Common Issues & Solutions

### Issue 1: SectionId Not Mapping to Correct Column

**Problem**: Scope claim name doesn't match database column name in ScopeCriteria.

**Solution**:
```java
// WRONG - claim name ≠ column name
Object scopeValue = currentUser.claims().get("branchIds");  // JWT claim
scopes.add(ScopeCriteria.builder()
    .fieldName("organizationBranchId")  // DB column - MISMATCH!
    // ...
```

**Fix**:
```java
// CORRECT - explicitly map
Object scopeValue = currentUser.claims().get("organizationBranchIds");  // JWT claim
scopes.add(ScopeCriteria.builder()
    .fieldName("organizationBranchId")  // DB column - MATCHES!
    // ...
```

### Issue 2: Field Not in ALLOWED_FIELDS

**Problem**: Scope field is not whitelisted.

```
Error: "Field not allowed for filtering: organizationBranchId"
```

**Solution**: Add to FilterConfig:
```java
public static final Set<String> ALLOWED_FIELDS = Set.of(
    "organizationBranchId",  // ← ADD THIS
    // ...
);
```

### Issue 3: Scope Values Are Strings, Not UUIDs

**Problem**: JWT claim contains string UUIDs.

**Solution**: Use `extractUUIDs()` helper:
```java
private List<UUID> extractUUIDs(Object scopeValue) {
    List<UUID> result = new ArrayList<>();
    if (scopeValue instanceof List<?>) {
        ((List<?>) scopeValue).forEach(item -> {
            try {
                if (item instanceof String str) {
                    result.add(UUID.fromString(str.trim()));  // ← Convert
                }
            } catch (Exception ignored) {}
        });
    }
    return result;
}
```

### Issue 4: No Results Even With Valid Scopes

**Problem**: Filter returns 0 results even though scopes are correct.

**Checklist**:
1. ✓ JWT claim exists and has values?
2. ✓ ScopeCriteria fieldName matches ALLOWED_FIELDS?
3. ✓ UUID values are valid format?
4. ✓ Database has records matching the scope values?
5. ✓ Frontend criteria intersects with scope values?

---

## Debugging Steps

### 1. Check JWT Token
```bash
# Decode JWT at jwt.io and verify claims contain scopeValueId
{
  "organizationBranchIds": ["uuid1", "uuid2", "uuid3"],
  // ...
}
```

### 2. Add Debug Logging
```java
private void applyUserScopes(FilterRequest filter) {
    var currentUser = CurrentUserContext.get();
    log.info("Current User: {}", currentUser);

    Object scopeValue = currentUser.claims().get("organizationBranchIds");
    log.info("Scope Value from JWT: {}", scopeValue);

    List<UUID> allowedBranchIds = extractUUIDs(scopeValue);
    log.info("Extracted Branch IDs: {}", allowedBranchIds);

    // ... rest of code
}
```

### 3. Check ScheduleDbAdapter Logs
```java
private Specification<CenterWeeklyScheduleEntity> buildSpecification(FilterRequest filter) {
    log.debug("🔹 buildSpecification() - hasCriteria: {}, hasGroups: {}, hasScopes: {}",
              hasCriteria, hasGroups, hasScopes);

    if (hasScopes) {
        filter.getScopes().forEach(s ->
            log.debug("  Scope: field='{}', values={}",
                      s.getFieldName(), s.getAllowedValues()));
    }
    // ...
}
```

### 4. Verify Database Query
```java
// Enable SQL logging in application.yml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

Expected output:
```sql
select * from center_weekly_schedule c1_0
where c1_0.organization_branch_id in (
    '6240dfac-e4ac-4a29-86a4-7a7f29553c17',
    '7df356fb-f1db-4075-a31b-ba20bc5aad15'
)
```

---

## Reference Implementation

### Appointment Service - ScheduleController

**File**: `appointment-service/src/main/java/com/care/appointment/web/controller/admin/ScheduleController.java`

```java
@PostMapping("/filter")
public ResponseEntity<Page<ScheduleResponse>> filterSchedules(
    @RequestBody(required = false) FilterRequest request,
    @PageableDefault(size = 20) Pageable pageable
) {
    FilterRequest safe = (request != null) ? request : new FilterRequest();
    FilterNormalizer.normalize(safe);

    // Apply scope-based filtering (IMPORTANT!)
    applyUserScopes(safe);

    Page<ScheduleResponse> page = loadAllSchedulesUseCase
        .loadAll(safe, pageable)
        .map(mapper::toResponse);
    return ResponseEntity.ok(page);
}

private void applyUserScopes(FilterRequest filter) {
    try {
        var currentUser = CurrentUserContext.get();
        if (currentUser == null) return;

        Object scopeValue = currentUser.claims().get("organizationBranchIds");
        if (scopeValue != null) {
            List<UUID> allowedBranchIds = extractUUIDs(scopeValue);

            if (!allowedBranchIds.isEmpty()) {
                List<ScopeCriteria> scopes = (filter.getScopes() != null)
                    ? new ArrayList<>(filter.getScopes())
                    : new ArrayList<>();

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
        // Graceful failure - no scope restriction
    }
}

@SuppressWarnings("unchecked")
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
    // ... other type handling

    return result;
}
```

---

## Testing Checklist

- [ ] JWT token contains valid `organizationBranchIds` claim
- [ ] Scope values are valid UUIDs
- [ ] ScheduleFilterConfig includes "organizationBranchId" in ALLOWED_FIELDS
- [ ] `applyUserScopes()` method is called in controller
- [ ] Scope values match database records
- [ ] Frontend criteria intersects with scope values
- [ ] Database query includes both scope AND criteria WHERE clauses
- [ ] Results are filtered correctly

---

## Version Information

- **System**: Care Management System
- **Last Updated**: 2025-11-09
- **Status**: ✅ IMPLEMENTED (ScheduleController)
- **Pending Implementation**: Other controllers (AppointmentController, etc.)

---

## Quick Reference

| Task | Location | Key Code |
|------|----------|----------|
| Add new scope | This document + JWT generation | Define sectionId, JWT claim, column name |
| Implement scope filtering | Controller filter endpoint | Call `applyUserScopes()` |
| Extract scope values | Controller | Use `extractUUIDs()` helper |
| Verify allowed fields | FilterConfig | Add to `ALLOWED_FIELDS` set |
| Debug filtering | Logs + SQL | Check JWT claims and WHERE clause |


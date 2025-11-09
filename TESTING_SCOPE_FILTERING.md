# Testing Guide - Scope-Based Filtering

## Overview

This guide provides step-by-step testing procedures to verify that the scope-based filtering implementation works correctly at all levels: frontend, backend, and database.

---

## Prerequisites

1. **Backend Services Running**:
   - appointment-service (Port 6064)
   - access-management-service (Port 6062)
   - auth-service (Port 6061)
   - gateway (Port 6060)

2. **Frontend Running**:
   - web-portal (Port 3000 or 5173)

3. **Database**:
   - PostgreSQL running with test data

4. **Test Tools**:
   - Postman or cURL
   - Browser DevTools
   - JWT.io for token analysis

---

## Level 1: JWT Token Verification

### Step 1: Decode JWT Token

**Purpose**: Verify that the JWT contains correct scope values

**Steps**:
1. User logs in and gets JWT token
2. Go to https://jwt.io
3. Paste token in "Encoded" section
4. Check "payload" section for:
   ```json
   {
     "organizationBranchIds": [
       "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
       "7df356fb-f1db-4075-a31b-ba20bc5aad15",
       "39d4039f-dfd6-4ddb-9b73-5424b5b2d59e"
     ],
     "tenantIds": [...],
     "roles": [...],
     "permissions": [...]
   }
   ```

**Expected Result**: ✅ organizationBranchIds claim exists with array of UUIDs

**Failure Case**: ❌ Claim missing or empty
- **Solution**: Check Auth Service JWT generation code

---

## Level 2: Frontend Scope Extraction

### Step 2: Verify Scope Extraction in React

**Purpose**: Confirm frontend correctly extracts scopeValueIds from permissions context

**Steps**:

1. Open Browser DevTools (F12)
2. Open ScheduleFormModal component
3. Watch Console for debug messages:
   ```
   🔍 DEBUG: sectionPerms (with system): {...}
   🔍 DEBUG: action[0]: {...}
   🔍 DEBUG: action[0].scopes[0]: {...}
   ✅ DEBUG: Found systemSectionActionId: ec37e595-d7d6-4daf-9149-70815959ddf2
   ✅ DEBUG: Adding authorized scope value: 6240dfac-e4ac-4a29-86a4-7a7f29553c17
   ✅ DEBUG: Final scopeValueIds: ["uuid1", "uuid2", "uuid3"]
   ```

4. Verify scopeValueIds logged match JWT token values

**Expected Result**:
```
✅ DEBUG: Final scopeValueIds: [3-5 UUIDs]
✅ DEBUG: systemSectionActionId: ec37e595-d7d6-4daf-9149-70815959ddf2
```

**Failure Cases**:

| Error | Cause | Fix |
|-------|-------|-----|
| No debug messages | Permissions not loaded | Ensure user is authenticated |
| scopeValueIds: [] | Permissions have no scopes | Check permission assignment |
| systemSectionActionId: null | Action ID not in permissions | Verify backend permission setup |

---

## Level 3: Network Request Verification

### Step 3: Verify Frontend Sends Scopes to Backend

**Purpose**: Confirm frontend sends scopeValueIds in API request

**Steps**:

1. Open Browser DevTools → Network tab
2. Open ScheduleFormModal
3. Look for requests to:
   - `POST /access/api/dropdowns/organizations-by-branches` (preferred)
   - `POST /appointment/api/admin/schedules/filter` (fallback)

4. Click on request → "Payload" tab
5. Verify request body contains:
   ```json
   {
     "systemSectionActionId": "ec37e595-d7d6-4daf-9149-70815959ddf2",
     "scopeValueIds": [
       "6240dfac-e4ac-4a29-86a4-7a7f29553c17",
       "7df356fb-f1db-4075-a31b-ba20bc5aad15"
     ]
   }
   ```

**Expected Result**:
```
Status: 200 OK
Response Body: [
  { organizationId: "...", name: "Organization 1" },
  { organizationId: "...", name: "Organization 2" }
]
```

**Failure Cases**:

| Case | Expected | Actual | Fix |
|------|----------|--------|-----|
| Endpoint returns 404 | POST to new endpoint fails | Falls back to GET | Normal - fallback working |
| Empty response | Should return [organizations] | [] | Check scope values match DB |
| All organizations returned | Should filter by scope | All visible | Backend not applying scopes |

---

## Level 4: Backend Controller Testing

### Step 4: Test applyUserScopes() Method

**Purpose**: Verify backend controller correctly applies scopes from JWT

**Prerequisites**:
- Enable DEBUG logging in application.yml
- User JWT token with organizationBranchIds claim

**Steps**:

1. Call filter endpoint with authorized user:
```bash
curl -X POST http://localhost:6064/appointment/api/admin/schedules/filter \
  -H "Authorization: Bearer <JWT-TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "criteria": [],
    "groups": [],
    "scopes": []
  }' \
  -G \
  -d "page=0" \
  -d "size=20"
```

2. Check application logs for:
```
🔍 buildSpecification() - hasCriteria: false, hasGroups: false, hasScopes: true
  Scope: field='organizationBranchId', values=[uuid1, uuid2, uuid3]
✅ Built specification: GenericSpecificationBuilder
📊 Query returned 10 results out of 15 total
```

**Expected Result**:
- Logs show 1 scope applied
- Number of results ≤ total in database
- Status 200 with filtered schedules

**Failure Cases**:

| Log Message | Issue | Fix |
|-------------|-------|-----|
| hasScopes: false | JWT claim not applied | Check applyUserScopes() logic |
| Query returned 0 results | Scope values invalid or no matches | Verify scope values in DB |
| No 'buildSpecification' logs | Logging not configured | Check application.yml logging levels |

---

## Level 5: Database Query Testing

### Step 5: Verify SQL Queries with Scope Filtering

**Purpose**: Confirm database receives correct WHERE clause with scope restrictions

**Steps**:

1. Enable Hibernate SQL logging in application.yml:
```yaml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true
```

2. Make request to filter endpoint
3. Check application logs for SQL:
```sql
select
    c1_0.schedule_id,
    c1_0.created_by_id,
    c1_0.created_at,
    c1_0.day_of_week,
    c1_0.end_time,
    c1_0.is_active,
    c1_0.is_deleted,
    c1_0.max_capacity_per_slot,
    c1_0.organization_branch_id,
    c1_0.slot_duration_minutes,
    c1_0.start_time,
    c1_0.updated_at
from
    center_weekly_schedule c1_0
where
    c1_0.organization_branch_id in (
        '6240dfac-e4ac-4a29-86a4-7a7f29553c17',
        '7df356fb-f1db-4075-a31b-ba20bc5aad15'
    )
```

**Expected Result**:
- WHERE clause includes `organization_branch_id IN (uuid1, uuid2, ...)`
- Number of results in IN clause matches scopeValueIds count
- Results match authorized branches

**Failure Cases**:

| Issue | Cause | Check |
|-------|-------|-------|
| WHERE clause empty | Scopes not applied | ScheduleDbAdapter.buildSpecification() |
| WHERE has wrong column | Field name mismatch | ScopeCriteria.fieldName |
| WHERE has wrong values | UUID conversion failed | FilterNormalizer or GenericSpecification |

---

## Level 6: End-to-End Testing

### Step 6: Complete User Journey Test

**Purpose**: Verify complete flow from login to data display

**Test Scenario**: User with access to 2 organizations

**Steps**:

1. **Login**:
   - Go to login page
   - Login with test user
   - Verify JWT received and stored

2. **Open Schedule Form**:
   - Navigate to Schedules page
   - Click "Create Schedule" button
   - Modal opens

3. **Verify Organizations Dropdown**:
   - Check browser console for scope extraction logs
   - Verify network request includes scopeValueIds
   - Verify organizations dropdown shows only 2 organizations
   - Verify these match user's authorized branches

4. **Select Organization**:
   - Select first organization
   - Verify branches dropdown is populated
   - Verify branch list includes only authorized branches

5. **Verify Backend**:
   - Check application logs for scope application
   - Check SQL logs for correct WHERE clause
   - Verify no other branches visible

**Expected Flow**:
```
Login
  ↓
JWT Token obtained with organizationBranchIds: [uuid1, uuid2]
  ↓
Open ScheduleFormModal
  ↓
Extract scopes from PermissionsContext
  ↓
Send POST /access/api/dropdowns/organizations-by-branches with scopeValueIds
  ↓
Backend applies scope via applyUserScopes()
  ↓
Database filters: WHERE org_id IN (uuid1, uuid2)
  ↓
Frontend receives [Org1, Org2]
  ↓
Dropdown shows only 2 organizations ✅
```

**Verification Checklist**:
- [ ] Console shows scope extraction logs
- [ ] Network request includes scopeValueIds
- [ ] Organizations dropdown populated correctly
- [ ] Branches filtered correctly per organization
- [ ] Backend logs show scope application
- [ ] SQL logs show WHERE with scope values
- [ ] No unauthorized data visible

---

## Level 7: Fallback Mechanism Testing

### Step 7: Test Fallback When New Endpoints Don't Exist

**Purpose**: Verify system works even without new scope-filtered endpoints

**Steps**:

1. **Simulate Missing Endpoint**:
   - Comment out new endpoint implementation (temporarily)
   - Keep standard endpoints available

2. **Test Frontend**:
   - Open ScheduleFormModal
   - Check console logs:
     ```
     ⚠️ POST endpoint not available, trying GET endpoint...
     ```
   - Verify fallback to standard endpoint triggers

3. **Verify Results**:
   - Organizations dropdown still populated correctly
   - Branches still filtered correctly
   - UI functions normally

**Expected Result**:
```
📡 Calling organizations-by-branches with scopes...
⚠️ POST endpoint not available, trying GET endpoint...
📡 Calling schedules filter with scope criteria...
✅ Authorized branches from schedules: 10
```

**Fallback Chain**:
```
Try 1: POST /organizations-by-branches (404)
  ↓
Try 2: GET /organizations-by-branches (404)
  ↓
Try 3: POST /schedules/filter with scopes (200)
  ↓
Success: Use fallback result ✅
```

---

## Level 8: Permission Scope Testing

### Step 8: Test Various Permission Scenarios

**Scenario 1: User with Multiple Branches**

```
User scopes: [Branch1, Branch2, Branch3]
Expected:
- Organizations: [Org1, Org2]
- Org1 Branches: [Branch1, Branch2]
- Org2 Branches: [Branch3]
```

**Test Steps**:
1. Create test user with 3 authorized branches
2. Login and open ScheduleFormModal
3. Verify organizations list shows 2 items
4. Select Org1: verify 2 branches shown
5. Select Org2: verify 1 branch shown

**Scenario 2: User with Single Branch**

```
User scopes: [Branch1]
Expected:
- Organizations: [Org1]
- Org1 Branches: [Branch1]
```

**Test Steps**:
1. Create test user with 1 authorized branch
2. Login and open ScheduleFormModal
3. Verify only 1 organization shown
4. Select it: verify only 1 branch shown

**Scenario 3: User with No Scopes**

```
User scopes: []
Expected:
- Organizations: [] (no access)
- Branches: [] (no access)
```

**Test Steps**:
1. Create test user with NO authorized branches
2. Login and open ScheduleFormModal
3. Verify organizations dropdown is empty
4. Verify branches dropdown is empty or disabled

**Scenario 4: User with Cross-Organization Branches**

```
User scopes: [Branch1 (Org1), Branch2 (Org1), Branch3 (Org2)]
Expected:
- Organizations: [Org1, Org2]
- Org1 Branches: [Branch1, Branch2]
- Org2 Branches: [Branch3]
```

**Test Steps**:
1. Create test user with branches across 2 organizations
2. Login and open ScheduleFormModal
3. Verify both organizations shown
4. Verify correct branches for each organization

---

## Testing Report Template

### Test Execution Report

```
Date: _______________
Tester: _______________
Build: _______________

Test Case: Level 1 - JWT Token Verification
Result: ☐ PASS ☐ FAIL
Issues: _______________
Notes: _______________

Test Case: Level 2 - Frontend Scope Extraction
Result: ☐ PASS ☐ FAIL
Issues: _______________
Notes: _______________

Test Case: Level 3 - Network Request Verification
Result: ☐ PASS ☐ FAIL
Issues: _______________
Notes: _______________

Test Case: Level 4 - Backend Controller Testing
Result: ☐ PASS ☐ FAIL
Issues: _______________
Notes: _______________

Test Case: Level 5 - Database Query Testing
Result: ☐ PASS ☐ FAIL
Issues: _______________
Notes: _______________

Test Case: Level 6 - End-to-End Testing
Result: ☐ PASS ☐ FAIL
Issues: _______________
Notes: _______________

Test Case: Level 7 - Fallback Mechanism
Result: ☐ PASS ☐ FAIL
Issues: _______________
Notes: _______________

Test Case: Level 8 - Permission Scopes
Result: ☐ PASS ☐ FAIL ☐ PARTIAL
Issues: _______________
Notes: _______________

Overall Result: ☐ PASS ☐ FAIL ☐ PASS WITH ISSUES

Summary:
_______________________________________________________________
_______________________________________________________________

Sign-off: _________________________ Date: _______________
```

---

## Automated Testing

### Unit Tests

**Test Class**: `ScheduleControllerScopeFilteringTest.java`

```java
@Test
public void testApplyUserScopes_WithValidScopes() {
    // Setup
    FilterRequest filter = new FilterRequest();
    List<UUID> scopeValueIds = Arrays.asList(uuid1, uuid2);

    // Mock CurrentUserContext
    CurrentUser user = new CurrentUser(...);
    user.claims().put("organizationBranchIds", scopeValueIds);

    // Execute
    controller.applyUserScopes(filter);

    // Verify
    assertEquals(1, filter.getScopes().size());
    ScopeCriteria scope = filter.getScopes().get(0);
    assertEquals("organizationBranchId", scope.getFieldName());
    assertEquals(scopeValueIds, scope.getAllowedValues());
}

@Test
public void testApplyUserScopes_WithNullContext() {
    // Setup
    FilterRequest filter = new FilterRequest();

    // No CurrentUserContext

    // Execute
    controller.applyUserScopes(filter);

    // Verify - should not throw exception
    assertEquals(0, filter.getScopes().size());
}

@Test
public void testApplyUserScopes_WithEmptyScopeValues() {
    // Setup
    FilterRequest filter = new FilterRequest();

    // Setup user with empty scopes
    CurrentUser user = new CurrentUser(...);
    user.claims().put("organizationBranchIds", Collections.emptyList());

    // Execute
    controller.applyUserScopes(filter);

    // Verify - should not add scope
    assertEquals(0, filter.getScopes().size());
}
```

### Integration Tests

```java
@Test
public void testScheduleFilterWithScopes() {
    // Setup
    User testUser = createTestUserWithBranches([uuid1, uuid2]);
    String token = authService.generateToken(testUser);

    // Execute
    Page<ScheduleResponse> results = restTemplate.postForObject(
        "http://localhost:6064/appointment/api/admin/schedules/filter",
        new FilterRequest(),
        scheduleResponsePage.class,
        new HttpEntity<>(new FilterRequest(),
                         getAuthHeaders(token))
    );

    // Verify
    assertTrue(results.getTotalElements() > 0);
    results.getContent().forEach(schedule -> {
        assertTrue([uuid1, uuid2].contains(schedule.getOrganizationBranchId()));
    });
}
```

---

## Performance Testing

### Load Testing

**Tool**: JMeter or Gatling

```
Test Plan:
- 100 concurrent users
- Each user: Open ScheduleFormModal, load organizations
- Duration: 5 minutes
- Measure: Response time, throughput, errors

Success Criteria:
- 95th percentile response time < 2 seconds
- Throughput > 50 requests/second
- Error rate < 1%
```

---

## Troubleshooting

### Issue: Organizations Dropdown Empty

```
Debug Steps:
1. Check JWT has organizationBranchIds claim
   → jwt.io decode token

2. Check permissions loaded
   → console.log(permissionsData)

3. Check scope extraction
   → Look for "✅ DEBUG: Final scopeValueIds:" in console

4. Check network request
   → DevTools Network tab
   → Verify scopeValueIds in request body

5. Check backend logs
   → Look for "applyUserScopes()" execution
   → Verify scope added to filter

6. Check database
   → Verify organization_branch table has data
   → Verify UUID values exist in DB
```

### Issue: All Organizations Showing

```
Debug Steps:
1. Backend not applying scopes
   → Check applyUserScopes() method is called
   → Verify CurrentUserContext.get() not null
   → Check organizationBranchIds extracted from JWT

2. Frontend not sending scopeValueIds
   → Check network request payload
   → Verify scopeValueIds array not empty
   → Check if endpoint returns 404 (fallback triggered)
```

### Issue: Slowperformance

```
Debug Steps:
1. Check database indexes
   → SELECT * FROM pg_indexes WHERE tablename = 'organization_branch'
   → Verify organization_branch_id has index

2. Check query plan
   → EXPLAIN ANALYZE SELECT ... WHERE org_id IN (...)

3. Check scope values count
   → If > 1000, may need pagination
```

---

## Sign-Off

- [ ] All test levels completed
- [ ] All test cases passed
- [ ] Fallback mechanisms working
- [ ] Performance acceptable
- [ ] No security issues found
- [ ] Ready for production deployment

**Approved by**: _________________ **Date**: _________________


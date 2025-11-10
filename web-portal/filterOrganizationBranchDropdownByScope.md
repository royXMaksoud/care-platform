## Filter Organization Branch Dropdown By Scope

### Goal
Load the list of organizations and branches that a user is allowed to see (based on scope permissions) **once**, cache it on the frontend, and reuse it without repeated API calls.

### Backend Endpoint
`POST /access/api/dropdowns/organization-branches/by-scope`

**Request body**
```json
{
  "scopeValueIds": ["<UUID>", "..."],
  "lang": "en"
}
```

**Response item**
```json
{
  "organizationBranchId": "<UUID>",
  "organizationBranchName": "string",
  "organizationId": "<UUID>",
  "organizationName": "string"
}
```

### Frontend Pattern
Component example: `ScheduleFormModal.jsx`

1. **Collect scope IDs**
   ```js
   const scopeValueIds = extractScopeValueIdsFromPermissions()
   ```

2. **Deduplicate requests**
   ```js
   const scopeKey = JSON.stringify({ scopeValueIds, lang })
   if (lastScopeFetchKeyRef.current === scopeKey) return
   lastScopeFetchKeyRef.current = scopeKey
   ```

3. **Fetch once & cache**
   ```js
   const { data } = await api.post('/access/api/dropdowns/organization-branches/by-scope', {
     scopeValueIds,
     lang
   })
   setAllOrganizationBranches(Array.isArray(data) ? data : [])
   ```

4. **Build dropdown options with `useMemo`**
   ```js
   const organizationOptions = useMemo(() => buildUniqueOrganizations(allOrganizationBranches), [allOrganizationBranches])
   const branchOptions = useMemo(() => filterBranchesForSelectedOrg(allOrganizationBranches, form.organizationId), [allOrganizationBranches, form.organizationId])
   ```

5. **Keep selections valid**
   - Reset `organizationId` / `organizationBranchId` if the selected value no longer exists in the latest list.

### Reuse Checklist
- [ ] Backend endpoint enabled and reachable.
- [ ] Scope IDs available from permissions context.
- [ ] `lastScopeFetchKeyRef` or equivalent guard in place.
- [ ] `useMemo` used for options (no derived state loops).
- [ ] Form values cleared when selections become invalid.


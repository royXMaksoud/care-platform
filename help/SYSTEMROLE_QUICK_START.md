# SystemRole Implementation - Quick Start Guide

## 📋 What You Have

### ✅ Completed (Ready to Use)

1. **Database Infrastructure** (V104 & V105 migrations)
   - 5 new tables fully designed and indexed
   - 23 optimized indexes
   - 9 unique constraints
   - Complete with audit fields and soft delete support

2. **5 JPA Entities**
   - SystemRoleEntity
   - SystemRoleActionEntity
   - SystemRoleActionScopeEntity
   - UserSystemRoleEntity
   - UserRolePermissionNodeEntity

3. **5 Spring Data Repositories**
   - SystemRoleRepository
   - SystemRoleActionRepository
   - SystemRoleActionScopeRepository
   - UserSystemRoleRepository
   - UserRolePermissionNodeRepository

### 📚 Documentation (Ready to Follow)

1. **SYSTEMROLE_IMPLEMENTATION_GUIDE.md** - Overall architecture and design decisions
2. **SYSTEMROLE_CURSOR_PROMPTS.md** - 16 detailed cursor prompts for implementation
3. **SYSTEMROLE_ARCHITECTURE_VISUAL.md** - Complete visual diagrams and flows

---

## 🚀 Next Steps - Implementation Order

### Phase 1: Backend - Core Domain (1-2 days)

#### Step 1: Create Domain Model
**File**: `access-management-service/src/main/java/com/care/accessmanagement/domain/model/SystemRole.java`

Use Prompt from `SYSTEMROLE_CURSOR_PROMPTS.md` → **Prompt 6: Create Domain Models**

**Deliverable**: One clean domain model class with embedded RoleType enum

#### Step 2: Create Commands & Queries
**Files**: `access-management-service/src/main/java/com/care/accessmanagement/application/system_role/command/`
          `access-management-service/src/main/java/com/care/accessmanagement/application/system_role/query/`

Use Prompts from `SYSTEMROLE_CURSOR_PROMPTS.md`:
- **Prompt 1**: Create Command Classes (4 command classes)
- **Prompt 2**: Create Query Classes (4 query classes)

**Deliverables**:
- CreateSystemRoleCommand.java
- UpdateSystemRoleCommand.java
- AddActionToRoleCommand.java
- DefineActionScopeCommand.java
- GetSystemRoleByIdQuery.java
- GetAllSystemRolesQuery.java
- GetRoleActionsQuery.java
- GetRoleActionScopesQuery.java

#### Step 3: Create Validators
**Files**: `access-management-service/src/main/java/com/care/accessmanagement/application/system_role/validation/`

Use Prompt from `SYSTEMROLE_CURSOR_PROMPTS.md` → **Prompt 5: Create Validators**

**Deliverables**:
- CreateSystemRoleValidator.java
- UpdateSystemRoleValidator.java
- ActionScopeValidator.java

#### Step 4: Create Mappers
**Files**: `access-management-service/src/main/java/com/care/accessmanagement/application/system_role/mapper/`

Use Prompt from `SYSTEMROLE_CURSOR_PROMPTS.md` → **Prompt 4: Create Mappers**

**Deliverables**:
- SystemRoleAppMapper.java (MapStruct interface)

### Phase 2: Backend - Services (2-3 days)

#### Step 5: Create Service Implementations
**Files**: `access-management-service/src/main/java/com/care/accessmanagement/application/system_role/service/`

Use Prompts from `SYSTEMROLE_CURSOR_PROMPTS.md`:
- **Prompt 3**: Create Service Implementation

**Deliverables**:
- SystemRoleServiceImpl.java (Main CRUD service)
- RoleActionManagementService.java (Action management)
- RolePermissionQueryService.java (Permission queries)
- UserRoleAssignmentService.java (User role management)

**Key Services**:
```java
// SystemRoleServiceImpl
- save(CreateSystemRoleCommand): SystemRole
- update(UpdateSystemRoleCommand): SystemRole
- getById(UUID): SystemRole
- delete(UUID): void
- getAll(FilterRequest, Pageable): Page<SystemRole>

// RoleActionManagementService
- addActionToRole(AddActionToRoleCommand): SystemRoleAction
- removeActionFromRole(UUID, UUID): void
- defineActionScope(DefineActionScopeCommand): List<SystemRoleActionScope>
- updateRoleAction(UUID, UpdateRoleActionCommand): SystemRoleAction

// RolePermissionQueryService
- getUserRolesInSystem(UUID, UUID, UUID): List<SystemRole>
- canUserPerformAction(UUID, UUID, UUID, List<ScopeValue>): boolean
- getUserActionsByRole(UUID, UUID, UUID): List<SystemSectionAction>

// UserRoleAssignmentService
- assignRoleToUser(UUID, UUID, UUID): UserSystemRole
- revokeRoleFromUser(UUID, UUID, UUID): void
- setPermissionNodeOverride(...): UserRolePermissionNode
```

### Phase 3: Backend - API Layer (1-2 days)

#### Step 6: Create REST Controllers
**Files**: `access-management-service/src/main/java/com/care/accessmanagement/web/controller/`

Use Prompts from `SYSTEMROLE_CURSOR_PROMPTS.md`:
- **Prompt 7**: Create REST API Controller
- **Prompt 8**: Create Role-Action Management Controller

**Deliverables**:
- SystemRoleController.java (Main CRUD endpoints)
- RoleActionController.java (Action management endpoints)
- UserRoleController.java (User role assignment endpoints)

**API Endpoints**:
```
Systems & Roles:
GET    /api/v1/systems/{systemId}/roles
GET    /api/v1/systems/{systemId}/roles/{roleId}
POST   /api/v1/systems/{systemId}/roles
PUT    /api/v1/systems/{systemId}/roles/{roleId}
DELETE /api/v1/systems/{systemId}/roles/{roleId}

Role Actions:
GET    /api/v1/systems/{systemId}/roles/{roleId}/actions
POST   /api/v1/systems/{systemId}/roles/{roleId}/actions
PUT    /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}
DELETE /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}

Scope Hierarchy:
POST   /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}/scopes
GET    /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}/scopes
DELETE /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}/scopes/{scopeId}

User Role Assignment:
GET    /api/v1/users/{userId}/tenant/{tenantId}/roles
POST   /api/v1/users/{userId}/tenant/{tenantId}/roles
DELETE /api/v1/users/{userId}/tenant/{tenantId}/roles/{roleId}

Permission Overrides:
GET    /api/v1/users/{userId}/roles/{assignmentId}/overrides
POST   /api/v1/users/{userId}/roles/{assignmentId}/overrides
DELETE /api/v1/users/{userId}/roles/{assignmentId}/overrides/{nodeId}
```

### Phase 4: Frontend - API Service (1 day)

#### Step 7: Create Frontend API Service
**File**: `web-portal/src/services/systemRoleService.ts`

Use Prompt from `SYSTEMROLE_CURSOR_PROMPTS.md` → **Prompt 9: Create Frontend API Service**

**Deliverable**: Complete TypeScript API service with:
- Axios-based HTTP calls
- React Query integration
- Error handling
- Type definitions for all DTOs
- Caching support

### Phase 5: Frontend - React Components (3-4 days)

#### Step 8: Create List Components
**File**: `web-portal/src/modules/cms/pages/systems/roles/SystemRoleList.tsx`

Use Prompt from `SYSTEMROLE_CURSOR_PROMPTS.md` → **Prompt 10: Create Frontend List Component**

**Features**:
- Display roles in Ant Design Table
- Search/filter by code or name
- Pagination support
- CRUD action buttons
- Create/Edit/Delete modals

#### Step 9: Create Form Modal
**File**: `web-portal/src/modules/cms/pages/systems/roles/SystemRoleFormModal.tsx`

Use Prompt from `SYSTEMROLE_CURSOR_PROMPTS.md` → **Prompt 11: Create Form Modal**

**Features**:
- Ant Design Form
- Validation rules
- Create vs Edit modes
- Success/error handling

#### Step 10: Create Role Action Manager
**File**: `web-portal/src/modules/cms/pages/systems/roles/RoleActionManager.tsx`

Use Prompt from `SYSTEMROLE_CURSOR_PROMPTS.md` → **Prompt 12: Create Role Action Manager**

**Features**:
- Two-panel layout (actions on left, scopes on right)
- Add/remove actions
- Configure scope hierarchy
- Drag-and-drop reordering

#### Step 11: Create User Role Assignment
**File**: `web-portal/src/modules/cms/pages/users/UserRoleAssignment.tsx`

Use Prompt from `SYSTEMROLE_CURSOR_PROMPTS.md` → **Prompt 13: Create User Role Assignment**

**Features**:
- Assign roles to users
- View assigned roles
- Remove roles
- Link to override manager

#### Step 12: Create Scope Override Manager
**File**: `web-portal/src/modules/cms/pages/users/ScopeOverrideManager.tsx`

Use Prompt from `SYSTEMROLE_CURSOR_PROMPTS.md` → **Prompt 14: Create Scope Override Manager**

**Features**:
- Tree view of scope values
- ALLOW/DENY checkboxes
- Hierarchy visualization
- Save overrides

#### Step 13: Update Routing & i18n
**Files**:
- `web-portal/src/modules/cms/routes.jsx`
- `web-portal/src/locales/en.json`
- `web-portal/src/locales/ar.json`

Use Prompts from `SYSTEMROLE_CURSOR_PROMPTS.md`:
- **Prompt 15**: Update routes
- **Prompt 16**: Add i18n messages

**Deliverables**:
- New routes for role management
- New routes for user role assignment
- English and Arabic translations

---

## 📊 Time Estimates

| Phase | Task | Days | Complexity |
|-------|------|------|-----------|
| 1 | Domain Models, Commands, Validators, Mappers | 1-2 | Low |
| 2 | Service Implementations (4 services) | 2-3 | Medium |
| 3 | REST Controllers (3 controllers) | 1-2 | Medium |
| 4 | Frontend API Service | 1 | Low |
| 5 | React Components (6 components) | 3-4 | Medium |
| - | Testing & Integration | 2-3 | High |
| - | **Total Estimated** | **10-15 days** | - |

---

## 🎯 Success Criteria

### Backend
- [ ] All 4 services implement their methods
- [ ] All 3 controllers expose REST endpoints
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] API documentation generated (Swagger)
- [ ] Backward compatible with existing permissions

### Frontend
- [ ] All 6 components render correctly
- [ ] CRUD operations work end-to-end
- [ ] Search and filter work
- [ ] i18n works for both English and Arabic
- [ ] RTL layout works for Arabic
- [ ] Error handling displays proper messages
- [ ] Loading states show during API calls

---

## 💾 File Creation Summary

### Backend Files to Create (20 files)

**Domain & Commands**:
- [ ] SystemRole.java (domain model)
- [ ] CreateSystemRoleCommand.java
- [ ] UpdateSystemRoleCommand.java
- [ ] AddActionToRoleCommand.java
- [ ] DefineActionScopeCommand.java

**Queries**:
- [ ] GetSystemRoleByIdQuery.java
- [ ] GetAllSystemRolesQuery.java
- [ ] GetRoleActionsQuery.java
- [ ] GetRoleActionScopesQuery.java

**Services**:
- [ ] SystemRoleServiceImpl.java
- [ ] RoleActionManagementService.java
- [ ] RolePermissionQueryService.java
- [ ] UserRoleAssignmentService.java

**Validators**:
- [ ] CreateSystemRoleValidator.java
- [ ] UpdateSystemRoleValidator.java
- [ ] ActionScopeValidator.java

**Mappers**:
- [ ] SystemRoleAppMapper.java

**Controllers**:
- [ ] SystemRoleController.java
- [ ] RoleActionController.java
- [ ] UserRoleController.java

### Frontend Files to Create (10 files)

**API Service**:
- [ ] systemRoleService.ts

**Components**:
- [ ] SystemRoleList.tsx
- [ ] SystemRoleFormModal.tsx
- [ ] RoleActionManager.tsx
- [ ] UserRoleAssignment.tsx
- [ ] ScopeOverrideManager.tsx

**Configuration**:
- [ ] Update routes.jsx
- [ ] Update en.json (i18n)
- [ ] Update ar.json (i18n)

---

## 🔄 Integration Checklist

### Database
- [ ] Run V104__Create_SystemRole_Tables.sql migration
- [ ] Run V105__Insert_Sample_SystemRoles.sql migration
- [ ] Verify 5 tables created with correct structure
- [ ] Verify 23 indexes created
- [ ] Test backup and recovery

### Backend
- [ ] Compile and run services with no errors
- [ ] All dependencies injected correctly
- [ ] Endpoints accessible via API Gateway
- [ ] JWT token validation works
- [ ] Audit logging works
- [ ] Error responses formatted correctly
- [ ] Swagger/OpenAPI docs generated

### Frontend
- [ ] Components import correctly
- [ ] Routes resolve properly
- [ ] API calls succeed
- [ ] Form validation works
- [ ] Navigation works (breadcrumbs)
- [ ] Responsive design works
- [ ] RTL support works

### End-to-End
- [ ] Create role → Assign to user → Check permissions
- [ ] Add action to role → Verify in permission query
- [ ] Define scopes → Verify scope-based access
- [ ] Set overrides → Verify override applied
- [ ] Delete role → Verify cascades properly

---

## 🐛 Common Issues & Solutions

### Issue: "Role code already exists"
**Solution**: Unique constraint on (system_id, code) - ensure code is unique per system

### Issue: "Cannot update BUILTIN role"
**Solution**: Check roleType = CUSTOM before allowing updates - BUILTIN roles are read-only

### Issue: "Scope hierarchy missing level N"
**Solution**: OrderIndex must be sequential (1,2,3...) - no gaps allowed

### Issue: "User override not working"
**Solution**: Verify UserRolePermissionNode created - DENY must override ALLOW

### Issue: "Permission check always returns false"
**Solution**:
1. Verify role assigned to user (check user_system_roles)
2. Verify action in role (check system_role_actions with ALLOW effect)
3. Verify no DENY override (check user_role_permission_nodes)
4. Check scope hierarchy matches provided scopes

---

## 📚 Documentation References

| Document | Purpose |
|----------|---------|
| SYSTEMROLE_IMPLEMENTATION_GUIDE.md | Architecture & design decisions |
| SYSTEMROLE_CURSOR_PROMPTS.md | Detailed prompts for each implementation step |
| SYSTEMROLE_ARCHITECTURE_VISUAL.md | Diagrams & data flows |
| V104__Create_SystemRole_Tables.sql | Database schema |
| V105__Insert_Sample_SystemRoles.sql | Sample data |

---

## ✅ Validation Tests

### Backend Tests to Write

```java
// SystemRoleServiceImpl Tests
createRole_shouldSucceed()
createRole_withDuplicateCode_shouldFail()
updateRole_shouldSucceed()
updateRole_builtinRole_shouldFail()
deleteRole_shouldCascadeDelete()

// RoleActionManagementService Tests
addActionToRole_shouldSucceed()
addActionToRole_duplicate_shouldFail()
defineActionScope_shouldSucceed()
defineActionScope_invalidOrder_shouldFail()

// RolePermissionQueryService Tests
getUserRolesInSystem_shouldReturnUserRoles()
canUserPerformAction_withAllow_shouldReturnTrue()
canUserPerformAction_withDeny_shouldReturnFalse()
canUserPerformAction_withOverride_shouldReturnFalse()
```

### Frontend Tests to Write

```typescript
// SystemRoleList Tests
should_render_roles()
should_filter_by_name()
should_paginate_correctly()
should_open_create_modal()
should_delete_role_with_confirmation()

// RoleActionManager Tests
should_load_role_actions()
should_add_action_to_role()
should_define_scope_hierarchy()
should_reorder_scopes()

// UserRoleAssignment Tests
should_load_user_roles()
should_assign_new_role()
should_revoke_role_with_confirmation()
should_navigate_to_override_manager()
```

---

## 🎓 Learning Resources

### For Domain-Driven Design
- Study the existing `system` module structure
- Understand CrudApplicationService pattern
- Review Lombok and MapStruct usage

### For Spring Security
- Check @Audited annotation implementation
- Review CurrentUserContext usage
- Understand permission checking flow

### For React
- Study existing modules in `cms/pages`
- Review Ant Design components used
- Check React Query patterns for caching

---

## 🚨 Important Notes

1. **Backward Compatibility**: New role system coexists with old UserActionPermission - no breaking changes
2. **Security**: DENY always overrides ALLOW - fail-secure design
3. **Audit Trail**: All operations must be tracked with @Audited annotation
4. **Multi-Tenant**: Every assignment is tenant-aware - critical for isolation
5. **Performance**: Leverage 23 indexes for efficient permission queries
6. **Scope Hierarchy**: Different actions can have different scope structures

---

## 📞 Support

For questions during implementation:
1. Check the relevant cursor prompt in SYSTEMROLE_CURSOR_PROMPTS.md
2. Review the architecture diagram in SYSTEMROLE_ARCHITECTURE_VISUAL.md
3. Examine the existing `system` module for patterns
4. Refer to SYSTEMROLE_IMPLEMENTATION_GUIDE.md for design decisions

---

**Created**: 2025-11-04
**Status**: Ready for Implementation
**Duration**: ~10-15 days total
**Complexity**: Medium-High

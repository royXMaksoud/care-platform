# SystemRole Implementation Guide

## Overview
This document provides a comprehensive guide for implementing the SystemRole-based permission management system in the Care Management System's auth-service and access-management-service.

## Architecture Summary

### What We've Created So Far ✅

#### 1. **JPA Entities** (5 entities)
- `SystemRoleEntity` - Reusable roles within systems
- `SystemRoleActionEntity` - Bridge table mapping roles to actions
- `SystemRoleActionScopeEntity` - Scope hierarchy definitions per action
- `UserSystemRoleEntity` - User-to-role assignments
- `UserRolePermissionNodeEntity` - Scope-specific permission overrides

**Location**: `access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/entities/`

#### 2. **Repositories** (5 repositories)
- `SystemRoleRepository` - CRUD operations for SystemRole
- `SystemRoleActionRepository` - CRUD operations for SystemRoleAction
- `SystemRoleActionScopeRepository` - CRUD operations for scope definitions
- `UserSystemRoleRepository` - User-role assignment management
- `UserRolePermissionNodeRepository` - Permission node management

**Location**: `access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/repository/`

#### 3. **Database Migrations** (2 migrations)
- `V104__Create_SystemRole_Tables.sql` - Create all 5 tables with proper constraints and indexes
- `V105__Insert_Sample_SystemRoles.sql` - Optional sample data

**Location**: `access-management-service/src/main/resources/db/migration/`

### What Still Needs Implementation

#### 4. **Domain Models** (Create domain/model classes if needed)
These would mirror the JPA entities but represent business domain concepts.

#### 5. **Services** (To Create)

**a) SystemRoleService**
```java
@Service
public class SystemRoleService {
    // CRUD operations for roles
    // - createRole(CreateSystemRoleCommand): SystemRole
    // - updateRole(UpdateSystemRoleCommand): SystemRole
    // - getRoleById(UUID): SystemRole
    // - getAllRoles(UUID systemId): List<SystemRole>
    // - deleteRole(UUID roleId): void
    // - addActionToRole(UUID roleId, UUID actionId, ActionEffect): SystemRoleAction
    // - removeActionFromRole(UUID roleId, UUID actionId): void
    // - defineActionScope(UUID roleActionId, DefineActionScopeCommand): SystemRoleActionScope
    // - removeActionScope(UUID scopeId): void
}
```

**b) UserRoleAssignmentService**
```java
@Service
public class UserRoleAssignmentService {
    // User-role assignment management
    // - assignRoleToUser(UUID userId, UUID tenantId, UUID roleId): UserSystemRole
    // - revokeRoleFromUser(UUID userId, UUID tenantId, UUID roleId): void
    // - getRolesForUser(UUID userId, UUID tenantId): List<SystemRole>
    // - setPermissionNodeOverride(UUID assignmentId, SetPermissionNodeCommand): UserRolePermissionNode
    // - removePermissionNodeOverride(UUID nodeId): void
    // - getPermissionNodeOverrides(UUID assignmentId): List<UserRolePermissionNode>
}
```

**c) RolePermissionQueryService**
```java
@Service
public class RolePermissionQueryService {
    // Query user permissions via roles
    // - getUserPermissionsViaRoles(UUID userId, UUID tenantId): List<Permission>
    // - canUserPerformAction(UUID userId, UUID tenantId, UUID actionId, List<ScopeValue>): boolean
    // - getUserActionsBySystem(UUID userId, UUID tenantId, UUID systemId): List<SystemAction>
}
```

**d) Update PermissionQueryService**
```java
// Existing service at:
// access-management-service/src/main/java/com/care/accessmanagement/application/
// permission_query/service/PermissionQueryService.java

// Modify to:
// 1. Check roles first via RolePermissionQueryService
// 2. Fall back to direct UserActionPermission (backward compatibility)
// 3. Combine results (DENY overrides ALLOW)
```

#### 6. **DTOs** (To Create)

**System Role DTOs**
```java
// Request DTOs
- CreateSystemRoleRequest { code, name, description, roleType }
- UpdateSystemRoleRequest { name, description, isActive }
- AddActionToRoleRequest { systemSectionActionId, actionEffect }
- DefineActionScopeRequest { systemRoleActionId, List<ScopeDefinition> }
- SetPermissionNodeOverrideRequest { actionId, codeTableValueId, effect }

// Response DTOs
- SystemRoleResponse { id, code, name, description, roleType, actions, scopes }
- SystemRoleActionResponse { id, systemSectionActionId, actionEffect, orderIndex, scopes }
- SystemRoleActionScopeResponse { id, codeTableId, orderIndex, codeTableName }
- UserSystemRoleResponse { id, userId, roleId, roleName, assignedAt, expiresAt }
- PermissionNodeOverrideResponse { id, actionId, codeTableValueId, effect }
```

**Location**: `access-management-service/src/main/java/com/care/accessmanagement/web/dto/`

#### 7. **API Controllers** (To Create)

**SystemRoleController**
```java
@RestController
@RequestMapping("/api/systems/{systemId}/roles")
public class SystemRoleController {
    // GET /api/systems/{systemId}/roles - List all roles
    // POST /api/systems/{systemId}/roles - Create role
    // GET /api/systems/{systemId}/roles/{roleId} - Get role
    // PUT /api/systems/{systemId}/roles/{roleId} - Update role
    // DELETE /api/systems/{systemId}/roles/{roleId} - Delete role

    // GET /api/systems/{systemId}/roles/{roleId}/actions - List role actions
    // POST /api/systems/{systemId}/roles/{roleId}/actions - Add action to role
    // PUT /api/systems/{systemId}/roles/{roleId}/actions/{actionId} - Update role action
    // DELETE /api/systems/{systemId}/roles/{roleId}/actions/{actionId} - Remove action from role

    // POST /api/systems/{systemId}/roles/{roleId}/actions/{actionId}/scopes - Define scopes
    // DELETE /api/systems/{systemId}/roles/{roleId}/actions/{actionId}/scopes/{scopeId} - Remove scope
}
```

**UserRoleController**
```java
@RestController
@RequestMapping("/api/users/{userId}/roles")
public class UserRoleController {
    // GET /api/users/{userId}/tenant/{tenantId}/roles - Get user roles
    // POST /api/users/{userId}/tenant/{tenantId}/roles - Assign role to user
    // DELETE /api/users/{userId}/tenant/{tenantId}/roles/{roleId} - Revoke role from user

    // GET /api/users/{userId}/roles/{assignmentId}/overrides - Get permission overrides
    // POST /api/users/{userId}/roles/{assignmentId}/overrides - Add permission override
    // DELETE /api/users/{userId}/roles/{assignmentId}/overrides/{nodeId} - Remove override
}
```

**Location**: `access-management-service/src/main/java/com/care/accessmanagement/web/controller/`

## Implementation Priority

### Phase 1: Core Infrastructure ✅ (COMPLETE)
- [x] Create JPA Entities
- [x] Create Repositories
- [x] Create Database Migrations

### Phase 2: Business Logic (NEXT)
- [ ] Create Domain Models (if needed)
- [ ] Implement Services (SystemRoleService, UserRoleAssignmentService, RolePermissionQueryService)
- [ ] Add validation and error handling
- [ ] Update PermissionQueryService for role-based checks

### Phase 3: API Layer
- [ ] Create DTOs
- [ ] Create API Controllers
- [ ] Add OpenAPI/Swagger documentation
- [ ] Implement proper error responses

### Phase 4: Testing & Integration
- [ ] Unit tests for services
- [ ] Integration tests for repositories
- [ ] API tests for controllers
- [ ] Performance testing for permission queries
- [ ] Update Web Portal UI for role management

### Phase 5: Migration & Cleanup
- [ ] Create migration script for converting existing UserActionPermission to roles
- [ ] Backward compatibility testing
- [ ] Performance optimization
- [ ] Production deployment

## Key Design Decisions

### 1. **Direct Permission Model Coexistence**
- New role-based system works alongside existing UserActionPermission
- Migration is gradual, not a breaking change
- PermissionQueryService checks both roles and direct permissions
- DENY always overrides ALLOW (secure by default)

### 2. **Scope Hierarchy Flexibility**
- Each role-action can have different scope hierarchy
- Same action might be scoped differently in different roles
- Example:
  - "Appointment Reader" role: scoped by [Country, City]
  - "Appointment Manager" role: scoped by [Country, City, Branch, Provider]
  - "Global Viewer" role: no scoping (global access)

### 3. **User-Level Overrides**
- Users can have broader access than role default (grant override)
- Users can have narrower access than role default (deny override)
- Enables fine-grained control while leveraging roles
- Reduces permission configuration complexity

### 4. **Multi-Tenant Safety**
- Every role assignment is tenant-aware
- Users can have different roles in different tenants
- Users can have different roles in different systems
- Clean isolation and auditability

### 5. **Audit Trail**
- All role operations (create, assign, update, override) are audited
- Track who assigned/revoked roles and when
- Support for role expiration (time-limited assignments)
- Complete change history

## Implementation Notes

### File Paths Created
```
✅ SystemRoleEntity
   src/main/java/com/care/accessmanagement/infrastructure/db/entities/SystemRoleEntity.java

✅ SystemRoleActionEntity
   src/main/java/com/care/accessmanagement/infrastructure/db/entities/SystemRoleActionEntity.java

✅ SystemRoleActionScopeEntity
   src/main/java/com/care/accessmanagement/infrastructure/db/entities/SystemRoleActionScopeEntity.java

✅ UserSystemRoleEntity
   src/main/java/com/care/accessmanagement/infrastructure/db/entities/UserSystemRoleEntity.java

✅ UserRolePermissionNodeEntity
   src/main/java/com/care/accessmanagement/infrastructure/db/entities/UserRolePermissionNodeEntity.java

✅ SystemRoleRepository
   src/main/java/com/care/accessmanagement/infrastructure/db/repository/SystemRoleRepository.java

✅ SystemRoleActionRepository
   src/main/java/com/care/accessmanagement/infrastructure/db/repository/SystemRoleActionRepository.java

✅ SystemRoleActionScopeRepository
   src/main/java/com/care/accessmanagement/infrastructure/db/repository/SystemRoleActionScopeRepository.java

✅ UserSystemRoleRepository
   src/main/java/com/care/accessmanagement/infrastructure/db/repository/UserSystemRoleRepository.java

✅ UserRolePermissionNodeRepository
   src/main/java/com/care/accessmanagement/infrastructure/db/repository/UserRolePermissionNodeRepository.java

✅ V104__Create_SystemRole_Tables.sql
   src/main/resources/db/migration/V104__Create_SystemRole_Tables.sql

✅ V105__Insert_Sample_SystemRoles.sql
   src/main/resources/db/migration/V105__Insert_Sample_SystemRoles.sql
```

### Database Schema Overview
```
Tables Created:
- system_roles (9 columns + audit fields)
- system_role_actions (8 columns + audit fields)
- system_role_action_scopes (7 columns + audit fields)
- user_system_roles (9 columns + audit fields)
- user_role_permission_nodes (9 columns + audit fields)

Total Indexes Created: 23 indexes for optimal query performance
Constraints: 9 unique constraints + 1 FK relationships
```

### Integration Points

#### With Auth Service
- User ID references (no FK, different service)
- User context from JWT token
- User audit trail (createdById, updatedById)

#### With Access Management Service (existing)
- System references
- SystemSection references
- SystemSectionAction references
- CodeTable references
- CodeTableValue references

#### With Web Portal
- New Role Management UI component
- Role CRUD operations
- Action-scope configuration
- User-role assignment
- Permission override management

## API Usage Examples

### Create a Role
```http
POST /api/systems/{systemId}/roles
{
  "code": "APPOINTMENT_READER",
  "name": "Appointment Reader",
  "description": "Read-only access to appointments",
  "roleType": "CUSTOM"
}
```

### Add Actions to Role
```http
POST /api/systems/{systemId}/roles/{roleId}/actions
{
  "systemSectionActionId": "uuid-of-view-action",
  "actionEffect": "ALLOW"
}
```

### Define Scope Hierarchy
```http
POST /api/systems/{systemId}/roles/{roleId}/actions/{actionId}/scopes
{
  "scopes": [
    { "codeTableId": "uuid-countries", "orderIndex": 1 },
    { "codeTableId": "uuid-cities", "orderIndex": 2 },
    { "codeTableId": "uuid-branches", "orderIndex": 3 }
  ]
}
```

### Assign Role to User
```http
POST /api/users/{userId}/tenant/{tenantId}/roles
{
  "systemRoleId": "uuid-appointment-reader"
}
```

### Override Scope Permission for User
```http
POST /api/users/{userId}/roles/{assignmentId}/overrides
{
  "systemSectionActionId": "uuid-view-action",
  "codeTableValueId": "uuid-cairo-branch",
  "effect": "DENY"
}
```

## Database Cleanup (if needed)

If you need to rollback:
```sql
-- Drop tables in reverse order (handles FKs)
DROP TABLE IF EXISTS user_role_permission_nodes CASCADE;
DROP TABLE IF EXISTS user_system_roles CASCADE;
DROP TABLE IF EXISTS system_role_action_scopes CASCADE;
DROP TABLE IF EXISTS system_role_actions CASCADE;
DROP TABLE IF EXISTS system_roles CASCADE;
```

## Next Steps

1. **Review & Adjust**: Review the database schema and entities to ensure they match your exact requirements
2. **Implement Services**: Create the service layer following the patterns in the codebase
3. **Create DTOs**: Define request/response DTOs for API layer
4. **Implement Controllers**: Create REST API endpoints for role management
5. **Update UI**: Build role management interface in Web Portal
6. **Test Thoroughly**: Unit, integration, and API testing
7. **Deploy**: Apply migrations to database, deploy services
8. **Monitor**: Track role assignment patterns and performance

## Questions & Support

- For Azure AD/OAuth integration, refer to auth-service documentation
- For multi-tenancy questions, check access-management-service claude.md
- For scope hierarchy complexity, review ActionScopeHierarchy implementation
- For performance tuning, check database index strategies

---

**Created**: 2025-11-04
**Architecture**: Role-Based Access Control (RBAC) with Hierarchical Scoping
**Status**: Phase 1 Complete, Ready for Phase 2

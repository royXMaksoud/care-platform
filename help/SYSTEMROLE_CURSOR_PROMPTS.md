# SystemRole CRUD Implementation - Clear Cursor Prompts

## Overview
This document provides **clear cursor prompts** for implementing SystemRole CRUD operations following the exact structure used in the `system` module of access-management-service.

---

## BACKEND IMPLEMENTATION (Java/Spring Boot)

### Structure to Follow
```
access-management-service/src/main/java/com/care/accessmanagement/application/system_role/
├── command/
│   ├── CreateSystemRoleCommand.java
│   ├── UpdateSystemRoleCommand.java
│   ├── AddActionToRoleCommand.java
│   ├── UpdateRoleActionCommand.java
│   ├── DefineActionScopeCommand.java
│   └── RemoveActionScopeCommand.java
├── query/
│   ├── GetSystemRoleByIdQuery.java
│   ├── GetAllSystemRolesQuery.java
│   ├── GetRoleActionsQuery.java
│   └── GetRoleActionScopesQuery.java
├── service/
│   ├── SystemRoleServiceImpl.java
│   ├── RoleActionManagementService.java
│   └── RolePermissionQueryService.java
├── mapper/
│   └── SystemRoleAppMapper.java
└── validation/
    ├── CreateSystemRoleValidator.java
    ├── UpdateSystemRoleValidator.java
    └── ActionScopeValidator.java
```

---

## BACKEND CURSOR PROMPTS

### Prompt 1: Create Command Classes
**Location**: `access-management-service/src/main/java/com/care/accessmanagement/application/system_role/command/`

**Prompt for CreateSystemRoleCommand.java**:
```
Create a command class for creating a SystemRole following the exact structure of CreateSystemCommand.java.

Requirements:
- Package: com.care.accessmanagement.application.system_role.command
- Class: CreateSystemRoleCommand
- Use Lombok annotations: @Getter, @Builder, @NoArgsConstructor, @AllArgsConstructor
- Fields:
  - systemRoleId: UUID (generated)
  - systemId: UUID (required, which system this role belongs to)
  - code: String (required, unique code like "APPOINTMENT_READER")
  - name: String (required, display name like "Appointment Reader")
  - description: String (optional, role description)
  - roleType: String or Enum (BUILTIN or CUSTOM)
  - isActive: Boolean (default true)

Reference file: CreateSystemCommand.java for the exact Lombok pattern
No validation in the command class itself - validation happens in validators
```

**Prompt for UpdateSystemRoleCommand.java**:
```
Create an update command class for SystemRole.

Requirements:
- Package: com.care.accessmanagement.application.system_role.command
- Class: UpdateSystemRoleCommand
- Use Lombok annotations: @Getter, @Builder, @NoArgsConstructor, @AllArgsConstructor
- Fields:
  - systemRoleId: UUID (required, identifies which role to update)
  - name: String (optional, update role name)
  - description: String (optional, update description)
  - isActive: Boolean (optional, activate/deactivate role)

Pattern: Similar to UpdateSystemCommand but include systemRoleId for identification
```

**Prompt for AddActionToRoleCommand.java**:
```
Create a command class for adding an action to a role.

Requirements:
- Package: com.care.accessmanagement.application.system_role.command
- Class: AddActionToRoleCommand
- Lombok annotations required
- Fields:
  - systemRoleId: UUID (which role)
  - systemSectionActionId: UUID (which action like VIEW, CREATE, UPDATE)
  - actionEffect: String or Enum (ALLOW, DENY, NONE)
  - orderIndex: Integer (optional, for UI ordering)

This bridges a role to an action with a specific permission effect.
```

**Prompt for DefineActionScopeCommand.java**:
```
Create a command class for defining scope hierarchy on a role-action.

Requirements:
- Package: com.care.accessmanagement.application.system_role.command
- Class: DefineActionScopeCommand
- Lombok annotations required
- Fields:
  - systemRoleActionId: UUID (which role-action combination)
  - scopeDefinitions: List<ScopeDefinition> (nested class)

Where ScopeDefinition contains:
  - codeTableId: UUID (which scope type like Countries, Cities, Branches)
  - orderIndex: Integer (hierarchy level: 1=Country, 2=City, 3=Branch)

This defines the hierarchical scoping for a specific action in a role.
Example: "Approve Appointment" action scoped by [Country→City→Branch]
```

---

### Prompt 2: Create Query Classes
**Location**: `access-management-service/src/main/java/com/care/accessmanagement/application/system_role/query/`

**Prompt for GetSystemRoleByIdQuery.java**:
```
Create a query class following CQRS pattern for retrieving a SystemRole by ID.

Requirements:
- Package: com.care.accessmanagement.application.system_role.query
- Class: GetSystemRoleByIdQuery
- Fields:
  - systemRoleId: UUID (the role ID to retrieve)
  - systemId: UUID (context, which system)

Pattern: Simple POJO with @Getter and constructor.
Used by the query side of CQRS (read operations).
```

**Prompt for GetAllSystemRolesQuery.java**:
```
Create a query class for retrieving all roles for a system.

Requirements:
- Package: com.care.accessmanagement.application.system_role.query
- Class: GetAllSystemRolesQuery
- Fields:
  - systemId: UUID (filter by system)
  - includeInactive: Boolean (default false, exclude inactive roles)
  - pageNumber: Integer (for pagination)
  - pageSize: Integer (for pagination)
```

**Prompt for GetRoleActionsQuery.java**:
```
Create a query class for retrieving actions assigned to a role.

Requirements:
- Package: com.care.accessmanagement.application.system_role.query
- Class: GetRoleActionsQuery
- Fields:
  - systemRoleId: UUID (which role)
  - systemId: UUID (context)
  - includeInactive: Boolean (default false)

Returns: List of actions with their effect (ALLOW/DENY/NONE) and scopes.
```

---

### Prompt 3: Create Service Implementation
**Location**: `access-management-service/src/main/java/com/care/accessmanagement/application/system_role/service/`

**Prompt for SystemRoleServiceImpl.java**:
```
Create the main service for SystemRole CRUD operations following SystemServiceImpl.java pattern.

Requirements:
- Package: com.care.accessmanagement.application.system_role.service
- Class: SystemRoleServiceImpl
- Extends: CrudApplicationService<UUID, SystemRole, CreateSystemRoleCommand, UpdateSystemRoleCommand, SystemRole, FilterRequest>
- Implements: SaveUseCase, UpdateUseCase, LoadUseCase, DeleteUseCase, LoadAllUseCase

Constructor injection:
- SystemRoleRepository systemRoleRepository
- SystemRoleAppMapper systemRoleMapper
- CreateSystemRoleValidator createValidator
- UpdateSystemRoleValidator updateValidator
- MessageResolver messageResolver

Override these hook methods from CrudApplicationService:
1. beforeCreate(SystemRole role): SystemRole
   - Set createdById from CurrentUserContext
   - Run createValidator.validate()
   - Return enriched role

2. beforeUpdate(SystemRole current, UpdateSystemRoleCommand cmd): SystemRole
   - Set updatedById from CurrentUserContext
   - Run updateValidator.validate()
   - Return updated role

3. afterSave(SystemRole saved): void
   - Optional: publish events, invalidate caches, etc.

4. notFound(UUID id): NotFoundException
   - Return i18n-friendly message using messageResolver

Implement use case adapters:
- save(CreateSystemRoleCommand): SystemRole - annotated with @Audited
- update(UpdateSystemRoleCommand): SystemRole - annotated with @Audited
- getByIdOptional(UUID): Optional<SystemRole>
- delete(UUID): void - annotated with @Audited

Reference: SystemServiceImpl.java lines 33-150
```

**Prompt for RoleActionManagementService.java**:
```
Create a specialized service for managing role-action relationships and scopes.

Package: com.care.accessmanagement.application.system_role.service
Class: RoleActionManagementService
Annotation: @Service

Methods to implement:

1. addActionToRole(AddActionToRoleCommand cmd): SystemRoleAction
   - Validate role exists
   - Validate action exists
   - Check for duplicates (unique constraint on systemRoleId + systemSectionActionId)
   - Create and persist SystemRoleAction
   - Annotate with @Audited(action=PERMISSION_CHANGE, description="Add action to role")

2. removeActionFromRole(UUID systemRoleId, UUID systemSectionActionId): void
   - Delete SystemRoleAction
   - Cascade: Delete all associated SystemRoleActionScope entries
   - Annotate with @Audited

3. defineActionScope(DefineActionScopeCommand cmd): List<SystemRoleActionScope>
   - Validate systemRoleActionId exists
   - Validate scope definitions don't have duplicate orderIndex
   - Delete existing scope definitions for this role-action
   - Create new scope definitions with proper ordering
   - Return created scopes ordered by orderIndex
   - Annotate with @Audited

4. updateRoleAction(UUID roleActionId, UpdateRoleActionCommand cmd): SystemRoleAction
   - Find role-action
   - Update actionEffect and/or orderIndex
   - Annotate with @Audited

Dependencies:
- SystemRoleActionRepository
- SystemRoleActionScopeRepository
- SystemRoleRepository
- MessageResolver

Error handling:
- Throw NotFoundException with i18n message if role/action doesn't exist
- Throw validation exception for duplicate/invalid data
```

**Prompt for RolePermissionQueryService.java**:
```
Create a specialized service for querying user permissions through roles.

Package: com.care.accessmanagement.application.system_role.service
Class: RolePermissionQueryService
Annotation: @Service

Methods to implement:

1. getUserRolesInSystem(UUID userId, UUID tenantId, UUID systemId): List<SystemRoleResponse>
   - Query UserSystemRole with active = true, deleted = false
   - Filter by userId, tenantId, and systemId (via role's system)
   - Return list of SystemRole with all their actions and scopes

2. canUserPerformAction(UUID userId, UUID tenantId, UUID actionId, List<ScopeValue> scopes): boolean
   - Get all active roles for user in tenant
   - For each role, check if action is present with actionEffect = ALLOW
   - If action has scope hierarchy, validate provided scope values
   - Check UserRolePermissionNode for overrides (DENY overrides ALLOW)
   - Return true if permission granted, false otherwise

3. getUserActionsByRole(UUID userId, UUID tenantId, UUID systemRoleId): List<SystemSectionAction>
   - Get UserSystemRole assignment
   - Get all actions from that role
   - Filter to ALLOW actions only
   - Return list of actions user can perform

4. getRoleActionScopes(UUID systemRoleId, UUID systemSectionActionId): List<SystemRoleActionScope>
   - Get scope hierarchy for specific role-action
   - Return ordered by orderIndex (low to high)

Dependencies:
- UserSystemRoleRepository
- SystemRoleRepository
- SystemRoleActionRepository
- SystemRoleActionScopeRepository
- UserRolePermissionNodeRepository
```

---

### Prompt 4: Create Mappers
**Location**: `access-management-service/src/main/java/com/care/accessmanagement/application/system_role/mapper/`

**Prompt for SystemRoleAppMapper.java**:
```
Create a mapper class for SystemRole DTOs and domain objects using MapStruct.

Package: com.care.accessmanagement.application.system_role.mapper
Interface: SystemRoleAppMapper
Annotation: @Mapper(componentModel = "spring")

Methods to implement using MapStruct:

1. toDomain(CreateSystemRoleCommand cmd): SystemRole
   - Map command fields to domain model
   - Generate UUID for systemRoleId if not provided

2. toDomain(UpdateSystemRoleCommand cmd): SystemRole
   - Map command to domain model

3. toEntity(SystemRole domain): SystemRoleEntity
   - Map domain model to JPA entity

4. toDomain(SystemRoleEntity entity): SystemRole
   - Map JPA entity to domain model

5. toResponse(SystemRole domain): SystemRoleResponse
   - Map domain to API response DTO
   - Include action details if available

6. toResponseWithActions(SystemRole domain, List<SystemRoleAction> actions): SystemRoleResponse
   - Enhanced response including full action and scope details

Reference existing mappers in the codebase for pattern.
Use @Mapping annotations for field name mismatches.
```

---

### Prompt 5: Create Validators
**Location**: `access-management-service/src/main/java/com/care/accessmanagement/application/system_role/validation/`

**Prompt for CreateSystemRoleValidator.java**:
```
Create a validator for creating new SystemRoles.

Package: com.care.accessmanagement.application.system_role.validation
Class: CreateSystemRoleValidator
Annotation: @Component

Method: validate(SystemRole role): void
- Throw exception if any validation fails

Validations to implement:

1. systemId must not be null
   - Exception: "System must be specified for role creation"

2. code must not be blank
   - Exception: "Role code cannot be empty"

3. code must be 3-100 characters
   - Exception: "Role code must be between 3 and 100 characters"

4. code must match pattern [A-Z_0-9] (uppercase, underscore, numbers only)
   - Exception: "Role code must contain only uppercase letters, numbers, and underscores"

5. name must not be blank
   - Exception: "Role name cannot be empty"

6. name must be 3-200 characters
   - Exception: "Role name must be between 3 and 200 characters"

7. Check duplicate: No other role with same (systemId, code) combination
   - Use SystemRoleRepository.findBySystemIdAndCode()
   - Exception: "Role with code '{code}' already exists in this system"

8. roleType must be BUILTIN or CUSTOM
   - Exception: "Invalid role type. Must be BUILTIN or CUSTOM"

Dependencies:
- SystemRoleRepository
- MessageResolver (for i18n messages)

Use custom exceptions from core-shared-lib when available.
```

**Prompt for UpdateSystemRoleValidator.java**:
```
Create a validator for updating SystemRoles.

Package: com.care.accessmanagement.application.system_role.validation
Class: UpdateSystemRoleValidator

Method: validate(SystemRole role): void

Validations:

1. systemRoleId must not be null
   - Exception: "Role ID must be specified for update"

2. Role must exist and not be deleted
   - Query database, throw NotFoundException if not found

3. Name validations (if name provided):
   - Must not be blank
   - Must be 3-200 characters
   - Exceptions same as create validator

4. Cannot update BUILTIN roles
   - Check roleType = BUILTIN
   - Exception: "System-provided roles cannot be modified"

5. Description validation (if provided):
   - Max 1000 characters
   - Exception: "Description too long"

Additional checks:
- Cannot activate a deleted role
- Cannot change system after creation (systemId immutable)
```

**Prompt for ActionScopeValidator.java**:
```
Create a validator for action scope definitions.

Package: com.care.accessmanagement.application.system_role.validation
Class: ActionScopeValidator

Method: validateScopes(List<ScopeDefinition> scopes): void

Validations:

1. Scopes list must not be empty
   - Exception: "At least one scope level must be defined"

2. OrderIndex must be sequential starting from 1
   - Check: 1, 2, 3, ... no gaps, no duplicates
   - Exception: "Scope order indices must be sequential (1, 2, 3, ...)"

3. Each codeTableId must exist
   - Query CodeTableRepository
   - Exception: "Invalid code table ID: {id}"

4. Each codeTableId must be unique in the list
   - Check for duplicates
   - Exception: "Duplicate scope table in definitions"

5. OrderIndex must be positive integers
   - Exception: "Order index must be positive"

Method: validateScopeValue(UUID codeTableValueId, UUID codeTableId): void
- Validate that the code table value belongs to the specified code table
- Exception: "Code table value does not belong to specified code table"
```

---

### Prompt 6: Create Domain Models
**Location**: `access-management-service/src/main/java/com/care/accessmanagement/domain/model/`

**Prompt for SystemRole.java**:
```
Create a domain model class for SystemRole following clean architecture principles.

Package: com.care.accessmanagement.domain.model
Class: SystemRole (immutable/value object pattern)
Annotations: @Getter, @Builder, @NoArgsConstructor, @AllArgsConstructor

Fields:
- systemRoleId: UUID
- systemId: UUID
- code: String
- name: String
- description: String
- roleType: RoleType (enum: BUILTIN, CUSTOM)
- isActive: Boolean
- isDeleted: Boolean
- createdById: UUID
- createdAt: LocalDateTime
- updatedById: UUID
- updatedAt: LocalDateTime
- rowVersion: Long

Nested Enum:
```java
public enum RoleType {
    BUILTIN,   // System-provided, cannot be modified by users
    CUSTOM     // Organization-created, can be modified
}
```

Methods (if any):
- isReadOnly(): boolean - returns true if roleType == BUILTIN
- canBeModified(): boolean - returns true if roleType == CUSTOM

No persistence logic in domain model - stays clean and independent.
```

---

### Prompt 7: Create REST API Controller
**Location**: `access-management-service/src/main/java/com/care/accessmanagement/web/controller/`

**Prompt for SystemRoleController.java**:
```
Create a REST API controller for SystemRole CRUD operations following existing controller patterns.

Package: com.care.accessmanagement.web.controller
Class: SystemRoleController
Annotation: @RestController, @RequestMapping("/api/v1/systems/{systemId}/roles")

Dependencies (constructor injection):
- SystemRoleServiceImpl systemRoleService
- RoleActionManagementService roleActionService
- RolePermissionQueryService rolePermissionQueryService
- MessageResolver messageResolver

Endpoints to implement:

1. GET /api/v1/systems/{systemId}/roles
   - Method: getAllRoles(UUID systemId, Pageable pageable)
   - Returns: Page<SystemRoleResponse>
   - Query params: page, size, sort
   - Authorization: requires VIEW_SYSTEM_ROLE permission

2. GET /api/v1/systems/{systemId}/roles/{roleId}
   - Method: getRoleById(UUID systemId, UUID roleId)
   - Returns: SystemRoleResponse with actions and scopes
   - Authorization: requires VIEW_SYSTEM_ROLE permission

3. POST /api/v1/systems/{systemId}/roles
   - Method: createRole(UUID systemId, CreateSystemRoleRequest request)
   - Returns: SystemRoleResponse with 201 status
   - Body: {code, name, description, roleType}
   - Authorization: requires CREATE_SYSTEM_ROLE permission
   - Validation: Validate via CreateSystemRoleValidator

4. PUT /api/v1/systems/{systemId}/roles/{roleId}
   - Method: updateRole(UUID systemId, UUID roleId, UpdateSystemRoleRequest request)
   - Returns: SystemRoleResponse
   - Body: {name, description, isActive}
   - Authorization: requires UPDATE_SYSTEM_ROLE permission

5. DELETE /api/v1/systems/{systemId}/roles/{roleId}
   - Method: deleteRole(UUID systemId, UUID roleId)
   - Returns: 204 No Content
   - Authorization: requires DELETE_SYSTEM_ROLE permission

Response DTO structure:
```java
@Data
public class SystemRoleResponse {
    UUID systemRoleId;
    UUID systemId;
    String code;
    String name;
    String description;
    String roleType;     // "BUILTIN" or "CUSTOM"
    Boolean isActive;
    Instant createdAt;
    Instant updatedAt;
    List<SystemRoleActionResponse> actions;
}
```

All endpoints should:
- Set CurrentUserContext in headers
- Return proper error responses with error codes
- Include OpenAPI/Swagger annotations
- Use @Valid for request validation
```

---

### Prompt 8: Create Role-Action Management Controller
**Location**: `access-management-service/src/main/java/com/care/accessmanagement/web/controller/`

**Prompt for RoleActionController.java**:
```
Create a REST API controller for managing actions and scopes within roles.

Package: com.care.accessmanagement.web.controller
Class: RoleActionController
Annotation: @RestController, @RequestMapping("/api/v1/systems/{systemId}/roles/{roleId}/actions")

Endpoints:

1. GET /api/v1/systems/{systemId}/roles/{roleId}/actions
   - Method: getRoleActions(UUID systemId, UUID roleId)
   - Returns: List<SystemRoleActionResponse>
   - Show all actions assigned to this role with their effects

2. POST /api/v1/systems/{systemId}/roles/{roleId}/actions
   - Method: addActionToRole(UUID systemId, UUID roleId, AddActionToRoleRequest request)
   - Returns: SystemRoleActionResponse with 201 status
   - Body: {systemSectionActionId, actionEffect, orderIndex}
   - Validates action exists and no duplicate

3. PUT /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}
   - Method: updateRoleAction(UUID systemId, UUID roleId, UUID actionId, UpdateRoleActionRequest request)
   - Returns: SystemRoleActionResponse
   - Body: {actionEffect, orderIndex}

4. DELETE /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}
   - Method: removeActionFromRole(UUID systemId, UUID roleId, UUID actionId)
   - Returns: 204 No Content
   - Cascades: deletes all scope definitions for this role-action

5. POST /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}/scopes
   - Method: defineActionScope(UUID systemId, UUID roleId, UUID actionId, DefineActionScopeRequest request)
   - Returns: List<SystemRoleActionScopeResponse>
   - Body: {scopes: [{codeTableId, orderIndex}]}
   - Replaces all existing scopes with new ones
   - Must be ordered 1, 2, 3...

6. GET /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}/scopes
   - Method: getActionScopes(UUID systemId, UUID roleId, UUID actionId)
   - Returns: List<SystemRoleActionScopeResponse> ordered by hierarchy level

7. DELETE /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}/scopes/{scopeId}
   - Method: removeActionScope(UUID scopeId)
   - Returns: 204 No Content

Response DTOs:
```java
@Data
public class SystemRoleActionResponse {
    UUID systemRoleActionId;
    UUID systemSectionActionId;
    String actionCode;
    String actionName;
    String actionEffect;      // "ALLOW", "DENY", "NONE"
    Integer orderIndex;
    List<SystemRoleActionScopeResponse> scopes;
}

@Data
public class SystemRoleActionScopeResponse {
    UUID systemRoleActionScopeId;
    UUID codeTableId;
    String codeTableName;
    Integer orderIndex;
}
```
```

---

## FRONTEND IMPLEMENTATION (React/TypeScript)

### Prompt 9: Create Frontend API Service
**Location**: `web-portal/src/services/`

**Prompt for systemRoleService.ts**:
```
Create a TypeScript API service for SystemRole CRUD operations using Axios.

File: web-portal/src/services/systemRoleService.ts

Features:
- Base URL: /api/v1/systems
- Use useQuery/useMutation hooks from React Query (TanStack)
- Implement error handling with proper error codes

Methods/Functions:

1. fetchAllRoles(systemId: string, params?: {page, size}): Promise<Page<SystemRole>>
   - Endpoint: GET /api/v1/systems/{systemId}/roles

2. fetchRoleById(systemId: string, roleId: string): Promise<SystemRole>
   - Endpoint: GET /api/v1/systems/{systemId}/roles/{roleId}

3. createRole(systemId: string, data: CreateSystemRolePayload): Promise<SystemRole>
   - Endpoint: POST /api/v1/systems/{systemId}/roles

4. updateRole(systemId: string, roleId: string, data: UpdateSystemRolePayload): Promise<SystemRole>
   - Endpoint: PUT /api/v1/systems/{systemId}/roles/{roleId}

5. deleteRole(systemId: string, roleId: string): Promise<void>
   - Endpoint: DELETE /api/v1/systems/{systemId}/roles/{roleId}

6. addActionToRole(systemId: string, roleId: string, data: AddActionPayload): Promise<SystemRoleAction>
   - Endpoint: POST /api/v1/systems/{systemId}/roles/{roleId}/actions

7. removeActionFromRole(systemId: string, roleId: string, actionId: string): Promise<void>
   - Endpoint: DELETE /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}

8. defineActionScope(systemId: string, roleId: string, actionId: string, scopes: ScopeDefinition[]): Promise<ScopeDefinition[]>
   - Endpoint: POST /api/v1/systems/{systemId}/roles/{roleId}/actions/{actionId}/scopes

Interfaces:
```typescript
interface SystemRole {
  systemRoleId: string;
  systemId: string;
  code: string;
  name: string;
  description: string;
  roleType: 'BUILTIN' | 'CUSTOM';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  actions?: SystemRoleAction[];
}

interface SystemRoleAction {
  systemRoleActionId: string;
  systemSectionActionId: string;
  actionCode: string;
  actionName: string;
  actionEffect: 'ALLOW' | 'DENY' | 'NONE';
  orderIndex: number;
  scopes?: SystemRoleActionScope[];
}

interface SystemRoleActionScope {
  systemRoleActionScopeId: string;
  codeTableId: string;
  codeTableName: string;
  orderIndex: number;
}

interface CreateSystemRolePayload {
  code: string;
  name: string;
  description?: string;
  roleType: 'BUILTIN' | 'CUSTOM';
}

interface UpdateSystemRolePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

interface AddActionPayload {
  systemSectionActionId: string;
  actionEffect: 'ALLOW' | 'DENY' | 'NONE';
  orderIndex?: number;
}

interface ScopeDefinition {
  codeTableId: string;
  orderIndex: number;
}
```

Use axios instance configured in your existing config.
Implement proper error handling and loading states.
```

---

### Prompt 10: Create React Components for Role Management
**Location**: `web-portal/src/modules/cms/pages/systems/roles/`

**Prompt for SystemRoleList.tsx**:
```
Create a React component to display list of system roles with CRUD operations.

File: web-portal/src/modules/cms/pages/systems/roles/SystemRoleList.tsx

Features:
- Display table of roles for a system
- Columns: Code, Name, Type (BUILTIN/CUSTOM), Status, Actions
- Pagination support
- Search/filter by code or name
- Action buttons: View, Edit, Delete, Manage Actions
- Create new role button

Components/Libraries to use:
- Ant Design Table component (ant.design/components/table)
- TanStack Query (useQuery, useMutation)
- systemRoleService for API calls

States to manage:
- Loading state while fetching roles
- Selected system from route params
- Pagination (page, size)
- Filters (search term, show inactive)
- Modal visibility for CRUD operations

Functions to implement:

1. loadRoles(systemId, page, size): void
   - Call systemRoleService.fetchAllRoles()
   - Update table data

2. handleCreate(): void
   - Open CreateSystemRoleModal

3. handleEdit(role): void
   - Open UpdateSystemRoleModal with role data

4. handleDelete(roleId): void
   - Show confirmation
   - Call systemRoleService.deleteRole()
   - Refresh list

5. handleManageActions(roleId): void
   - Navigate to RoleActionManager page

6. handleSearch(searchTerm): void
   - Filter roles by name/code
   - Support debounced search

7. handlePageChange(page, pageSize): void
   - Update pagination
   - Reload roles

Columns config:
[
  {title: 'Code', dataIndex: 'code', key: 'code', width: 150},
  {title: 'Name', dataIndex: 'name', key: 'name', width: 200},
  {title: 'Type', dataIndex: 'roleType', key: 'roleType', render: renderRoleType},
  {title: 'Status', dataIndex: 'isActive', key: 'isActive', render: renderStatus},
  {title: 'Actions', key: 'actions', render: (_, record) => renderActionButtons(record)}
]

Layout:
- Header with: System Name, "Create Role" button
- Search bar (code/name)
- Filters (Show Inactive toggle)
- Data table with pagination
- Modals (below):
  - CreateSystemRoleModal
  - UpdateSystemRoleModal
  - ConfirmDeleteModal
```

---

### Prompt 11: Create Role Edit/Create Modal
**Location**: `web-portal/src/modules/cms/pages/systems/roles/`

**Prompt for SystemRoleFormModal.tsx**:
```
Create a React modal component for creating and editing system roles.

File: web-portal/src/modules/cms/pages/systems/roles/SystemRoleFormModal.tsx

Props:
interface SystemRoleFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  systemId: string;
  initialData?: SystemRole;
  onSuccess: (role: SystemRole) => void;
  onCancel: () => void;
}

Features:
- Modal with form for creating/editing roles
- Fields:
  - Code (required, read-only in edit mode, pattern: [A-Z_0-9])
  - Name (required, 3-200 chars)
  - Description (optional, max 1000 chars)
  - Role Type (read-only, shows BUILTIN or CUSTOM)
  - Active (checkbox, disabled for BUILTIN roles)

Validation:
- Code: 3-100 chars, uppercase/underscore/numbers only, unique (check on blur)
- Name: 3-200 chars, not empty
- Description: max 1000 chars
- Show validation errors inline

Submit button:
- Disabled if form invalid
- Loading state while submitting
- On success: call onSuccess callback, close modal
- On error: show error message in modal

Use:
- Ant Design Form component
- FormItem with rules for validation
- Input, InputNumber, Checkbox components
- Button with loading state
```

---

### Prompt 12: Create Role Action Manager
**Location**: `web-portal/src/modules/cms/pages/systems/roles/`

**Prompt for RoleActionManager.tsx**:
```
Create a React page component for managing actions and scopes within a role.

File: web-portal/src/modules/cms/pages/systems/roles/RoleActionManager.tsx

This page allows:
1. View all actions assigned to a role
2. Add new actions to the role
3. Remove actions from the role
4. Configure scope hierarchy for each action

Route: /systems/{systemId}/roles/{roleId}/actions

Features:
- Two-panel layout:
  LEFT PANEL: List of assigned actions
  RIGHT PANEL: Configure scopes for selected action

Left Panel (Actions List):
- Table showing:
  - Action Code, Action Name
  - Effect (ALLOW/DENY/NONE) as colored badge
  - Order Index
  - Delete button
- "Add Action" button at top
- Search/filter by action name

Right Panel (Scope Configuration):
- Shows selected action details
- List of scope levels with drag-and-drop to reorder
- Each scope shows:
  - Level number (1, 2, 3...)
  - Code Table name
  - Delete button
- "Add Scope Level" button
- "Save Scopes" button

Functions:

1. loadRoleActions(): void
   - Fetch all actions for this role
   - Display in left panel

2. selectAction(action): void
   - Load scope hierarchy for selected action
   - Display in right panel

3. handleAddAction(): void
   - Open modal to select action and effect
   - Modal lists all available actions
   - User selects action + effect (ALLOW/DENY/NONE)
   - Call API to add action

4. handleRemoveAction(actionId): void
   - Show confirmation
   - Call API to remove action
   - Refresh action list

5. handleAddScopeLevel(): void
   - Open modal to select code table
   - User chooses code table (Countries, Cities, Branches, etc.)
   - Add to scope list

6. handleRemoveScopeLevel(scopeId): void
   - Remove from scope list

7. handleReorderScopes(newOrder): void
   - Update orderIndex for each scope
   - Update UI

8. handleSaveScopes(): void
   - Call systemRoleService.defineActionScope()
   - Show success message
   - Reload scopes

UI Components:
- Split layout: Splitter component
- Tables for actions and scopes
- Modal for selecting code tables
- Modal for selecting actions
- Drag-and-drop for reordering (react-beautiful-dnd)
```

---

### Prompt 13: Create User Role Assignment Component
**Location**: `web-portal/src/modules/cms/pages/users/`

**Prompt for UserRoleAssignment.tsx**:
```
Create a React component for assigning system roles to a user.

File: web-portal/src/modules/cms/pages/users/UserRoleAssignment.tsx

This is a tab/section in the UserDetail page that allows:
1. View all roles assigned to user in this tenant
2. Assign new roles to user
3. Remove roles from user
4. Configure scope overrides for role

Route: /users/{userId}/tenant/{tenantId}/roles

Features:
- Dropdown to select system
- List of roles assigned in that system
- Each role shows:
  - Role Name
  - System Name
  - Assigned Date
  - Expires At (if applicable)
  - Remove button
  - "Manage Overrides" button
- "Assign New Role" button

Functions:

1. loadUserRoles(userId, tenantId, systemId): void
   - Fetch all roles assigned to user
   - Display in list

2. handleSelectSystem(systemId): void
   - Load roles for that system
   - Refresh list

3. handleAssignRole(): void
   - Open modal to select role
   - Modal shows all available roles in system
   - User selects role
   - Optional: set expiration date
   - Call API to assign role
   - Refresh list

4. handleRemoveRole(userRoleId): void
   - Show confirmation
   - Call API to remove role
   - Refresh list

5. handleManageOverrides(userRoleId, roleId): void
   - Navigate to ScopeOverrideManager
   - Pass userRoleId and roleId

Response DTO for user roles:
```typescript
interface UserSystemRole {
  userSystemRoleId: string;
  userId: string;
  tenantId: string;
  systemRoleId: string;
  roleName: string;
  roleCode: string;
  systemName: string;
  assignedAt: string;
  expiresAt?: string;
}
```

UI:
- Ant Design Select for system
- Table for user's roles
- Buttons for assign/remove
- Modal for assigning roles
```

---

### Prompt 14: Create Scope Override Manager
**Location**: `web-portal/src/modules/cms/pages/users/`

**Prompt for ScopeOverrideManager.tsx**:
```
Create a React component for managing scope-specific permission overrides for user role assignments.

File: web-portal/src/modules/cms/pages/users/ScopeOverrideManager.tsx

This page allows fine-grained override of scope permissions for a user who has a role.

Route: /users/{userId}/roles/{userRoleId}/overrides

Features:
- Display role details (name, system, assigned date)
- List of role actions with their scope hierarchy
- For each action, show a tree of scope values:
  - Level 1: Countries (expand/collapse)
    - Egypt
      - Cairo
        - Central Hospital
      - Alexandria
        - Coastal Hospital
- Use checkboxes to ALLOW/DENY specific nodes
- Save button to persist changes

Example hierarchy:
```
Appointment.APPROVE
├── Egypt (Country)
│   ├── Cairo (City)
│   │   ├── Central Hospital (Branch) [ALLOW]
│   │   └── East Cairo (Branch) [DENY]
│   └── Alexandria (City)
│       └── Coastal Hospital (Branch) [ALLOW]
└── Sudan (Country)
    └── Khartoum (City)
        └── Main Hospital (Branch) [ALLOW]
```

Functions:

1. loadRoleDetails(): void
   - Fetch role with actions and scopes
   - Build hierarchy tree

2. loadExistingOverrides(): void
   - Fetch user role permission nodes
   - Mark existing ALLOW/DENY on tree

3. handleToggleScope(actionId, codeTableValueId, effect): void
   - Update tree node with effect
   - Mark as modified

4. handleSaveOverrides(): void
   - Call API to set permission nodes
   - Show success message
   - Navigate back

5. buildScopeTree(actionId): TreeNode
   - Fetch code table values for each scope level
   - Build nested tree structure
   - Return tree nodes for rendering

UI Components:
- Tree component for scope hierarchy
- Checkboxes for ALLOW/DENY at each node
- Save/Cancel buttons
- Loading states
```

---

### Prompt 15: Create Navigation Menu Integration
**Location**: `web-portal/src/modules/cms/routes.jsx`

**Prompt for Update CMS Routes to include SystemRole**:
```
Update the CMS routing configuration to include SystemRole management pages.

File: web-portal/src/modules/cms/routes.jsx

Add new routes under Systems section:

```jsx
{
  path: '/systems/:systemId/roles',
  element: <SystemRoleList />,
  name: 'System Roles',
  breadcrumb: ['Systems', 'Roles']
},
{
  path: '/systems/:systemId/roles/:roleId',
  element: <SystemRoleDetail />,
  name: 'Role Details',
  breadcrumb: ['Systems', 'Roles', 'Details']
},
{
  path: '/systems/:systemId/roles/:roleId/actions',
  element: <RoleActionManager />,
  name: 'Role Actions',
  breadcrumb: ['Systems', 'Roles', 'Actions']
},
```

Update User routes:

```jsx
{
  path: '/users/:userId/tenant/:tenantId/roles',
  element: <UserRoleAssignment />,
  name: 'User Roles',
  breadcrumb: ['Users', 'Roles']
},
{
  path: '/users/:userId/roles/:userRoleId/overrides',
  element: <ScopeOverrideManager />,
  name: 'Scope Overrides',
  breadcrumb: ['Users', 'Roles', 'Overrides']
},
```

Also update navigation menu to include:
- Link to System Roles under System Settings
- Link to User Roles under User Management
```

---

### Prompt 16: Create Internationalization (i18n) Messages
**Location**: `web-portal/src/locales/`

**Prompt for Add i18n messages for SystemRole**:
```
Add English and Arabic translations for SystemRole CRUD operations.

Files:
- web-portal/src/locales/en.json
- web-portal/src/locales/ar.json

English messages to add:
```json
{
  "pages.systems.roles.title": "System Roles",
  "pages.systems.roles.subtitle": "Manage roles and their permissions",
  "pages.systems.roles.create": "Create Role",
  "pages.systems.roles.edit": "Edit Role",
  "pages.systems.roles.delete": "Delete Role",
  "pages.systems.roles.manage-actions": "Manage Actions",
  "pages.systems.roles.columns.code": "Code",
  "pages.systems.roles.columns.name": "Name",
  "pages.systems.roles.columns.type": "Type",
  "pages.systems.roles.columns.status": "Status",
  "pages.systems.roles.form.code.label": "Role Code",
  "pages.systems.roles.form.code.required": "Role code is required",
  "pages.systems.roles.form.code.pattern": "Code must contain only uppercase letters, numbers, and underscores",
  "pages.systems.roles.form.name.label": "Role Name",
  "pages.systems.roles.form.name.required": "Role name is required",
  "pages.systems.roles.form.description.label": "Description",
  "pages.systems.roles.form.type.label": "Type",
  "pages.systems.roles.form.type.builtin": "System Role (Read-only)",
  "pages.systems.roles.form.type.custom": "Custom Role",
  "pages.systems.roles.form.isActive.label": "Active",
  "pages.systems.roles.actions.title": "Role Actions",
  "pages.systems.roles.actions.add": "Add Action",
  "pages.systems.roles.actions.remove": "Remove Action",
  "pages.systems.roles.actions.columns.action": "Action",
  "pages.systems.roles.actions.columns.effect": "Effect",
  "pages.systems.roles.actions.columns.scopes": "Scope Hierarchy",
  "pages.systems.roles.scopes.title": "Define Scope Hierarchy",
  "pages.systems.roles.scopes.add": "Add Scope Level",
  "pages.systems.roles.scopes.remove": "Remove Scope Level",
  "pages.users.roles.title": "User Roles",
  "pages.users.roles.assign": "Assign Role",
  "pages.users.roles.revoke": "Revoke Role",
  "pages.users.roles.columns.role": "Role",
  "pages.users.roles.columns.system": "System",
  "pages.users.roles.columns.assignedAt": "Assigned Date",
  "pages.users.roles.overrides": "Manage Overrides",
  "messages.success.role-created": "Role created successfully",
  "messages.success.role-updated": "Role updated successfully",
  "messages.success.role-deleted": "Role deleted successfully",
  "messages.success.action-added": "Action added to role successfully",
  "messages.success.action-removed": "Action removed from role successfully",
  "messages.success.role-assigned": "Role assigned to user successfully",
  "messages.success.role-revoked": "Role revoked from user successfully",
  "messages.error.role-create-failed": "Failed to create role",
  "messages.error.role-not-found": "Role not found",
  "messages.error.duplicate-role-code": "A role with this code already exists"
}
```

Arabic messages (RTL support):
- Mirror the above messages with Arabic translations
- Ensure RTL layout compatibility
```

---

## Summary of Implementation Order

1. **Backend Phase 1**: Command & Query Classes (Prompts 1-2)
2. **Backend Phase 2**: Validators (Prompt 5)
3. **Backend Phase 3**: Domain Models (Prompt 6)
4. **Backend Phase 4**: Mappers (Prompt 4)
5. **Backend Phase 5**: Services (Prompt 3)
6. **Backend Phase 6**: REST Controllers (Prompts 7-8)
7. **Frontend Phase 1**: API Service (Prompt 9)
8. **Frontend Phase 2**: Components (Prompts 10-14)
9. **Frontend Phase 3**: Routing & i18n (Prompts 15-16)

---

## Testing Prompts

### Backend Testing
```
Create unit tests for SystemRoleServiceImpl:

Test cases:
1. Create role successfully
2. Create role with duplicate code - should fail
3. Update role successfully
4. Cannot update BUILTIN role - should fail
5. Add action to role successfully
6. Add duplicate action - should fail
7. Define scope hierarchy successfully
8. Scope with invalid orderIndex - should fail
9. Delete role and cascade delete actions/scopes
10. Query user roles in system successfully

Use JUnit 5, Mockito, and AssertJ
```

### Frontend Testing
```
Create unit tests for SystemRoleList component:

Test cases using React Testing Library and Vitest:
1. Renders role list with data
2. Pagination works correctly
3. Search filters roles by name
4. Delete role shows confirmation
5. Edit button opens modal
6. Create button opens modal
7. Loading state displays
8. Error state displays with retry

Mock systemRoleService API calls
```

---

**Document Created**: 2025-11-04
**Status**: Ready for Implementation

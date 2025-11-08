# SystemRole Architecture - Visual Guide

## Complete System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WEB PORTAL (React/TypeScript)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────┐    ┌──────────────────────────┐              │
│  │  SystemRoleList.tsx      │    │ UserRoleAssignment.tsx   │              │
│  │  - List roles            │    │ - View user roles        │              │
│  │  - Search/Filter         │    │ - Assign/Revoke roles    │              │
│  │  - CRUD buttons          │    │ - Manage overrides       │              │
│  └──────────────────────────┘    └──────────────────────────┘              │
│           │                                │                                 │
│           ▼                                ▼                                 │
│  ┌──────────────────────────┐    ┌──────────────────────────┐              │
│  │ SystemRoleFormModal.tsx  │    │RoleActionManager.tsx     │              │
│  │ - Create role            │    │- Add/Remove actions      │              │
│  │ - Edit role              │    │- Configure scopes        │              │
│  └──────────────────────────┘    └──────────────────────────┘              │
│                                           │                                  │
│                                           ▼                                  │
│                                 ┌──────────────────────────┐                │
│                                 │ScopeOverrideManager.tsx  │                │
│                                 │- Manage scope ALLOW/DENY │                │
│                                 │- Override role scopes    │                │
│                                 └──────────────────────────┘                │
│                                                                               │
└───────────────────────┬────────────────────────────────────────────────────┘
                        │ Axios (HTTP Calls)
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      systemRoleService.ts (API Layer)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  • fetchAllRoles(systemId)        • removeActionFromRole(...)               │
│  • fetchRoleById(systemId, roleId) • defineActionScope(...)                 │
│  • createRole(systemId, data)     • getActionScopes(...)                    │
│  • updateRole(systemId, ...)      • assignRoleToUser(...)                   │
│  • deleteRole(systemId, roleId)   • revokeRoleFromUser(...)                 │
│  • addActionToRole(...)                                                      │
│                                                                               │
└───────────────────────┬────────────────────────────────────────────────────┘
                        │ REST API Calls
                        │
        ┌───────────────┴───────────────┬──────────────────┐
        │                               │                  │
        ▼                               ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   ACCESS-MANAGEMENT-SERVICE (Java/Spring Boot)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  REST LAYER                                                                  │
│  ┌────────────────────────────────┐  ┌───────────────────────────────────┐ │
│  │ SystemRoleController           │  │ RoleActionController             │ │
│  │ GET/POST/PUT/DELETE /roles     │  │ GET/POST/DELETE /roles/actions   │ │
│  └────────────────────────────────┘  └───────────────────────────────────┘ │
│             │                                    │                          │
│             └────────────┬───────────────────────┘                          │
│                          │ (Inject)                                         │
│                          ▼                                                   │
│  APPLICATION LAYER                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     SystemRoleServiceImpl                            │  │
│  │  - beforeCreate(SystemRole)    - afterSave(SystemRole)             │  │
│  │  - beforeUpdate(SystemRole)    - notFound(UUID)                    │  │
│  │  - save(CreateSystemRoleCommand)                                    │  │
│  │  - update(UpdateSystemRoleCommand)                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│              ▲                                                               │
│              │ (Inject)                                                     │
│              │                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                  RoleActionManagementService                        │  │
│  │  - addActionToRole(AddActionToRoleCommand)                          │  │
│  │  - removeActionFromRole(UUID, UUID)                                 │  │
│  │  - defineActionScope(DefineActionScopeCommand)                      │  │
│  │  - updateRoleAction(UUID, UpdateRoleActionCommand)                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│              ▲                                                               │
│              │ (Inject)                                                     │
│              │                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                  RolePermissionQueryService                         │  │
│  │  - getUserRolesInSystem(userId, tenantId, systemId)                 │  │
│  │  - canUserPerformAction(userId, tenantId, actionId, scopes)         │  │
│  │  - getUserActionsByRole(userId, tenantId, roleId)                   │  │
│  │  - getRoleActionScopes(roleId, actionId)                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  VALIDATION LAYER                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ CreateSystemRoleValidator  │  UpdateSystemRoleValidator             │  │
│  │ ActionScopeValidator       │                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  MAPPER LAYER                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                  SystemRoleAppMapper (MapStruct)                    │  │
│  │  - toDomain(Command)   - toEntity(Domain)                           │  │
│  │  - toResponse(Domain)  - toDomain(Entity)                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  COMMAND/QUERY LAYER                                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ CreateSystemRoleCommand  │  GetSystemRoleByIdQuery                  │  │
│  │ UpdateSystemRoleCommand  │  GetAllSystemRolesQuery                  │  │
│  │ AddActionToRoleCommand   │  GetRoleActionsQuery                     │  │
│  │ DefineActionScopeCommand │  GetRoleActionScopesQuery                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  DOMAIN LAYER                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  SystemRole (Domain Model)   - Pure business logic                  │  │
│  │  RoleType: BUILTIN | CUSTOM  - Value object                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  REPOSITORY/PERSISTENCE LAYER                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SystemRoleRepository        │  SystemRoleActionRepository           │  │
│  │ SystemRoleActionScopeRepository                                      │  │
│  │ UserSystemRoleRepository    │  UserRolePermissionNodeRepository     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│              ▲                                                               │
│              │ (Inject)                                                     │
│              │                                                              │
└──────────────┼──────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────┐  ┌───────────────────────────┐                │
│  │   system_roles         │  │  system_role_actions      │                │
│  ├────────────────────────┤  ├───────────────────────────┤                │
│  │ • system_role_id (PK)  │  │ • system_role_action_id   │                │
│  │ • system_id (FK)       │◄─┤ • system_role_id (FK)     │                │
│  │ • code (UNIQUE)        │  │ • system_section_action_id│                │
│  │ • name                 │  │ • action_effect (ALLOW)   │                │
│  │ • description          │  │ • order_index             │                │
│  │ • role_type            │  └───────────────────────────┘                │
│  │ • is_active            │         │                                      │
│  │ • audit fields         │         ▼                                      │
│  └────────────────────────┘  ┌───────────────────────────┐                │
│         │                    │system_role_action_scopes  │                │
│         │                    ├───────────────────────────┤                │
│         │                    │ • system_role_action_id   │                │
│         │                    │ • code_table_id (FK)      │                │
│         │                    │ • order_index (hierarchy) │                │
│         │                    │ • audit fields            │                │
│         │                    └───────────────────────────┘                │
│         │                                                                   │
│         │    ┌────────────────────────┐                                    │
│         └───►│   user_system_roles    │                                    │
│              ├────────────────────────┤                                    │
│              │ • user_system_role_id  │                                    │
│              │ • user_id (FK)         │                                    │
│              │ • tenant_id            │                                    │
│              │ • system_role_id (FK)  │                                    │
│              │ • assigned_at          │                                    │
│              │ • expires_at           │                                    │
│              │ • audit fields         │                                    │
│              └────────────────────────┘                                    │
│                      │                                                      │
│                      ▼                                                      │
│              ┌────────────────────────────────────┐                        │
│              │ user_role_permission_nodes         │                        │
│              ├────────────────────────────────────┤                        │
│              │ • user_role_permission_node_id     │                        │
│              │ • user_system_role_id (FK)         │                        │
│              │ • system_section_action_id (FK)    │                        │
│              │ • code_table_value_id (FK)         │                        │
│              │ • effect (ALLOW/DENY)              │                        │
│              │ • scope_level                      │                        │
│              │ • audit fields                     │                        │
│              └────────────────────────────────────┘                        │
│                                                                               │
│  References to existing tables:                                             │
│  • system_roles.system_id ───► systems.system_id                           │
│  • system_role_actions.system_section_action_id ───► system_section_actions│
│  • system_role_action_scopes.code_table_id ───► code_table.code_table_id   │
│  • user_role_permission_nodes.code_table_value_id ───► code_table_value    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: Create SystemRole with Actions and Scopes

```
USER CLICKS "Create Role"
         │
         ▼
   ┌──────────────┐
   │ Modal Opens  │  (SystemRoleFormModal.tsx)
   └──────────────┘
         │
    User fills form:
    • Code: APPOINTMENT_READER
    • Name: Appointment Reader
    • Type: CUSTOM
         │
         ▼
   ┌──────────────────────────────┐
   │ Submit & Validate Form       │
   │ - Check code pattern         │
   │ - Check required fields      │
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ POST /api/v1/systems/{id}/roles
   │ Payload: CreateSystemRoleRequest
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ SystemRoleController         │
   │ .createRole()                │
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ SystemRoleServiceImpl         │
   │ .save(CreateSystemRoleCommand)
   └──────────────────────────────┘
         │
         ├─▶ beforeCreate()
         │   • Set createdById from context
         │   • Run validation
         │
         ├─▶ Map to Entity
         │   • Use SystemRoleAppMapper
         │
         ├─▶ Persist to DB
         │   • SystemRoleRepository.save()
         │
         └─▶ afterSave()
             • Audit log
             • Event publish
         │
         ▼
   ┌──────────────────────────────┐
   │ Role Created Successfully    │
   │ Return: SystemRoleResponse   │
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ RoleActionManager opens      │
   │ "Add Action" button          │
   └──────────────────────────────┘
         │
    User selects action:
    • Action: Appointment.VIEW
    • Effect: ALLOW
         │
         ▼
   ┌──────────────────────────────┐
   │ POST /api/v1/systems/.../    │
   │      roles/{roleId}/actions  │
   │ Payload: AddActionToRoleRequest
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ RoleActionController         │
   │ .addActionToRole()           │
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ RoleActionManagementService  │
   │ .addActionToRole()           │
   │ • Validate role exists       │
   │ • Validate action exists     │
   │ • Check no duplicate         │
   │ • Create SystemRoleAction    │
   │ • Persist                    │
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ Action Added to Role         │
   │ Return: SystemRoleActionResp │
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ User clicks "Define Scopes"  │
   │ for the action               │
   └──────────────────────────────┘
         │
    User selects scope hierarchy:
    • Level 1: Countries Table
    • Level 2: Cities Table
    • Level 3: Branches Table
         │
         ▼
   ┌──────────────────────────────┐
   │ POST /api/v1/systems/.../    │
   │      actions/{actionId}/scopes
   │ Payload: DefineActionScopeReq
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ RoleActionController         │
   │ .defineActionScope()         │
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ RoleActionManagementService  │
   │ .defineActionScope()         │
   │ • Validate scopes            │
   │ • Delete existing scopes     │
   │ • Create new scopes ordered  │
   │ • Persist all                │
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ Scopes Defined Successfully  │
   │ Role Ready for Assignment    │
   └──────────────────────────────┘
```

### Flow 2: Assign Role to User with Scope Overrides

```
ADMIN OPENS USER DETAIL PAGE
         │
         ▼
   ┌──────────────────────────┐
   │ UserRoleAssignment Tab   │
   │ Shows existing roles     │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ Click "Assign Role"      │
   │ Button                   │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ Modal: Select Role       │
   │ Shows available roles    │
   │ in selected system       │
   └──────────────────────────┘
         │
    Admin selects:
    • System: Appointment System
    • Role: Appointment Reader
    • Optional: Expiration date
         │
         ▼
   ┌──────────────────────────┐
   │ POST /api/v1/users/      │
   │ {userId}/tenant/{tid}/   │
   │ roles                    │
   │ Payload: {systemRoleId}  │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ UserRoleController       │
   │ (to be created)          │
   │ .assignRoleToUser()      │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ UserRoleAssignmentService│
   │ (to be created)          │
   │ • Validate user exists   │
   │ • Validate role exists   │
   │ • Check no duplicate     │
   │ • Create UserSystemRole  │
   │ • Persist                │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ Role Assigned to User    │
   │ Display in list          │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ Admin clicks "Manage     │
   │ Overrides" for role      │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ ScopeOverrideManager     │
   │ Page loads               │
   │ • Displays role details  │
   │ • Shows actions from role│
   │ • Builds scope tree      │
   │ • Loads existing overrides
   └──────────────────────────┘
         │
    Admin navigates tree:
    • Egypt ─► Cairo ─► Central Hospital
    - By default: ALLOW (from role)
    - Admin DENIES this branch
         │
         ▼
   ┌──────────────────────────┐
   │ POST /api/v1/users/      │
   │ {userId}/roles/{uId}/    │
   │ overrides                │
   │ Payload: {              │
   │   actionId,             │
   │   codeTableValueId,     │
   │   effect: 'DENY'        │
   │ }                        │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ UserRoleController       │
   │ .setPermissionOverride() │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ UserRoleAssignmentService│
   │ • Validate override      │
   │ • Create or update node  │
   │ • Persist                │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ Override Saved           │
   │ Tree updates with DENY   │
   └──────────────────────────┘
```

### Flow 3: Permission Check at Runtime

```
USER MAKES REQUEST TO API
(e.g., POST /api/appointments/approve)
         │
         ▼
   ┌──────────────────────────┐
   │ API Gateway              │
   │ Extracts JWT token       │
   │ Gets: userId, tenantId   │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ Authorization Filter     │
   │ Calls PermissionQuery    │
   │ Service                  │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ PermissionQueryService   │
   │ .canUserPerformAction()  │
   │                          │
   │ 1. Get user roles        │
   │ Query: SELECT * FROM     │
   │ user_system_roles WHERE  │
   │ user_id = ? AND          │
   │ tenant_id = ? AND        │
   │ is_active = true         │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ For each role:           │
   │ 2. Check action exists   │
   │ Query: SELECT * FROM     │
   │ system_role_actions WHERE│
   │ system_role_id = ? AND   │
   │ system_section_action_id │
   │ = ? AND action_effect    │
   │ = 'ALLOW'                │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ If action found:         │
   │ 3. Get scope hierarchy   │
   │ Query: SELECT * FROM     │
   │ system_role_action_scopes│
   │ WHERE system_role_action │
   │ _id = ? ORDER BY         │
   │ order_index              │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ 4. Check user overrides  │
   │ Query: SELECT * FROM     │
   │ user_role_permission_    │
   │ nodes WHERE              │
   │ user_system_role_id = ?  │
   │ AND system_section_action│
   │ _id = ?                  │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ 5. Evaluate scopes       │
   │ • If user has DENY       │
   │   override for scope:    │
   │   DENY (secure default)  │
   │ • If scope hierarchy:    │
   │   Validate all levels    │
   │   match provided scopes  │
   │ • Otherwise: ALLOW       │
   └──────────────────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ Decision Made:           │
   │ ALLOW or DENY            │
   └──────────────────────────┘
         │
         ├─▶ ALLOW ──▶ Request proceeds
         │            to business logic
         │
         └─▶ DENY  ──▶ Return 403 Forbidden
                      with error message
```

---

## Database Schema Relationship Diagram

```
                 ┌─────────────────────────┐
                 │      systems            │
                 │  (existing table)       │
                 │─────────────────────────│
                 │ • system_id (PK)        │
                 │ • code                  │
                 │ • name                  │
                 └─────────────────────────┘
                          ▲
                          │ 1:N (FK)
                          │
                 ┌─────────────────────────┐
                 │  system_roles           │
                 │─────────────────────────│
                 │ • system_role_id (PK)   │
                 │ • system_id (FK)        │
                 │ • code (UQ)             │
                 │ • name                  │
                 │ • role_type             │
                 │ • is_active             │
                 └─────────────────────────┘
                   ▲         ▲          ▲
          1:N (FK) │         │          │ 1:N (FK)
                   │         │          │
        ┌──────────┴──┐      │          └────────┐
        │             │      │                   │
    ┌─────────────────────────────┐    ┌────────────────────┐
    │ system_role_actions         │    │user_system_roles   │
    │─────────────────────────────│    │────────────────────│
    │ • system_role_action_id(PK) │    │•user_system_role_id│
    │ • system_role_id (FK)       │    │•user_id            │
    │ • system_section_action_id  │    │•tenant_id          │
    │ • action_effect             │    │•system_role_id(FK) │
    │ • order_index               │    │•assigned_at        │
    └─────────────────────────────┘    │•expires_at         │
                │                       └────────────────────┘
                │ 1:N (FK)                       │
                │                                │ 1:N (FK)
                ▼                                ▼
    ┌────────────────────────────────────────────────────────┐
    │ system_role_action_scopes                              │
    │────────────────────────────────────────────────────────│
    │ • system_role_action_scope_id (PK)                     │
    │ • system_role_action_id (FK)                           │
    │ • code_table_id (FK)  ──┐                              │
    │ • order_index           │                              │
    └────────────────────────────────────────────────────────┘
                                │
                                ▼
                   ┌─────────────────────────┐
                   │  code_table             │
                   │  (existing table)       │
                   │─────────────────────────│
                   │ • code_table_id (PK)    │
                   │ • name                  │
                   └─────────────────────────┘
                            ▲
                            │ 1:N (FK)
                            │
                   ┌─────────────────────────┐
                   │  code_table_value       │
                   │  (existing table)       │
                   │─────────────────────────│
                   │ • code_table_value_id   │
                   │ • code_table_id (FK)    │
                   │ • name                  │
                   │ • parent_id             │
                   └─────────────────────────┘
                            ▲
                            │ 1:N (FK)
                            │
    ┌───────────────────────────────────────────────────────────┐
    │ user_role_permission_nodes                                │
    │───────────────────────────────────────────────────────────│
    │ • user_role_permission_node_id (PK)                       │
    │ • user_system_role_id (FK)                                │
    │ • system_section_action_id (FK)                           │
    │ • code_table_value_id (FK)                                │
    │ • effect (ALLOW/DENY)                                     │
    │ • scope_level                                             │
    └───────────────────────────────────────────────────────────┘
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│    SystemRoleList           RoleActionManager       UserRole    │
│    ┌──────────────┐         ┌──────────────┐      Assignment    │
│    │  List roles  │ ───────▶│ Manage       │         ┌────────┐ │
│    │ (systems page)│         │ actions/     │ ───────▶│Assign  │ │
│    └──────────────┘         │ scopes       │         │roles   │ │
│         │                    └──────────────┘         └────────┘ │
│         │                             │                   │      │
│         ├─▶ SystemRoleFormModal      │                   │      │
│         │   ┌──────────────────┐     │                   │      │
│         └──▶│ Create/Edit Role │     │                   │      │
│             └──────────────────┘     │                   │      │
│                                      ▼                   ▼      │
│                           ScopeOverrideManager              │    │
│                           ┌────────────────┐               │    │
│                           │ Override scope │◄──────────────┘    │
│                           │ permissions    │                    │
│                           └────────────────┘                    │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ Calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    systemRoleService.ts                          │
├─────────────────────────────────────────────────────────────────┤
│  API Service Layer - Axios based                                │
│  • Handles HTTP requests/responses                              │
│  • Error handling                                               │
│  • Query caching (React Query)                                  │
│  • Loading/Error states                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (REST)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot Backend                           │
├─────────────────────────────────────────────────────────────────┤
│  Controllers         Services           Repositories            │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │SystemRole    │──▶│SystemRole    │──▶│SystemRole    │        │
│  │Controller    │   │ServiceImpl    │   │Repository    │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│         │                   │                   │               │
│         └─────────┬─────────┴───────┬───────────┘               │
│                   │                 │                           │
│  ┌──────────────┐ │   ┌──────────┐  │  ┌──────────────┐        │
│  │RoleAction    │ └──▶│RoleAction│──▶  │RoleAction    │        │
│  │Controller    │     │Management│  └──│Repository    │        │
│  └──────────────┘     │Service   │     └──────────────┘        │
│                       └──────────┘                              │
│                                                                 │
│  Validators          Mappers           Domain Models           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │CreateValidator  │SystemRole    │   │SystemRole    │        │
│  │UpdateValidator  │AppMapper     │   │(Domain Model)│        │
│  │ActionScope   │   └──────────────┘   └──────────────┘        │
│  │Validator     │                                              │
│  └──────────────┘                                              │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ JDBC
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                            │
├─────────────────────────────────────────────────────────────────┤
│  5 Tables with 23 indexes                                       │
│  • system_roles                                                 │
│  • system_role_actions                                          │
│  • system_role_action_scopes                                    │
│  • user_system_roles                                            │
│  • user_role_permission_nodes                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Management Flow (Frontend)

```
React Query Cache
├── getRoles(systemId)
│   └── Cached: List<SystemRole>
│
├── getRole(systemId, roleId)
│   └── Cached: SystemRole with actions & scopes
│
├── getRoleActions(systemId, roleId)
│   └── Cached: List<SystemRoleAction>
│
├── getActionScopes(systemId, roleId, actionId)
│   └── Cached: List<SystemRoleActionScope>
│
└── getUserRoles(userId, tenantId)
    └── Cached: List<UserSystemRole>


Component Local State
├── SystemRoleList
│   ├── loading: boolean
│   ├── roles: SystemRole[]
│   ├── pagination: {page, size}
│   ├── searchTerm: string
│   ├── showInactive: boolean
│   └── selectedRole: SystemRole | null
│
├── RoleActionManager
│   ├── roleActions: SystemRoleAction[]
│   ├── selectedAction: SystemRoleAction | null
│   ├── actionScopes: SystemRoleActionScope[]
│   ├── isEditingScopes: boolean
│   └── scopesChanged: boolean
│
└── ScopeOverrideManager
    ├── scopeTree: TreeNode[]
    ├── expandedNodes: Set<string>
    ├── overridesMap: Map<string, PermissionEffect>
    └── unsavedChanges: boolean
```

---

This visual guide provides a complete picture of how SystemRole architecture fits together across the entire stack.

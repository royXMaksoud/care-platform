# Roles Module

This module manages system roles and their assignments to users.

## Directory Structure

```
roles/
├── SystemRolesList.jsx       # Main list page with CRUD operations
├── SystemRoleDetails.jsx     # Detailed view of a single role
├── SystemRoleFormModal.jsx   # Form modal for creating/editing roles
├── UserRolesTab.jsx          # Tab component for managing user roles
├── routes.jsx                # Route definitions
└── README.md                 # This file
```

## Components

### SystemRolesList
List of all system roles with ability to create, edit, and delete roles.
- Route: `/cms/roles`
- Requires: CMS_SECTIONS.ROLES permission

### SystemRoleDetails
Detailed view of a single role including its permissions and scopes.
- Route: `/cms/roles/:roleId`
- Displays: Role info, assigned permissions, and scope configurations

### SystemRoleFormModal
Reusable modal form for creating or editing a system role.
- Used by: SystemRolesList and SystemRoleDetails

### UserRolesTab
Tab component in the UserDetail page for managing which roles are assigned to a user.
- Location: UserDetail page > Roles tab
- Functionality: Assign/remove roles from users

## Usage

### Integration with UserDetail
The UserRolesTab is integrated into the UserDetail page as a tab:

```jsx
import UserRolesTab from '../roles/UserRolesTab'

// In UserDetail component:
<button onClick={() => setTab('roles')}>Roles</button>
{tab === 'roles' && <UserRolesTab userId={userId} />}
```

### Routing
Add the role routes to your main routing configuration:

```jsx
import { rolesRoutes } from '@/modules/cms/pages/roles/routes'

const allRoutes = [
  ...rolesRoutes,
  // other routes
]
```

## API Endpoints

- `GET /access/api/system-roles` - List all roles
- `GET /access/api/system-roles/:id` - Get role details
- `POST /access/api/system-roles` - Create new role
- `PUT /access/api/system-roles/:id` - Update role
- `DELETE /access/api/system-roles/:id` - Delete role
- `POST /access/api/user-roles/:userId` - Assign role to user
- `DELETE /access/api/user-roles/:userId/:roleId` - Remove role from user

## Permissions

Role management uses the following permission constants:
- `SYSTEMS.CMS` - System identifier
- `CMS_SECTIONS.ROLES` - Section identifier for role management

Required permissions: canCreate, canUpdate, canDelete, canList

/**
 * PERMISSIONS USAGE EXAMPLES
 * 
 * This file contains practical examples of how to use the usePermissions hook
 * in different scenarios for CRUD operations.
 */

import React from 'react'
import { usePermissions } from '../hooks/usePermissions'
import { Button } from '../components/ui/button'

// ============================================
// EXAMPLE 1: Simple CRUD Table with Permissions
// ============================================
export function UsersTable() {
  const { canList, canCreate, canUpdate, canDelete, isLoading } = usePermissions()

  if (isLoading) {
    return <div>Loading permissions...</div>
  }

  // If user doesn't have 'list' permission, don't show the table
  if (!canList()) {
    return <div>You don't have permission to view users.</div>
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2>Users Management</h2>
        
        {/* Show Create button only if user has 'create' permission */}
        {canCreate() && (
          <Button onClick={() => console.log('Create user')}>
            Create New User
          </Button>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>John Doe</td>
            <td>john@example.com</td>
            <td>
              {/* Show Edit button only if user has 'update' permission */}
              {canUpdate() && (
                <Button size="sm" onClick={() => console.log('Edit')}>
                  Edit
                </Button>
              )}
              
              {/* Show Delete button only if user has 'delete' permission */}
              {canDelete() && (
                <Button size="sm" variant="destructive" onClick={() => console.log('Delete')}>
                  Delete
                </Button>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ============================================
// EXAMPLE 2: Permissions with Specific Action Codes
// ============================================
export function AppointmentsPage() {
  const { hasPermission } = usePermissions()

  // Check for specific action codes from your backend
  const canViewAppointments = hasPermission('list')
  const canCreateAppointment = hasPermission('create')
  const canUpdateAppointment = hasPermission('update')
  const canCancelAppointment = hasPermission('cancel')  // Custom action

  if (!canViewAppointments) {
    return <div>No access to appointments</div>
  }

  return (
    <div>
      <h1>Appointments</h1>
      
      {canCreateAppointment && (
        <Button>Book New Appointment</Button>
      )}

      <div className="appointments-list">
        {/* Appointment items */}
        <div className="appointment-item">
          <p>Appointment with Dr. Smith</p>
          
          {canUpdateAppointment && <Button size="sm">Reschedule</Button>}
          {canCancelAppointment && <Button size="sm" variant="destructive">Cancel</Button>}
        </div>
      </div>
    </div>
  )
}

// ============================================
// EXAMPLE 3: Scope-Based Permissions (Gender Filter Example)
// ============================================
export function PatientsList() {
  const { hasPermission, canUpdate } = usePermissions()

  // Example: User has permission to update only Female patients
  const femaleGenderId = 'b9002472-a2c2-4f62-9a9f-7571ccdb7fde' // From your data
  const maleGenderId = '4cb34397-aba7-4b3d-8d72-627c2d107d70'   // From your data

  const patients = [
    { id: 1, name: 'Sara Ali', gender: 'Female', genderId: femaleGenderId },
    { id: 2, name: 'Ahmad Hassan', gender: 'Male', genderId: maleGenderId },
  ]

  return (
    <div>
      <h2>Patients List</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Gender</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(patient => {
            // Check if user has update permission for this specific gender scope
            const canUpdateThisPatient = canUpdate(patient.genderId)

            return (
              <tr key={patient.id}>
                <td>{patient.name}</td>
                <td>{patient.gender}</td>
                <td>
                  {/* Show edit button only if user has permission for this patient's gender */}
                  {canUpdateThisPatient ? (
                    <Button size="sm">Edit</Button>
                  ) : (
                    <span className="text-gray-400">No permission</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ============================================
// EXAMPLE 4: Multiple Permissions Check
// ============================================
export function AdminPanel() {
  const { hasPermissions, hasAllPermissions, hasAnyPermission } = usePermissions()

  // Check multiple permissions at once
  const perms = hasPermissions(['create', 'update', 'delete', 'list'])
  
  // Check if user has ALL permissions (full admin)
  const isFullAdmin = hasAllPermissions(['create', 'update', 'delete', 'list'])
  
  // Check if user has ANY permission (partial access)
  const hasAnyAccess = hasAnyPermission(['create', 'update', 'delete', 'list'])

  return (
    <div>
      <h2>Admin Panel</h2>
      
      {isFullAdmin && (
        <div className="bg-green-100 p-4 mb-4">
          <p>✓ You have full admin access</p>
        </div>
      )}

      <div className="permissions-grid">
        <div>
          <strong>Create:</strong> {perms.create ? '✓ Yes' : '✗ No'}
        </div>
        <div>
          <strong>Update:</strong> {perms.update ? '✓ Yes' : '✗ No'}
        </div>
        <div>
          <strong>Delete:</strong> {perms.delete ? '✓ Yes' : '✗ No'}
        </div>
        <div>
          <strong>List:</strong> {perms.list ? '✓ Yes' : '✗ No'}
        </div>
      </div>

      {!hasAnyAccess && (
        <div className="bg-red-100 p-4 mt-4">
          <p>You don't have any admin permissions</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// EXAMPLE 5: Conditional Form Fields
// ============================================
export function UserForm() {
  const { canUpdate, hasPermission } = usePermissions()

  // User can only edit certain fields based on permissions
  const canEditEmail = hasPermission('update_email')
  const canEditRole = hasPermission('update_role')
  const canResetPassword = hasPermission('reset_password')

  return (
    <form>
      <div>
        <label>Name</label>
        <input type="text" />
      </div>

      {/* Email field - only editable if user has permission */}
      <div>
        <label>Email</label>
        <input 
          type="email" 
          disabled={!canEditEmail}
          title={!canEditEmail ? 'You don\'t have permission to edit email' : ''}
        />
      </div>

      {/* Role field - only visible if user has permission */}
      {canEditRole && (
        <div>
          <label>Role</label>
          <select>
            <option>Admin</option>
            <option>User</option>
          </select>
        </div>
      )}

      {/* Reset password button - only visible if user has permission */}
      {canResetPassword && (
        <Button type="button" variant="outline">
          Reset Password
        </Button>
      )}

      {canUpdate() && (
        <Button type="submit">Save Changes</Button>
      )}
    </form>
  )
}

// ============================================
// EXAMPLE 6: System-Level Access Check
// ============================================
export function SystemsMenu() {
  const { accessibleSystems, canAccessSystem } = usePermissions()

  const appointmentsSystemId = '8cb8dee2-0ef0-42c2-89df-bd16734d8350' // From your data

  return (
    <nav>
      <h3>Available Systems</h3>
      <ul>
        {accessibleSystems.map(system => (
          <li key={system.systemId}>
            <a href={`/systems/${system.systemId}`}>
              {system.systemName}
              <span className="text-sm text-gray-500">
                ({system.allowedActions}/{system.totalActions} permissions)
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* Direct system check */}
      {canAccessSystem(appointmentsSystemId) && (
        <div>
          <a href="/appointments">Go to Appointments</a>
        </div>
      )}
    </nav>
  )
}

// ============================================
// EXAMPLE 7: Button Component with Permission Check
// ============================================
export function PermissionButton({ action, children, onClick, scopeValueId, ...props }) {
  const { hasPermission } = usePermissions()

  const allowed = hasPermission(action, scopeValueId)

  if (!allowed) {
    return null // Don't render button if no permission
  }

  return (
    <Button onClick={onClick} {...props}>
      {children}
    </Button>
  )
}

// Usage:
export function ExampleUsage() {
  return (
    <div>
      {/* Button will only appear if user has 'create' permission */}
      <PermissionButton action="create" onClick={() => console.log('Creating...')}>
        Create User
      </PermissionButton>

      {/* Button will only appear if user has 'update' permission for specific scope */}
      <PermissionButton 
        action="update" 
        scopeValueId="b9002472-a2c2-4f62-9a9f-7571ccdb7fde"
        onClick={() => console.log('Updating...')}
      >
        Update Female Patients
      </PermissionButton>
    </div>
  )
}

// ============================================
// EXAMPLE 8: Loading State Handling
// ============================================
export function ProtectedComponent() {
  const { canList, isLoading, error } = usePermissions()

  // Show loading state while fetching permissions
  if (isLoading) {
    return <div>Loading permissions...</div>
  }

  // Show error if permissions failed to load
  if (error) {
    return <div>Error loading permissions. Please refresh the page.</div>
  }

  // Show access denied if no permission
  if (!canList()) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded">
        <h3>Access Denied</h3>
        <p>You don't have permission to view this content.</p>
      </div>
    )
  }

  // User has permission - show content
  return (
    <div>
      <h2>Protected Content</h2>
      <p>This content is only visible to users with 'list' permission.</p>
    </div>
  )
}


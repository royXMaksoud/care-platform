/**
 * EXAMPLE: Code Table Page with Full CRUD Permissions
 * 
 * This is a complete example showing how to implement CRUD operations
 * with proper permission checks on every action.
 */

import React, { useState } from 'react'
import { usePermissionCheck } from '../contexts/PermissionsContext'
import { 
  SYSTEMS, 
  CMS_SECTIONS, 
  CODE_TABLE_ACTIONS 
} from '../config/permissions-constants'
import { Button } from '../components/ui/button'

/**
 * Code Table Page Component
 * Shows how to check permissions for:
 * - Viewing the page (List permission)
 * - Creating new records (Create permission)
 * - Editing records (Update permission)
 * - Deleting records (Delete permission)
 */
export default function CodeTablePage() {
  const { getSectionPermissions, hasPermission, isLoading } = usePermissionCheck()
  
  // Sample data
  const [tables, setTables] = useState([
    { id: 1, name: 'Gender', description: 'Gender types', status: 'Active' },
    { id: 2, name: 'Countries', description: 'Country list', status: 'Active' },
    { id: 3, name: 'Cities', description: 'City list', status: 'Inactive' },
  ])

  // Get all permissions for Code Table section
  const permissions = getSectionPermissions(
    CMS_SECTIONS.CODE_TABLE,
    SYSTEMS.CMS
  )

  // Specific permission checks using action codes
  const canListCodeTable = hasPermission(
    CODE_TABLE_ACTIONS.LIST,
    CMS_SECTIONS.CODE_TABLE
  )
  
  const canCreateCodeTable = hasPermission(
    CODE_TABLE_ACTIONS.CREATE,
    CMS_SECTIONS.CODE_TABLE
  )
  
  const canUpdateCodeTable = hasPermission(
    CODE_TABLE_ACTIONS.UPDATE,
    CMS_SECTIONS.CODE_TABLE
  )
  
  const canDeleteCodeTable = hasPermission(
    CODE_TABLE_ACTIONS.DELETE,
    CMS_SECTIONS.CODE_TABLE
  )

  // Handlers
  const handleCreate = () => {
    if (!canCreateCodeTable) {
      alert('You do not have permission to create code tables')
      return
    }
    console.log('Creating new code table...')
    // Your create logic here
  }

  const handleEdit = (table) => {
    if (!canUpdateCodeTable) {
      alert('You do not have permission to edit code tables')
      return
    }
    console.log('Editing table:', table)
    // Your edit logic here
  }

  const handleDelete = (tableId) => {
    if (!canDeleteCodeTable) {
      alert('You do not have permission to delete code tables')
      return
    }
    if (window.confirm('Are you sure you want to delete this table?')) {
      setTables(tables.filter(t => t.id !== tableId))
      console.log('Deleted table:', tableId)
    }
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading permissions...</div>
        </div>
      </div>
    )
  }

  // ============================================
  // NO LIST PERMISSION - ACCESS DENIED
  // ============================================
  if (!canListCodeTable || !permissions.canList) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-red-700">
            You don't have permission to view Code Tables.
            Please contact your administrator.
          </p>
          
          {/* Debug info (remove in production) */}
          <details className="mt-4 text-xs text-red-600">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded">
              {JSON.stringify({
                canList: permissions.canList,
                canCreate: permissions.canCreate,
                canUpdate: permissions.canUpdate,
                canDelete: permissions.canDelete,
                actions: permissions.actions?.map(a => a.code),
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    )
  }

  // ============================================
  // MAIN CONTENT - USER HAS LIST PERMISSION
  // ============================================
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Code Table Management</h1>
          <p className="text-sm text-gray-500">
            Manage code tables and their values
          </p>
        </div>

        {/* Create button - only shown if user has Create permission */}
        {canCreateCodeTable && (
          <Button onClick={handleCreate}>
            Create New Table
          </Button>
        )}

        {/* Show message if user cannot create */}
        {!canCreateCodeTable && (
          <div className="text-xs text-gray-400 italic">
            No create permission
          </div>
        )}
      </div>

      {/* Permission indicators (optional - for demo) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          Your Permissions:
        </h3>
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs px-2 py-1 rounded ${
            permissions.canCreate 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-400'
          }`}>
            {permissions.canCreate ? '✓' : '✗'} Create
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            permissions.canList 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-400'
          }`}>
            {permissions.canList ? '✓' : '✗'} List/View
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            permissions.canUpdate 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-400'
          }`}>
            {permissions.canUpdate ? '✓' : '✗'} Update
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            permissions.canDelete 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-400'
          }`}>
            {permissions.canDelete ? '✓' : '✗'} Delete
          </span>
        </div>
        
        {/* Show actual action codes from backend */}
        <details className="mt-2">
          <summary className="text-xs text-blue-600 cursor-pointer">
            Show backend action codes
          </summary>
          <div className="mt-1 text-xs text-blue-700">
            {permissions.actions?.map(action => (
              <div key={action.systemSectionActionId}>
                • {action.code} - {action.name} ({action.effect})
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Table Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tables.map(table => (
              <tr key={table.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {table.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {table.description}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    table.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {table.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right space-x-2">
                  {/* Edit button - only if user has Update permission */}
                  {canUpdateCodeTable ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(table)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      title="You don't have permission to edit"
                    >
                      Edit
                    </Button>
                  )}

                  {/* Delete button - only if user has Delete permission */}
                  {canDeleteCodeTable ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(table.id)}
                    >
                      Delete
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled
                      title="You don't have permission to delete"
                    >
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {tables.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No code tables found.</p>
            {canCreateCodeTable && (
              <Button
                className="mt-4"
                variant="outline"
                onClick={handleCreate}
              >
                Create Your First Table
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * ALTERNATIVE VERSION: Using permissions object directly
 * This is cleaner when you need all permissions at once
 */
export function CodeTablePageSimplified() {
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  
  const perms = getSectionPermissions(
    CMS_SECTIONS.CODE_TABLE,
    SYSTEMS.CMS
  )

  if (isLoading) return <div>Loading...</div>
  if (!perms.canList) return <div>Access Denied</div>

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1>Code Tables</h1>
        {perms.canCreate && <Button>Create</Button>}
      </div>

      <table>
        <tbody>
          <tr>
            <td>Gender</td>
            <td>
              {perms.canUpdate && <Button size="sm">Edit</Button>}
              {perms.canDelete && <Button size="sm">Delete</Button>}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}


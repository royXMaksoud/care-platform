import React, { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function UserRolesTab({ userId, tenantId }) {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const [systems, setSystems] = useState([])
  const [selectedSystem, setSelectedSystem] = useState('')
  const [systemRoles, setSystemRoles] = useState([]) // Roles for selected system
  const [selectedRole, setSelectedRole] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    loadSystems()
    loadUserRoles()
  }, [userId, tenantId])

  useEffect(() => {
    if (selectedSystem) {
      loadSystemRoles(selectedSystem)
    } else {
      setSystemRoles([])
      setSelectedRole('')
    }
  }, [selectedSystem])

  const loadSystems = async () => {
    try {
      const { data } = await api.get('/access/api/systems', { params: { page: 0, size: 500 } })
      const list = data?.content ?? data ?? []
      setSystems(list.map(x => ({ id: String(x.systemId ?? x.id), name: x.name })))
    } catch (err) {
      console.error('Failed to load systems:', err)
    }
  }

  const loadSystemRoles = async (systemId) => {
    try {
      const { data } = await api.get(`/access/api/system-roles/dropdown/by-system/${systemId}`)
      setSystemRoles(Array.isArray(data) ? data.map(x => ({ id: String(x.id), name: x.name })) : [])
    } catch (err) {
      console.error('Failed to load system roles:', err)
      setSystemRoles([])
    }
  }

  const loadUserRoles = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/user-system-roles/user/${userId}`, {
        params: tenantId ? { tenantId } : {},
        headers: tenantId ? { 'X-Tenant-Id': tenantId } : undefined
      })
      setUserRoles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load user roles:', err)
      setUserRoles([])
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async () => {
    if (!selectedSystem || !selectedRole) {
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.error('يرجى اختيار النظام والدور')
      } else {
        toast.error('Please select system and role')
      }
      return
    }

    setLoading(true)
    try {
      await api.post('/access/api/user-system-roles/assign', {
        userId,
        systemRoleId: selectedRole,
        tenantId
      }, {
        headers: tenantId ? { 'X-Tenant-Id': tenantId } : undefined
      })
      
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.success('تم تعيين الدور بنجاح')
      } else {
        toast.success('Role assigned successfully')
      }
      
      setShowAssignModal(false)
      setSelectedSystem('')
      setSelectedRole('')
      await loadUserRoles()
    } catch (err) {
      console.error('Failed to assign role:', err)
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.error('فشل تعيين الدور')
      } else {
        toast.error('Failed to assign role')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveRole = async (userSystemRoleId) => {
    if (!confirm('Are you sure you want to remove this role?')) return

    setLoading(true)
    try {
      await api.delete(`/access/api/user-system-roles/${userSystemRoleId}`)
      
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.success('تم إزالة الدور بنجاح')
      } else {
        toast.success('Role removed successfully')
      }
      
      await loadUserRoles()
    } catch (err) {
      console.error('Failed to remove role:', err)
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.error('فشل إزالة الدور')
      } else {
        toast.error('Failed to remove role')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApplyRole = async (systemRoleId) => {
    // Apply role permissions to user
    setLoading(true)
    try {
      const { data } = await api.post('/access/api/user-system-roles/apply-role', {
        userId,
        systemRoleId,
        tenantId
      }, {
        headers: tenantId ? { 'X-Tenant-Id': tenantId } : undefined
      })
      
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.success(`تم تطبيق ${data.permissionsApplied || 0} صلاحية بنجاح`)
      } else {
        toast.success(`Applied ${data.permissionsApplied || 0} permissions successfully`)
      }
    } catch (err) {
      console.error('Failed to apply role:', err)
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.error('فشل تطبيق الدور')
      } else {
        toast.error('Failed to apply role')
      }
    } finally {
      setLoading(false)
    }
  }

  // Load role details for display
  const [roleDetails, setRoleDetails] = useState({})
  useEffect(() => {
    const loadRoleDetails = async () => {
      for (const userRole of userRoles) {
        if (!roleDetails[userRole.systemRoleId]) {
          try {
            const { data } = await api.get(`/access/api/system-roles/${userRole.systemRoleId}`)
            setRoleDetails(prev => ({
              ...prev,
              [userRole.systemRoleId]: data
            }))
          } catch (err) {
            console.error('Failed to load role details:', err)
          }
        }
      }
    }
    if (userRoles.length > 0) {
      loadRoleDetails()
    }
  }, [userRoles])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">System Roles</h3>
          <p className="text-sm text-gray-600">Manage roles assigned to this user</p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Assign Role
        </button>
      </div>

      {loading && userRoles.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : userRoles.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 font-medium">No roles assigned</p>
          <p className="text-sm text-gray-400 mt-1">Click "Assign Role" to add a role to this user</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">System</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Assigned At</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userRoles.map((userRole) => {
                  const role = roleDetails[userRole.systemRoleId]
                  const system = systems.find(s => {
                    // Try to match system from role details
                    if (role?.systemId) {
                      return s.id === String(role.systemId)
                    }
                    return false
                  })
                  
                  return (
                    <tr key={userRole.userSystemRoleId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {system?.name || 'Unknown System'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {role?.name || 'Loading...'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {userRole.assignedAt ? new Date(userRole.assignedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApplyRole(userRole.systemRoleId)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            title="Apply role permissions"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => handleRemoveRole(userRole.userSystemRoleId)}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            title="Remove role"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setShowAssignModal(false)
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Assign System Role</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System <span className="text-red-500">*</span>:
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedSystem}
                  onChange={(e) => {
                    setSelectedSystem(e.target.value)
                    setSelectedRole('')
                  }}
                  disabled={loading}
                  required
                >
                  <option value="">-- اختر النظام أولاً --</option>
                  {systems.map(system => (
                    <option key={system.id} value={system.id}>{system.name}</option>
                  ))}
                </select>
                {!selectedSystem && (
                  <p className="text-xs text-gray-500 mt-1">يجب اختيار النظام أولاً لعرض الأدوار المتاحة</p>
                )}
              </div>

              {selectedSystem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>:
                  </label>
                  {systemRoles.length === 0 ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
                      {loading ? 'Loading roles...' : 'No roles available for this system'}
                    </div>
                  ) : (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      disabled={loading}
                      required
                    >
                      <option value="">-- اختر الدور --</option>
                      {systemRoles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedSystem('')
                  setSelectedRole('')
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRole}
                disabled={!selectedSystem || !selectedRole || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning...
                  </>
                ) : (
                  'Assign Role'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { 
  ArrowLeft,
  Loader2,
  Users,
  Save,
  X,
} from 'lucide-react'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'

export default function BeneficiaryBulkUpdate() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  
  // Get selected IDs from location state
  useEffect(() => {
    if (location.state?.selectedIds) {
      setSelectedIds(location.state.selectedIds)
    }
  }, [location])
  
  const [form, setForm] = useState({
    updateFields: {},
    description: '',
    isApprovedByAdmin: false,
  })
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedIds.length === 0) {
      toast.error('No beneficiaries selected')
      return
    }
    
    if (!form.description.trim()) {
      toast.error('Please provide a description')
      return
    }
    
    setLoading(true)
    try {
      const payload = {
        beneficiaryIds: selectedIds,
        updateFields: form.updateFields,
        description: form.description,
        isApprovedByAdmin: form.isApprovedByAdmin,
      }
      
      const response = await api.put('/appointment-service/api/admin/beneficiaries/bulk', payload)
      
      toast.success(`Successfully updated ${response.data.length} beneficiaries`)
      navigate('/appointment/beneficiaries')
    } catch (error) {
      console.error('Failed to bulk update:', error)
      toast.error(error.response?.data?.message || 'Failed to update beneficiaries')
    } finally {
      setLoading(false)
    }
  }
  
  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      updateFields: {
        ...prev.updateFields,
        [key]: value,
      }
    }))
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb currentPageLabel="Bulk Update Beneficiaries" />
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/appointment/beneficiaries')}
            className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to beneficiaries
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bulk Update Beneficiaries</h1>
              <p className="text-gray-600">Update multiple beneficiaries at once</p>
            </div>
          </div>
        </div>
        
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Selected Beneficiaries</h3>
              <p className="text-blue-700 mt-1">
                You are about to update <strong>{selectedIds.length}</strong> beneficiaries
              </p>
            </div>
          </div>
        </div>
        
        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Update Fields */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fields to Update</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Language
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.updateFields.preferredLanguageCodeValueId || ''}
                    onChange={e => updateField('preferredLanguageCodeValueId', e.target.value || undefined)}
                  >
                    <option value="">Select Language</option>
                    <option value="AR">Arabic</option>
                    <option value="EN">English</option>
                    <option value="TR">Turkish</option>
                    <option value="KU">Kurdish</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.updateFields.genderCodeValueId || ''}
                    onChange={e => updateField('genderCodeValueId', e.target.value || undefined)}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.updateFields.registrationStatusCodeValueId || ''}
                    onChange={e => updateField('registrationStatusCodeValueId', e.target.value || undefined)}
                  >
                    <option value="">Select Status</option>
                    <option value="QUICK">Quick Registration</option>
                    <option value="COMPLETE">Complete Registration</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.updateFields.isActive !== undefined ? String(form.updateFields.isActive) : ''}
                    onChange={e => {
                      const value = e.target.value
                      updateField('isActive', value === '' ? undefined : value === 'true')
                    }}
                  >
                    <option value="">No Change</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description / Reason * <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Describe why you are updating these beneficiaries..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">This will be logged in the audit trail</p>
            </div>
            
            {/* Approval */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="approved"
                checked={form.isApprovedByAdmin}
                onChange={e => setForm({...form, isApprovedByAdmin: e.target.checked})}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="approved" className="text-sm font-medium text-gray-700">
                Approved by Admin
              </label>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading || selectedIds.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update {selectedIds.length} Beneficiaries
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/appointment/beneficiaries')}
                disabled={loading}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


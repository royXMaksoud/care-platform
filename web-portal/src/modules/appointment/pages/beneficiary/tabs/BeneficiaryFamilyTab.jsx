import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Users as UsersIcon, User, Loader2 } from 'lucide-react'
import { api } from '@/lib/axios'

function FamilyMemberForm({ beneficiaryId, onCancel, onSuccess }) {
  const [form, setForm] = useState({
    beneficiaryId,
    fullName: '',
    motherName: '',
    nationalId: '',
    dateOfBirth: '',
    relationType: '',
    relationDescription: '',
    mobileNumber: '',
    email: '',
    genderCodeValueId: '',
    isEmergencyContact: false,
    canBookAppointments: false,
  })
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/appointment-service/api/family-members', form)
      toast.success('Family member added successfully')
      onSuccess()
    } catch (error) {
      console.error('Failed to create family member:', error)
      toast.error(error.response?.data?.message || 'Failed to create family member')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
      <h4 className="font-semibold text-gray-900 mb-4">Add Family Member</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Relation Type *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.relationType}
              onChange={(e) => setForm({ ...form, relationType: e.target.value })}
            >
              <option value="">Select</option>
              <option value="SPOUSE">Spouse</option>
              <option value="CHILD">Child</option>
              <option value="PARENT">Parent</option>
              <option value="SIBLING">Sibling</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mobile</label>
            <input
              type="text"
              placeholder="+963912345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
              value={form.mobileNumber}
              onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
            />
          </div>
        </div>
        {form.relationType === 'OTHER' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Relation Description</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.relationDescription}
              onChange={(e) => setForm({ ...form, relationDescription: e.target.value })}
            />
          </div>
        )}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isEmergencyContact}
              onChange={(e) => setForm({ ...form, isEmergencyContact: e.target.checked })}
            />
            Emergency Contact
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.canBookAppointments}
              onChange={(e) => setForm({ ...form, canBookAppointments: e.target.checked })}
            />
            Can Book Appointments
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50"
          >
            {busy ? 'Adding...' : 'Add Member'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default function BeneficiaryFamilyTab({ beneficiaryId }) {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [beneficiaryId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await api.get(
        `/appointment-service/api/family-members/beneficiary/${beneficiaryId}`
      )
      setMembers(response.data || [])
    } catch (error) {
      console.error('Failed to load family members:', error)
      toast.error('Failed to load family members')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (familyMemberId) => {
    if (!confirm('Are you sure you want to delete this family member?')) return

    try {
      await api.delete(`/appointment-service/api/family-members/${familyMemberId}`)
      toast.success('Family member deleted successfully')
      loadMembers()
    } catch (error) {
      console.error('Failed to delete family member:', error)
      toast.error('Failed to delete family member')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Family Members ({members.length})</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-2"
        >
          <UsersIcon className="w-4 h-4" />
          Add Family Member
        </button>
      </div>

      {showAddForm && (
        <FamilyMemberForm
          beneficiaryId={beneficiaryId}
          onCancel={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            loadMembers()
          }}
        />
      )}

      {members.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No family members found</p>
        </div>
      )}

      {members.map((member) => (
        <div
          key={member.familyMemberId}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{member.fullName}</h4>
                <p className="text-sm text-gray-600">
                  {member.relationType}
                  {member.relationDescription && ` - ${member.relationDescription}`}
                </p>
                {member.mobileNumber && (
                  <p className="text-sm text-gray-500 font-mono">{member.mobileNumber}</p>
                )}
                {member.email && <p className="text-sm text-gray-500">{member.email}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.isEmergencyContact && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  Emergency Contact
                </span>
              )}
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {member.isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => handleDelete(member.familyMemberId)}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

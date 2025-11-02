import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { 
  User, 
  Users as UsersIcon, 
  FileText, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

export default function BeneficiaryDetails() {
  const { beneficiaryId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [beneficiary, setBeneficiary] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  
  useEffect(() => {
    loadBeneficiary()
  }, [beneficiaryId])
  
  const loadBeneficiary = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/appointment-service/api/admin/beneficiaries/${beneficiaryId}`)
      setBeneficiary(response.data)
    } catch (error) {
      console.error('Failed to load beneficiary:', error)
      toast.error('Failed to load beneficiary details')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }
  
  if (!beneficiary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Beneficiary not found</p>
          <button
            onClick={() => navigate('/appointment/beneficiaries')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            ← Back to list
          </button>
        </div>
      </div>
    )
  }
  
  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'family', label: 'Family Members', icon: UsersIcon },
    { id: 'documents', label: 'Documents', icon: FileText },
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/appointment/beneficiaries')}
            className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to list
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            {beneficiary.profilePhotoUrl ? (
              <img
                src={beneficiary.profilePhotoUrl}
                alt={beneficiary.fullName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{beneficiary.fullName}</h1>
              <p className="text-gray-600">
                {beneficiary.nationalId || 'No National ID'} • {beneficiary.mobileNumber}
              </p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                beneficiary.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {beneficiary.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-1">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'info' && <PersonalInfoTab beneficiary={beneficiary} />}
          {activeTab === 'family' && <FamilyMembersTab beneficiaryId={beneficiaryId} />}
          {activeTab === 'documents' && <DocumentsTab beneficiaryId={beneficiaryId} />}
        </div>
      </div>
    </div>
  )
}

function PersonalInfoTab({ beneficiary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Full Name</p>
            <p className="font-medium">{beneficiary.fullName}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Mother Name</p>
            <p className="font-medium">{beneficiary.motherName || '-'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Date of Birth</p>
            <p className="font-medium">
              {beneficiary.dateOfBirth 
                ? new Date(beneficiary.dateOfBirth).toLocaleDateString()
                : '-'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">National ID</p>
            <p className="font-medium font-mono text-sm">{beneficiary.nationalId || '-'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Gender</p>
            <p className="font-medium">{beneficiary.genderCodeValueId || '-'}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Mobile</p>
            <p className="font-medium font-mono">{beneficiary.mobileNumber}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium">{beneficiary.email || '-'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Address</p>
            <p className="font-medium">{beneficiary.address || '-'}</p>
          </div>
        </div>
        
        {beneficiary.latitude && beneficiary.longitude && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium text-sm font-mono">
                {beneficiary.latitude.toFixed(6)}, {beneficiary.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="md:col-span-2 border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Preferred Language</p>
            <p className="font-medium">{beneficiary.preferredLanguageCodeValueId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Registration Status</p>
            <p className="font-medium">{beneficiary.registrationStatusCodeValueId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created At</p>
            <p className="font-medium text-sm">
              {beneficiary.createdAt 
                ? new Date(beneficiary.createdAt).toLocaleString()
                : '-'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FamilyMembersTab({ beneficiaryId }) {
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
        <h3 className="text-lg font-semibold text-gray-900">
          Family Members ({members.length})
        </h3>
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
                {member.email && (
                  <p className="text-sm text-gray-500">{member.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.isEmergencyContact && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  Emergency Contact
                </span>
              )}
              <span className={`px-2 py-1 text-xs rounded-full ${
                member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
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
              onChange={e => setForm({...form, fullName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Relation Type *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.relationType}
              onChange={e => setForm({...form, relationType: e.target.value})}
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
              onChange={e => setForm({...form, dateOfBirth: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mobile</label>
            <input
              type="text"
              placeholder="+963912345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
              value={form.mobileNumber}
              onChange={e => setForm({...form, mobileNumber: e.target.value})}
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
              onChange={e => setForm({...form, relationDescription: e.target.value})}
            />
          </div>
        )}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isEmergencyContact}
              onChange={e => setForm({...form, isEmergencyContact: e.target.checked})}
            />
            Emergency Contact
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.canBookAppointments}
              onChange={e => setForm({...form, canBookAppointments: e.target.checked})}
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

function DocumentsTab({ beneficiaryId }) {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  
  useEffect(() => {
    loadDocuments()
  }, [beneficiaryId])
  
  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await api.get(
        `/appointment-service/api/beneficiary-documents/beneficiary/${beneficiaryId}`
      )
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      await api.delete(`/appointment-service/api/beneficiary-documents/${documentId}`)
      toast.success('Document deleted successfully')
      loadDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
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
        <h3 className="text-lg font-semibold text-gray-900">
          Documents ({documents.length})
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Upload Document
        </button>
      </div>
      
      {showAddForm && (
        <DocumentForm
          beneficiaryId={beneficiaryId}
          onCancel={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            loadDocuments()
          }}
        />
      )}
      
      {documents.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No documents found</p>
        </div>
      )}
      
      {documents.map((doc) => (
        <div
          key={doc.documentId}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{doc.documentName}</h4>
                <p className="text-sm text-gray-600">{doc.documentType}</p>
                {doc.documentDescription && (
                  <p className="text-sm text-gray-500 mt-1">{doc.documentDescription}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {doc.fileName} • {(doc.fileSizeBytes / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                doc.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {doc.isActive ? 'Active' : 'Inactive'}
              </span>
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  View →
                </a>
              )}
              <button
                onClick={() => handleDelete(doc.documentId)}
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

function DocumentForm({ beneficiaryId, onCancel, onSuccess }) {
  const [form, setForm] = useState({
    beneficiaryId,
    documentName: '',
    documentType: '',
    documentDescription: '',
    fileName: '',
    fileUrl: '',
    fileSizeBytes: 0,
    isActive: true,
  })
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/appointment-service/api/beneficiary-documents', form)
      toast.success('Document uploaded successfully')
      onSuccess()
    } catch (error) {
      console.error('Failed to create document:', error)
      toast.error(error.response?.data?.message || 'Failed to create document')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
      <h4 className="font-semibold text-gray-900 mb-4">Upload Document</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Name *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.documentName}
              onChange={e => setForm({...form, documentName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Type *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.documentType}
              onChange={e => setForm({...form, documentType: e.target.value})}
            >
              <option value="">Select</option>
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
              <option value="MEDICAL_REPORT">Medical Report</option>
              <option value="INSURANCE_CARD">Insurance Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">File URL *</label>
            <input
              type="url"
              required
              placeholder="https://example.com/file.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.fileUrl}
              onChange={e => setForm({...form, fileUrl: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">File Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.fileName}
              onChange={e => setForm({...form, fileName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">File Size (bytes)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.fileSizeBytes}
              onChange={e => setForm({...form, fileSizeBytes: parseInt(e.target.value) || 0})}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.documentDescription}
              onChange={e => setForm({...form, documentDescription: e.target.value})}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {busy ? 'Uploading...' : 'Upload Document'}
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


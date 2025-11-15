import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { 
  Users, 
  TrendingUp,
  ArrowLeft,
  Loader2,
  UserCheck,
  UserX,
  UsersRound,
  BarChart3,
} from 'lucide-react'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'

export default function BeneficiaryStatistics() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  
  useEffect(() => {
    loadStatistics()
  }, [])
  
  const loadStatistics = async () => {
    try {
      setLoading(true)
      const response = await api.get('/appointment-service/api/admin/beneficiaries/statistics')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load statistics:', error)
      toast.error('Failed to load statistics')
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
  
  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb currentPageLabel="Beneficiary Statistics" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Failed to load statistics</p>
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
  
  const inactiveCount = stats.totalBeneficiaries - stats.activeBeneficiaries
  const activePercentage = stats.totalBeneficiaries > 0 
    ? ((stats.activeBeneficiaries / stats.totalBeneficiaries) * 100).toFixed(1)
    : 0
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb currentPageLabel="Beneficiary Statistics" />
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
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Beneficiary Statistics</h1>
              <p className="text-gray-600">Overview of beneficiary data and trends</p>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalBeneficiaries}</div>
            <div className="text-sm text-gray-600">Total Beneficiaries</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.activeBeneficiaries}</div>
            <div className="text-sm text-gray-600">Active Beneficiaries</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-500 to-slate-500 flex items-center justify-center">
                <UserX className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-600 mb-1">{inactiveCount}</div>
            <div className="text-sm text-gray-600">Inactive Beneficiaries</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Rate</h3>
            <span className="text-2xl font-bold text-indigo-600">{activePercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full flex items-center justify-end pr-2"
              style={{ width: `${activePercentage}%` }}
            >
              <span className="text-xs font-bold text-white">{activePercentage}%</span>
            </div>
          </div>
        </div>
        
        {/* Additional Charts Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/appointment/beneficiaries')}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                View All Beneficiaries
              </button>
              <button
                onClick={() => navigate('/appointment/beneficiaries/bulk-update', { state: { selectedIds: [] } })}
                className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Bulk Update Beneficiaries
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="text-center py-8">
              <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">Activity tracking coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


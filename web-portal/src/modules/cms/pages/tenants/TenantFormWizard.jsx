import React, { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { CODE_TABLE_IDS } from '@/config/codeTableIds'

const STEPS = [
  { id: 1, label: 'Basic Info', description: 'Name and email' },
  { id: 2, label: 'Billing', description: 'Country, plan, currency' },
  { id: 3, label: 'Contact', description: 'Focal point details' },
  { id: 4, label: 'Review', description: 'Confirm and submit' },
]

export default function TenantFormWizard({ open, onClose, onSuccess, initialData = null }) {
  const isEditMode = !!initialData
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState({
    countries: [],
    industries: [],
    plans: [],
    currencies: [],
    cycles: [],
  })

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    countryId: initialData?.countryId || '',
    industryTypeId: initialData?.industryTypeId || '',
    subscriptionPlanId: initialData?.subscriptionPlanId || '',
    billingCurrencyId: initialData?.billingCurrencyId || '',
    billingCycleId: initialData?.billingCycleId || '',
    focalPointName: initialData?.focalPointName || '',
    focalPointPhone: initialData?.focalPointPhone || '',
    address: initialData?.address || '',
    comment: initialData?.comment || '',
  })

  // Fetch dropdown options
  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const [countriesRes, industriesRes, plansRes, currenciesRes, cyclesRes] = await Promise.all([
        api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', {
          params: { codeTableId: CODE_TABLE_IDS.COUNTRY },
        }),
        api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', {
          params: { codeTableId: CODE_TABLE_IDS.INDUSTRY_TYPE },
        }),
        api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', {
          params: { codeTableId: CODE_TABLE_IDS.SUBSCRIPTION_PLAN },
        }),
        api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', {
          params: { codeTableId: CODE_TABLE_IDS.CURRENCY },
        }),
        api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', {
          params: { codeTableId: CODE_TABLE_IDS.BILLING_CYCLE },
        }),
      ])

      setOptions({
        countries: countriesRes.data || [],
        industries: industriesRes.data || [],
        plans: plansRes.data || [],
        currencies: currenciesRes.data || [],
        cycles: cyclesRes.data || [],
      })
    } catch (err) {
      console.error('Failed to fetch dropdown options:', err)
      toast.error('Failed to load form options')
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.name?.trim()) {
          toast.error('Tenant name is required')
          return false
        }
        if (!formData.email?.trim()) {
          toast.error('Email is required')
          return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error('Please enter a valid email address')
          return false
        }
        return true
      case 2:
        if (!formData.countryId) {
          toast.error('Please select a country')
          return false
        }
        if (!formData.subscriptionPlanId) {
          toast.error('Please select a subscription plan')
          return false
        }
        return true
      case 3:
        // Contact step is optional
        return true
      case 4:
        // Review step
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setLoading(true)
    try {
      const payload = {
        name: formData.name?.trim(),
        email: formData.email?.trim(),
        countryId: formData.countryId || null,
        industryTypeId: formData.industryTypeId || null,
        subscriptionPlanId: formData.subscriptionPlanId || null,
        billingCurrencyId: formData.billingCurrencyId || null,
        billingCycleId: formData.billingCycleId || null,
        focalPointName: formData.focalPointName?.trim() || null,
        focalPointPhone: formData.focalPointPhone?.trim() || null,
        address: formData.address?.trim() || null,
        comment: formData.comment?.trim() || null,
        isActive: true,
      }

      if (isEditMode) {
        payload.tenantId = initialData.tenantId
        payload.rowVersion = initialData.rowVersion
        await api.put(`/access/api/v1/tenants/${initialData.tenantId}`, payload)
        toast.success('Tenant updated successfully')
      } else {
        await api.post('/access/api/v1/tenants', payload)
        toast.success('Tenant created successfully')
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Failed to save tenant:', err)
      toast.error(err?.response?.data?.message || 'Failed to save tenant')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const getCountryName = (id) => options.countries.find((c) => c.id === id)?.name || '-'
  const getIndustryName = (id) => options.industries.find((i) => i.id === id)?.name || '-'
  const getPlanName = (id) => options.plans.find((p) => p.id === id)?.name || '-'
  const getCurrencyName = (id) => options.currencies.find((c) => c.id === id)?.name || '-'
  const getCycleName = (id) => options.cycles.find((c) => c.id === id)?.name || '-'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h2 className="text-2xl font-bold text-white mb-1">
            {isEditMode ? 'Edit Tenant' : 'Create New Tenant'}
          </h2>
          <p className="text-blue-100 text-sm">Step {currentStep} of {STEPS.length}</p>
        </div>

        {/* Steps Indicator */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      currentStep >= step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  <p className={`mt-2 text-xs font-medium text-center ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                </div>

                {idx < STEPS.length - 1 && (
                  <div className={`w-12 h-1 mx-2 transition-all ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-8 max-h-96 overflow-y-auto">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter tenant name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Billing */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Billing Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  value={formData.countryId}
                  onChange={(e) => handleInputChange('countryId', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Country --</option>
                  {options.countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry Type
                </label>
                <select
                  value={formData.industryTypeId}
                  onChange={(e) => handleInputChange('industryTypeId', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Industry --</option>
                  {options.industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscription Plan *
                </label>
                <select
                  value={formData.subscriptionPlanId}
                  onChange={(e) => handleInputChange('subscriptionPlanId', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Plan --</option>
                  {options.plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Currency
                  </label>
                  <select
                    value={formData.billingCurrencyId}
                    onChange={(e) => handleInputChange('billingCurrencyId', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select Currency --</option>
                    {options.currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Cycle
                  </label>
                  <select
                    value={formData.billingCycleId}
                    onChange={(e) => handleInputChange('billingCycleId', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select Cycle --</option>
                    {options.cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focal Point Name
                </label>
                <input
                  type="text"
                  value={formData.focalPointName}
                  onChange={(e) => handleInputChange('focalPointName', e.target.value)}
                  placeholder="Enter contact person name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focal Point Phone
                </label>
                <input
                  type="tel"
                  value={formData.focalPointPhone}
                  onChange={(e) => handleInputChange('focalPointPhone', e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter address"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => handleInputChange('comment', e.target.value)}
                  placeholder="Add any additional comments"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Review Information</h3>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Tenant Name</p>
                    <p className="text-sm font-semibold text-gray-900">{formData.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-900">{formData.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Country</p>
                    <p className="text-sm font-semibold text-gray-900">{getCountryName(formData.countryId)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Industry</p>
                    <p className="text-sm font-semibold text-gray-900">{getIndustryName(formData.industryTypeId) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Subscription Plan</p>
                    <p className="text-sm font-semibold text-gray-900">{getPlanName(formData.subscriptionPlanId)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Currency</p>
                    <p className="text-sm font-semibold text-gray-900">{getCurrencyName(formData.billingCurrencyId) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Billing Cycle</p>
                    <p className="text-sm font-semibold text-gray-900">{getCycleName(formData.billingCycleId) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Focal Point</p>
                    <p className="text-sm font-semibold text-gray-900">{formData.focalPointName || '-'}</p>
                  </div>
                  {formData.address && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.address}</p>
                    </div>
                  )}
                  {formData.comment && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Comments</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.comment}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ✓ Please review the information above before submitting. You can go back to edit any field if needed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
            )}

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {loading ? 'Submitting...' : isEditMode ? 'Update Tenant' : 'Create Tenant'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { CODE_TABLE_IDS } from '@/config/codeTableIds'
import {
  Modal,
  Stepper,
  Button,
  Group,
  Stack,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Loader,
  Paper,
  Title,
  Text,
  Divider,
  Badge,
  Box,
  FileInput,
  Image,
  CloseButton,
} from '@mantine/core'

const STEPS = [
  { id: 0, label: 'Basic Info', description: 'Name and email' },
  { id: 1, label: 'Billing', description: 'Country, plan, currency' },
  { id: 2, label: 'Contact', description: 'Focal point details' },
  { id: 3, label: 'Review', description: 'Confirm and submit' },
]

export default function TenantFormWizard({ open, onClose, onSuccess, initialData = null }) {
  const isEditMode = !!initialData
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
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
    sessionTimeoutMinutes:
      typeof initialData?.sessionTimeoutMinutes === 'number'
        ? initialData.sessionTimeoutMinutes
        : 30,
    tenantLogo: initialData?.tenantLogo || '',
  })

  useEffect(() => {
    if (!open) return
    setActiveStep(0)
    fetchOptions()
  }, [open])

  const fetchOptions = async () => {
    setOptionsLoading(true)
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
    } finally {
      setOptionsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      if (field === 'sessionTimeoutMinutes') {
        if (value === '' || value === null || Number.isNaN(value)) {
          return { ...prev, [field]: '' }
        }
        return { ...prev, [field]: Number(value) }
      }
      return { ...prev, [field]: value ?? '' }
    })
  }

  const handleLogoUpload = (file) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, tenantLogo: '' }))
      return
    }

    if (file.size > 800 * 1024) {
      toast.error('Logo should be smaller than 800KB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      setFormData((prev) => ({ ...prev, tenantLogo: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const handleLogoRemove = () => {
    setFormData((prev) => ({ ...prev, tenantLogo: '' }))
  }

  const validateStep = (stepIndex) => {
    switch (stepIndex) {
      case 0:
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
        if (!formData.sessionTimeoutMinutes || Number(formData.sessionTimeoutMinutes) <= 0) {
          toast.error('Session timeout must be at least 1 minute')
          return false
        }
        return true
      case 1:
        if (!formData.countryId) {
          toast.error('Please select a country')
          return false
        }
        if (!formData.subscriptionPlanId) {
          toast.error('Please select a subscription plan')
          return false
        }
        return true
      case 2:
      case 3:
      default:
        return true
    }
  }

  const handleNext = () => {
    if (loading) return
    if (!validateStep(activeStep)) return
    if (activeStep === STEPS.length - 1) {
      handleSubmit()
    } else {
      setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  const handlePrevious = () => {
    if (loading) return
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  const handleStepClick = (stepIndex) => {
    if (loading) return
    if (stepIndex <= activeStep) {
      setActiveStep(stepIndex)
      return
    }

    const canAdvance = Array.from({ length: stepIndex - activeStep }, (_, idx) => activeStep + idx).every((step) =>
      validateStep(step)
    )

    if (canAdvance) setActiveStep(stepIndex)
  }

  const handleSubmit = async () => {
    if (!validateStep(STEPS.length - 1)) return

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
        sessionTimeoutMinutes: Number(formData.sessionTimeoutMinutes) || 30,
        tenantLogo: formData.tenantLogo || null,
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

  const selectData = useMemo(
    () => ({
      countries: options.countries.map((option) => ({ value: option.id, label: option.name })),
      industries: options.industries.map((option) => ({ value: option.id, label: option.name })),
      plans: options.plans.map((option) => ({ value: option.id, label: option.name })),
      currencies: options.currencies.map((option) => ({ value: option.id, label: option.name })),
      cycles: options.cycles.map((option) => ({ value: option.id, label: option.name })),
    }),
    [options]
  )

  const summaryItems = useMemo(
    () => [
      { label: 'Tenant Name', value: formData.name },
      { label: 'Email', value: formData.email },
      { label: 'Country', value: getCountryName(formData.countryId) },
      { label: 'Industry', value: getIndustryName(formData.industryTypeId) },
      { label: 'Subscription Plan', value: getPlanName(formData.subscriptionPlanId) },
      { label: 'Billing Currency', value: getCurrencyName(formData.billingCurrencyId) },
      { label: 'Billing Cycle', value: getCycleName(formData.billingCycleId) },
      {
        label: 'Session Timeout (min)',
        value: formData.sessionTimeoutMinutes ? `${formData.sessionTimeoutMinutes} min` : '-',
      },
      {
        label: 'Tenant Logo',
        value: formData.tenantLogo ? 'Logo uploaded' : '—',
      },
      { label: 'Focal Point', value: formData.focalPointName },
      { label: 'Phone', value: formData.focalPointPhone },
      { label: 'Address', value: formData.address },
      { label: 'Comments', value: formData.comment },
    ],
    [formData, options]
  )

  const renderStepContent = (stepIndex) => {
    if (optionsLoading) {
      return (
        <Group position="center" mt="lg" mb="xl">
          <Loader />
          <Text size="sm" color="dimmed">
            Loading tenant options…
          </Text>
        </Group>
      )
    }

    switch (stepIndex) {
      case 0:
        return (
          <Stack spacing="lg" mt="md">
            <div>
              <Title order={4}>Basic information</Title>
              <Text size="sm" color="dimmed">
                Start with who the tenant is and how to reach them.
              </Text>
            </div>
            <Stack spacing="md">
              <TextInput
                label="Tenant name"
                placeholder="Acme Corporation"
                required
                value={formData.name}
                onChange={(event) => handleInputChange('name', event.currentTarget.value)}
              />
              <TextInput
                label="Contact email"
                placeholder="tenant@company.com"
                type="email"
                required
                value={formData.email}
                onChange={(event) => handleInputChange('email', event.currentTarget.value)}
              />
              <NumberInput
                label="Session timeout (minutes)"
                min={1}
                value={formData.sessionTimeoutMinutes}
                onChange={(value) => handleInputChange('sessionTimeoutMinutes', value)}
                description="Inactivity threshold before automatic logout."
                required
              />
              <Stack spacing={8}>
                <FileInput
                  label="Tenant logo"
                  placeholder="Upload logo (PNG, JPG, SVG)"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  value={null}
                  clearable
                />
                <Text size="xs" color="dimmed">
                  This logo appears in the portal header and on exported invoices.
                </Text>
                {formData.tenantLogo && (
                  <Group spacing="sm" align="center">
                    <Box
                      style={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                      }}
                    >
                      <Image
                        src={formData.tenantLogo}
                        alt="Tenant logo preview"
                        radius="md"
                        withPlaceholder
                        width={80}
                        height={80}
                        fit="contain"
                        bg="gray.0"
                      />
                      <CloseButton
                        size="sm"
                        variant="filled"
                        color="red"
                        title="Remove logo"
                        onClick={handleLogoRemove}
                        style={{ position: 'absolute', top: 4, right: 4 }}
                      />
                    </Box>
                    <Text size="xs" color="dimmed">
                      Logo attached
                    </Text>
                  </Group>
                )}
              </Stack>
            </Stack>
          </Stack>
        )
      case 1:
        return (
          <Stack spacing="lg" mt="md">
            <div>
              <Title order={4}>Billing preferences</Title>
              <Text size="sm" color="dimmed">
                Configure how we bill this tenant each cycle.
              </Text>
            </div>
            <Stack spacing="md">
              <Select
                label="Country"
                placeholder="Select country"
                searchable
                nothingFound="No results"
                data={selectData.countries}
                value={formData.countryId}
                onChange={(value) => handleInputChange('countryId', value)}
                required
                disabled={optionsLoading}
              />
              <Select
                label="Industry"
                placeholder="Select industry"
                searchable
                clearable
                nothingFound="No results"
                data={selectData.industries}
                value={formData.industryTypeId}
                onChange={(value) => handleInputChange('industryTypeId', value)}
                disabled={optionsLoading}
              />
              <Select
                label="Subscription plan"
                placeholder="Select plan"
                searchable
                nothingFound="No results"
                data={selectData.plans}
                value={formData.subscriptionPlanId}
                onChange={(value) => handleInputChange('subscriptionPlanId', value)}
                required
                disabled={optionsLoading}
              />
              <Group grow>
                <Select
                  label="Billing currency"
                  placeholder="Select currency"
                  searchable
                  clearable
                  data={selectData.currencies}
                  value={formData.billingCurrencyId}
                  onChange={(value) => handleInputChange('billingCurrencyId', value)}
                  disabled={optionsLoading}
                />
                <Select
                  label="Billing cycle"
                  placeholder="Select cycle"
                  searchable
                  clearable
                  data={selectData.cycles}
                  value={formData.billingCycleId}
                  onChange={(value) => handleInputChange('billingCycleId', value)}
                  disabled={optionsLoading}
                />
              </Group>
            </Stack>
          </Stack>
        )
      case 2:
        return (
          <Stack spacing="lg" mt="md">
            <div>
              <Title order={4}>Contact & logistics</Title>
              <Text size="sm" color="dimmed">
                Optional details so the account and billing owners can stay in touch.
              </Text>
            </div>
            <Stack spacing="md">
              <Group grow align="flex-start">
                <TextInput
                  label="Focal point name"
                  placeholder="Primary contact person"
                  value={formData.focalPointName}
                  onChange={(event) => handleInputChange('focalPointName', event.currentTarget.value)}
                />
                <TextInput
                  label="Focal point phone"
                  placeholder="+966 5 0000 0000"
                  value={formData.focalPointPhone}
                  onChange={(event) => handleInputChange('focalPointPhone', event.currentTarget.value)}
                />
              </Group>
              <Textarea
                label="Head office address"
                placeholder="Street, city, country"
                minRows={3}
                autosize
                value={formData.address}
                onChange={(event) => handleInputChange('address', event.currentTarget.value)}
              />
              <Textarea
                label="Internal notes"
                placeholder="Any additional context for the onboarding team"
                minRows={3}
                autosize
                value={formData.comment}
                onChange={(event) => handleInputChange('comment', event.currentTarget.value)}
              />
            </Stack>
          </Stack>
        )
      case 3:
        return (
          <Stack spacing="lg" mt="md">
            <div>
              <Title order={4}>Review summary</Title>
              <Text size="sm" color="dimmed">
                Confirm the tenant details before provisioning their dedicated workspace.
              </Text>
            </div>
            <Paper withBorder radius="lg" p="xl">
              <Stack spacing="sm">
                <Group position="apart">
                  <Text fw={600}>Core profile</Text>
                  <Badge color="blue" variant="light">
                    cms_{formData.name ? formData.name.replace(/\s+/g, '_').toLowerCase() : 'tenant'}
                  </Badge>
                </Group>
                <Divider my="sm" />
                <Group align="flex-start" spacing="xl">
                  <Box sx={{ flex: 1 }}>
                    <Stack spacing="xs">
                      {summaryItems.slice(0, 6).map(({ label, value }) => (
                        <div key={label}>
                          <Text size="xs" color="dimmed" tt="uppercase">
                            {label}
                          </Text>
                          <Text size="sm" fw={600}>
                            {value || '—'}
                          </Text>
                        </div>
                      ))}
                    </Stack>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack spacing="xs">
                      {summaryItems.slice(6).map(({ label, value }) => (
                        <div key={label}>
                          <Text size="xs" color="dimmed" tt="uppercase">
                            {label}
                          </Text>
                          <Text size="sm" fw={600}>
                            {value || '—'}
                          </Text>
                        </div>
                      ))}
                    </Stack>
                  </Box>
                </Group>
              </Stack>
            </Paper>
            <Paper shadow="xs" radius="lg" p="md" withBorder>
              <Text size="sm" color="dimmed">
                Submitting will provision the tenant workspace, create their dedicated schema and queue optional data seeding. Use the notes field to leave instructions for the onboarding team if needed.
              </Text>
            </Paper>
          </Stack>
        )
      default:
        return null
    }
  }

  return (
    <Modal
      opened={open}
      onClose={onClose}
      size="xl"
      radius="lg"
      padding="lg"
      overlayBlur={4}
      overlayOpacity={0.4}
      title={
        <div>
          <Title order={3}>{isEditMode ? 'Update tenant' : 'New tenant onboarding'}</Title>
          <Text size="sm" color="dimmed">
            A guided flow to provision an isolated CMS environment with billing preferences and onboarding notes.
          </Text>
        </div>
      }
    >
      <Stepper
        active={activeStep}
        onStepClick={handleStepClick}
        color="blue"
        allowNextStepsSelect
        breakpoint="sm"
        iconSize={30}
      >
        {STEPS.map((step) => (
          <Stepper.Step
            key={step.id}
            label={step.label}
            description={step.description}
          >
            {renderStepContent(step.id)}
          </Stepper.Step>
        ))}
      </Stepper>

      <Group position="apart" mt="xl">
        <Button variant="default" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Group spacing="sm">
          {activeStep > 0 && (
            <Button variant="default" onClick={handlePrevious} disabled={loading}>
              Back
            </Button>
          )}
          <Button onClick={handleNext} loading={loading && activeStep === STEPS.length - 1}>
            {activeStep === STEPS.length - 1 ? (isEditMode ? 'Update tenant' : 'Create tenant') : 'Continue'}
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}

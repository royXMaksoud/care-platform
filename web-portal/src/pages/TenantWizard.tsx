import React, { useEffect, useMemo, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  useGetSubscriptionPlans,
  useValidateTenantName,
  useGetAvailableSystems,
  useGetSourceTables,
  useGenerateDbName,
  useTestDbConnection,
  useValidateUsersBulk,
  useDownloadUsersTemplate,
  useProvisionTenant
} from '../services/tenantWizardService'

// ------------------ Types ------------------
export type BillingCycle = 'monthly' | 'yearly'

const tenantInfoSchema = z.object({
  companyName: z.string().min(2, 'Required'),
  contactName: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(6, 'Invalid phone'),
  country: z.string().optional(),
  timezone: z.string().optional(),
  logo: z.any().optional(),
  subdomain: z.string().optional()
})

const subscriptionSchema = z.object({
  planId: z.string().min(1, 'Select a plan'),
  billingCycle: z.enum(['monthly', 'yearly']),
  startDate: z.date().optional()
})

const databaseSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().default(5432),
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
  databaseName: z.string().min(1, 'Required'),
  encryption: z.boolean().default(true)
})

const systemsSchema = z.array(
  z.object({ systemId: z.string(), enabled: z.boolean() })
).min(1, 'Select at least one system')

const selectedTablesSchema = z.array(
  z.object({ 
    name: z.string(),
    type: z.enum(['table', 'view']),
    withData: z.boolean()
  })
).optional()

const userPermissionsSchema = z.object({
  systemId: z.string(),
  permissions: z.array(z.enum(['view', 'create', 'edit', 'delete']))
})

const userSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['Admin', 'Manager', 'User']),
  systemPermissions: z.array(userPermissionsSchema),
  profileData: z.record(z.any()).optional()
})

const wizardSchema = z.object({
  tenantInfo: tenantInfoSchema,
  subscription: subscriptionSchema,
  database: databaseSchema,
  selectedTables: selectedTablesSchema,
  selectedSystems: systemsSchema,
  users: z.array(userSchema).default([]),
  acceptedTerms: z.boolean().optional()
})

export type WizardData = z.infer<typeof wizardSchema>

const STORAGE_KEY = 'tenant_wizard_state_v1'

function useLocalStorageSync(methods: ReturnType<typeof useForm<WizardData>>) {
  const { watch, setValue } = methods

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        Object.entries(parsed).forEach(([k, v]) => setValue(k as any, v, { shouldDirty: false }))
      } catch {}
    }
    // autosave
    const sub = watch((value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    })
    return () => sub.unsubscribe()
  }, [watch, setValue])
}

const steps = [
  { key: 'tenant', title: 'Tenant Information' },
  { key: 'plan', title: 'Subscription Plan' },
  { key: 'db', title: 'Database Configuration' },
  { key: 'tables', title: 'Select Tables' },
  { key: 'systems', title: 'System Selection' },
  { key: 'users', title: 'Users Management' },
  { key: 'review', title: 'Review & Provision' }
]

export default function TenantWizard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)

  const methods = useForm<WizardData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      tenantInfo: { companyName: '', contactName: '', email: '', phone: '', country: '', timezone: '', subdomain: '' },
      subscription: { planId: '', billingCycle: 'monthly' },
      database: { host: 'localhost', port: 5432, username: '', password: '', databaseName: '', encryption: true },
      selectedTables: [],
      selectedSystems: [],
      users: [],
      acceptedTerms: false
    },
    mode: 'onChange'
  })

  useLocalStorageSync(methods)

  const { handleSubmit, formState, getValues, setValue, watch } = methods

  const companyName = watch('tenantInfo.companyName')
  const subdomain = useMemo(() =>
    (companyName || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''), [companyName])

  useEffect(() => {
    setValue('tenantInfo.subdomain', subdomain ? `${subdomain}.ourdomain.com` : '')
  }, [subdomain, setValue])

  // Data fetching hooks
  const plansQuery = useGetSubscriptionPlans()
  const systemsQuery = useGetAvailableSystems()
  const tablesQuery = useGetSourceTables()

  const testConn = useTestDbConnection()
  const provision = useProvisionTenant()
  const validateName = useValidateTenantName()
  const generateDb = useGenerateDbName()
  const downloadTemplate = useDownloadUsersTemplate()
  const validateBulk = useValidateUsersBulk()

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  // Validate only the fields of the active step to allow progressive navigation
  const stepFields: string[][] = [
    // Step 0: Tenant Info
    [
      'tenantInfo.companyName',
      'tenantInfo.contactName',
      'tenantInfo.email',
      'tenantInfo.phone',
    ],
    // Step 1: Subscription
    [
      'subscription.planId',
      'subscription.billingCycle',
    ],
    // Step 2: Database
    [
      'database.host',
      'database.port',
      'database.username',
      'database.password',
      'database.databaseName',
    ],
    // Step 3: Tables (optional)
    [],
    // Step 4: Systems
    [ 'selectedSystems' ],
    // Step 5: Users (optional, no required fields)
    [],
    // Step 6: Review (terms checked on submit)
    [],
  ]

  async function onSubmitAll(data: WizardData) {
    if (!data.acceptedTerms) {
      alert('Please accept terms and conditions')
      return
    }
    try {
      const res = await provision.mutateAsync(data)
      if (res?.success) {
        localStorage.removeItem(STORAGE_KEY)
        alert(`✅ Tenant provisioned successfully!\n\nTenant ID: ${res.tenantId}\nURL: ${res.url || 'N/A'}\n\nRedirecting to tenant details...`)
        navigate(`/cms/tenants/${res.tenantId}`)
      } else {
        alert(`❌ Provisioning failed: ${res?.message || 'Unknown error'}`)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Provisioning failed'
      alert(`❌ Error: ${msg}`)
    }
  }

  const stepCompleted = (idx: number) => idx < step

  return (
    <div className="min-h-screen py-6">
      <div className="mb-4 flex items-center justify-between px-4">
        <div className="text-sm text-gray-500">
          <Link to="/cms/tenants" className="hover:underline">Back to Tenants</Link>
        </div>
      </div>

      {/* Progress */}
      <ol className="mx-4 mb-6 grid grid-cols-7 gap-2">
        {steps.map((s, i) => (
          <li key={s.key} className={`rounded-md px-3 py-2 text-center text-xs font-medium ${i===step?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700'} ${stepCompleted(i)?'ring-2 ring-indigo-400':''}`}>
            {i+1}. {s.title}
          </li>
        ))}
      </ol>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmitAll)} className="mx-auto w-full max-w-5xl space-y-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            {step === 0 && (
              <StepTenantInfo onValidate={async () => {
                const name = getValues('tenantInfo.companyName')
                if (name) {
                  const v = await validateName.mutateAsync({ companyName: name })
                  if (!v?.available) throw new Error('Company name already taken')
                }
                const db = await generateDb.mutateAsync({ companyName: name })
                if (db?.databaseName) setValue('database.databaseName', db.databaseName)
              }} subdomain={subdomain} />
            )}
            {step === 1 && (
              <StepSubscription plans={plansQuery.data || []} loading={plansQuery.isLoading} />
            )}
            {step === 2 && (
              <StepDatabase onTest={async () => {
                const db = getValues('database')
                const res = await testConn.mutateAsync({ host: db.host, port: db.port, username: db.username, password: db.password })
                if (!res?.success) {
                  throw new Error(res?.message || 'Connection failed')
                }
                return res
              }} />
            )}
            {step === 3 && (
              <StepTables tables={tablesQuery.data || []} loading={tablesQuery.isLoading} />
            )}
            {step === 4 && (
              <StepSystems systems={systemsQuery.data || []} loading={systemsQuery.isLoading} />
            )}
            {step === 5 && (
              <StepUsers onDownloadTemplate={() => downloadTemplate.mutate()} onValidateBulk={validateBulk.mutateAsync} />
            )}
            {step === 6 && (
              <StepReview />
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={back} disabled={step===0} className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50">Back</button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={async () => {
                const fields = stepFields[step]
                const valid = fields.length === 0 ? true : await methods.trigger(fields as any)
                if (valid) next()
              }} className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow">Next</button>
            ) : (
              <button type="submit" className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-50" disabled={provision.isLoading}>
                {provision.isLoading ? 'Saving…' : 'Save & Provision'}
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

// ------------------ Step Components (minimal skeletons) ------------------
import { useFormContext } from 'react-hook-form'

function Input({ label, name, type = 'text', placeholder, ...rest }: any) {
  const { register, formState: { errors } } = useFormContext()
  const err = name.split('.').reduce((o: any, k: string) => (o? o[k] : undefined), errors as any)
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input type={type} placeholder={placeholder} className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" {...register(name)} {...rest} />
      {err && <p className="text-xs text-red-600">{(err as any).message as any}</p>}
    </div>
  )
}

function StepTenantInfo({ onValidate, subdomain }: { onValidate: () => Promise<void>, subdomain: string }) {
  const { register, watch } = useFormContext<WizardData>()
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Company Name" name="tenantInfo.companyName" />
        <Input label="Contact Person" name="tenantInfo.contactName" />
        <Input label="Email" name="tenantInfo.email" type="email" />
        <Input label="Phone" name="tenantInfo.phone" />
        <Input label="Country" name="tenantInfo.country" />
        <Input label="Timezone" name="tenantInfo.timezone" />
      </div>
      <div className="text-sm text-gray-600">Subdomain: <span className="font-medium">{subdomain ? `${subdomain}.ourdomain.com` : '-'}</span></div>
      <div>
        <button type="button" onClick={onValidate} className="rounded-md border px-4 py-2 text-sm">Validate</button>
      </div>
    </div>
  )
}

function StepSubscription({ plans, loading }: { plans: any[], loading: boolean }) {
  const { setValue, watch } = useFormContext<WizardData>()
  const billing = watch('subscription.billingCycle')
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className={`text-xs rounded-full px-2 py-1 ${billing==='monthly'?'bg-indigo-50 text-indigo-700':'bg-gray-100 text-gray-700'}`}>Monthly</span>
        <label className="inline-flex cursor-pointer items-center">
          <input type="checkbox" className="sr-only" checked={billing==='yearly'} onChange={(e) => setValue('subscription.billingCycle', e.target.checked ? 'yearly' : 'monthly')} />
          <span className="relative h-6 w-11 rounded-full bg-gray-200">
            <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ${billing==='yearly'?'translate-x-5':''}`}></span>
          </span>
        </label>
        <span className={`text-xs rounded-full px-2 py-1 ${billing==='yearly'?'bg-green-50 text-green-700':'bg-gray-100 text-gray-700'}`}>Yearly - Save 15%</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(plans || []).map((p: any) => (
          <button key={p.id} type="button" onClick={() => setValue('subscription.planId', p.id)} className="rounded-lg border p-4 text-left hover:border-indigo-400">
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="text-2xl font-bold">{p.price}</div>
            <div className="text-xs text-gray-500">Users: {p.maxUsers} • Storage: {p.storage}</div>
            <ul className="mt-2 list-disc pl-5 text-xs text-gray-600">
              {(p.features||[]).map((f: string) => <li key={f}>{f}</li>)}
            </ul>
          </button>
        ))}
        {loading && <div className="col-span-3 text-sm text-gray-500">Loading plans…</div>}
      </div>
    </div>
  )
}

function StepDatabase({ onTest }: { onTest: () => Promise<void> }) {
  const [testStatus, setTestStatus] = React.useState<{ success?: boolean; message?: string } | null>(null)
  const [testing, setTesting] = React.useState(false)
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Host" name="database.host" />
        <Input label="Port" name="database.port" type="number" />
        <Input label="Username" name="database.username" />
        <Input label="Password" name="database.password" type="password" />
        <Input label="Database Name" name="database.databaseName" />
      </div>
      <div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" {...(useFormContext() as any).register('database.encryption')} /> Enable Encryption
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button 
          type="button" 
          onClick={async () => {
            setTesting(true)
            setTestStatus(null)
            try {
              await onTest()
              setTestStatus({ success: true, message: 'Connection successful!' })
            } catch (err: any) {
              const msg = err?.response?.data?.message || err?.message || 'Connection failed'
              setTestStatus({ success: false, message: msg })
            } finally {
              setTesting(false)
            }
          }}
          disabled={testing}
          className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        {testStatus && (
          <span className={`text-sm font-medium ${testStatus.success ? 'text-green-600' : 'text-red-600'}`}>
            {testStatus.success ? '✅' : '❌'} {testStatus.message}
          </span>
        )}
      </div>
    </div>
  )
}

function StepTables({ tables, loading }: { tables: any[], loading: boolean }) {
  const { setValue, watch } = useFormContext<WizardData>()
  const selected = watch('selectedTables') || []
  
  const toggle = (tableName: string, tableType: string) => {
    const exists = selected.find((t: any) => t.name === tableName)
    if (exists) {
      setValue('selectedTables', selected.filter((t: any) => t.name !== tableName))
    } else {
      setValue('selectedTables', [...selected, { name: tableName, type: tableType, withData: false }])
    }
  }
  
  const toggleData = (tableName: string, withData: boolean) => {
    const updated = selected.map((t: any) => 
      t.name === tableName ? { ...t, withData } : t
    )
    setValue('selectedTables', updated)
  }
  
  const selectAll = (withData: boolean = false) => {
    const allTables = (tables || []).map((t: any) => ({
      name: t.name,
      type: t.type,
      withData: t.type === 'table' ? withData : false
    }))
    setValue('selectedTables', allTables)
  }
  
  const deselectAll = () => {
    setValue('selectedTables', [])
  }
  
  const tablesList = (tables || []).filter((t: any) => t.type === 'table')
  const viewsList = (tables || []).filter((t: any) => t.type === 'view')
  const allSelected = (tables || []).length > 0 && selected.length === tables.length
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Select tables and views from cms_db to copy to the new tenant database.
        </div>
        <div className="flex items-center gap-2">
          {!allSelected ? (
            <>
              <button 
                type="button"
                onClick={() => selectAll(false)}
                className="text-xs px-3 py-1 rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                Select All (Schema Only)
              </button>
              <button 
                type="button"
                onClick={() => selectAll(true)}
                className="text-xs px-3 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50"
              >
                Select All (With Data)
              </button>
            </>
          ) : (
            <button 
              type="button"
              onClick={deselectAll}
              className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Deselect All
            </button>
          )}
        </div>
      </div>
      
      {loading && <div className="text-sm text-gray-500">Loading tables...</div>}
      
      {tablesList.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Tables</h3>
          <div className="grid grid-cols-1 gap-2">
            {tablesList.map((t: any) => {
              const isSelected = selected.some((s: any) => s.name === t.name)
              const tableConfig = selected.find((s: any) => s.name === t.name)
              return (
                <div key={t.name} className={`rounded-lg border p-3 ${isSelected ? 'border-indigo-400 bg-indigo-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggle(t.name, t.type)}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">{t.name}</span>
                    </label>
                    {isSelected && (
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={tableConfig?.withData || false}
                          onChange={(e) => toggleData(t.name, e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span>Copy data</span>
                      </label>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {viewsList.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Views</h3>
          <div className="grid grid-cols-1 gap-2">
            {viewsList.map((t: any) => {
              const isSelected = selected.some((s: any) => s.name === t.name)
              return (
                <div key={t.name} className={`rounded-lg border p-3 ${isSelected ? 'border-indigo-400 bg-indigo-50' : ''}`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggle(t.name, t.type)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-gray-500">(view)</span>
                  </label>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {!loading && tablesList.length === 0 && viewsList.length === 0 && (
        <div className="text-sm text-gray-500">No tables or views found in cms_db</div>
      )}
    </div>
  )
}

function StepSystems({ systems, loading }: { systems: any[], loading: boolean }) {
  const { setValue, watch } = useFormContext<WizardData>()
  const selected = watch('selectedSystems')
  const toggle = (id: string) => {
    const exists = selected.find(s => s.systemId === id)
    if (exists) setValue('selectedSystems', selected.filter(s => s.systemId !== id))
    else setValue('selectedSystems', [...selected, { systemId: id, enabled: true }])
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {(systems||[]).map((s: any) => (
        <button key={s.id} type="button" onClick={() => toggle(s.id)} className={`rounded-lg border p-4 text-left hover:border-indigo-400 ${selected.some(x=>x.systemId===s.id)?'ring-2 ring-indigo-400':''}`}>
          <div className="text-sm font-semibold">{s.name}</div>
          <div className="text-xs text-gray-600">{s.description}</div>
        </button>
      ))}
      {loading && <div className="col-span-3 text-sm text-gray-500">Loading systems…</div>}
    </div>
  )
}

function StepUsers({ onDownloadTemplate, onValidateBulk }: { onDownloadTemplate: () => void, onValidateBulk: (fd: FormData) => Promise<any> }) {
  const { setValue, watch } = useFormContext<WizardData>()
  const users = watch('users')
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onDownloadTemplate} className="rounded-md border px-3 py-2 text-sm">Download Template</button>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="file" accept=".csv,.xlsx" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const fd = new FormData()
            fd.append('file', f)
            const r = await onValidateBulk(fd)
            if (r?.valid && Array.isArray(r.users)) setValue('users', r.users)
          }} />
          Upload CSV/XLSX
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600"><th className="px-2 py-1">Full Name</th><th className="px-2 py-1">Email</th><th className="px-2 py-1">Role</th></tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-t"><td className="px-2 py-1">{u.fullName}</td><td className="px-2 py-1">{u.email}</td><td className="px-2 py-1">{u.role}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StepReview() {
  const { getValues, register } = useFormContext<WizardData>()
  const data = getValues()
  return (
    <div className="space-y-3 text-sm">
      <details open className="rounded border p-3"><summary className="cursor-pointer font-medium">Tenant Information</summary><pre className="mt-2 overflow-auto text-xs">{JSON.stringify(data.tenantInfo, null, 2)}</pre></details>
      <details className="rounded border p-3"><summary className="cursor-pointer font-medium">Subscription</summary><pre className="mt-2 overflow-auto text-xs">{JSON.stringify(data.subscription, null, 2)}</pre></details>
      <details className="rounded border p-3"><summary className="cursor-pointer font-medium">Database</summary><pre className="mt-2 overflow-auto text-xs">{JSON.stringify(data.database, null, 2)}</pre></details>
      <details className="rounded border p-3"><summary className="cursor-pointer font-medium">Selected Tables</summary><pre className="mt-2 overflow-auto text-xs">{JSON.stringify(data.selectedTables || [], null, 2)}</pre></details>
      <details className="rounded border p-3"><summary className="cursor-pointer font-medium">Systems</summary><pre className="mt-2 overflow-auto text-xs">{JSON.stringify(data.selectedSystems, null, 2)}</pre></details>
      <details className="rounded border p-3"><summary className="cursor-pointer font-medium">Users</summary><pre className="mt-2 overflow-auto text-xs">{JSON.stringify(data.users, null, 2)}</pre></details>
      <label className="mt-2 inline-flex items-center gap-2"><input type="checkbox" {...(register('acceptedTerms') as any)} /> I agree to the terms and conditions</label>
    </div>
  )
}



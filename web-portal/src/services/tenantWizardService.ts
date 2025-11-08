import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

// ---------- Types ----------
export interface SubscriptionPlan {
  id: string
  name: string
  price: string
  maxUsers: number
  storage: string
  features: string[]
}

export interface AvailableSystem {
  id: string
  name: string
  description: string
  icon?: string
}

export interface ValidateNameResp { available: boolean; suggestedNames?: string[] }
export interface GenerateDbResp { databaseName: string }
export interface TestDbResp { success: boolean; message?: string }
export interface ValidateBulkResp { valid: boolean; users: any[]; errors: any[] }

// Wizard DTOs (aligning with backend spec)
export interface TenantInfoDto {
  companyName: string
  contactName: string
  email: string
  phone: string
  country?: string
  timezone?: string
  logo?: string
}
export type BillingCycle = 'monthly' | 'yearly'
export interface SubscriptionDto { planId: string; billingCycle: BillingCycle; startDate?: string }
export interface DatabaseConfigDto { host: string; port: number; username: string; password: string; databaseName: string; encryption: boolean }
export interface SystemSelectionDto { systemId: string; enabled: boolean }
export interface UserPermissionDto { systemId: string; permissions: string[] }
export interface UserDto { fullName: string; email: string; role: string; systemPermissions: UserPermissionDto[]; profileData?: Record<string, any> }
export interface CreateTenantWizardDto { tenantInfo: TenantInfoDto; subscription: SubscriptionDto; database: DatabaseConfigDto; selectedSystems: SystemSelectionDto[]; users: UserDto[] }

// ---------- API Calls ----------
// Use gateway path: gateway maps /access/** to access-management-service and strips the prefix
const base = '/access/api/v1/tenants'

export async function fetchSubscriptionPlans() {
  const { data } = await api.get<SubscriptionPlan[]>(`${base}/subscription-plans`)
  return data
}

export async function validateTenantName(payload: { companyName: string }) {
  const { data } = await api.post<ValidateNameResp>(`${base}/validate-name`, payload)
  return data
}

export async function fetchAvailableSystems() {
  const { data } = await api.get<AvailableSystem[]>(`${base}/available-systems`)
  return data
}

export interface SourceTable {
  name: string
  type: 'table' | 'view'
}

export async function fetchSourceTables() {
  const { data } = await api.get<SourceTable[]>(`${base}/source-tables`)
  return data
}

export async function generateDbName(payload: { companyName: string }) {
  const { data } = await api.post<GenerateDbResp>(`${base}/generate-db-name`, payload)
  return data
}

export async function testDbConnection(payload: { host: string; port: number; username: string; password: string }) {
  const { data } = await api.post<TestDbResp>(`${base}/test-db-connection`, payload)
  return data
}

export async function validateUsersBulk(formData: FormData) {
  const { data } = await api.post<ValidateBulkResp>(`${base}/validate-users-bulk`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data
}

export async function downloadUsersTemplate() {
  const res = await api.get(`${base}/users-template`, { responseType: 'blob' })
  const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'users-template.xlsx'
  a.click()
  window.URL.revokeObjectURL(url)
}

export async function provisionTenant(payload: CreateTenantWizardDto) {
  const { data } = await api.post(`${base}/provision`, payload)
  return data as { success: boolean; tenantId: string; url: string; message: string }
}

// ---------- Hooks ----------
export function useGetSubscriptionPlans() {
  return useQuery({ queryKey: ['wizard', 'subscription-plans'], queryFn: fetchSubscriptionPlans, staleTime: 15 * 60 * 1000 })
}

export function useValidateTenantName() {
  return useMutation({ mutationFn: validateTenantName })
}

export function useGetAvailableSystems() {
  return useQuery({ queryKey: ['wizard', 'available-systems'], queryFn: fetchAvailableSystems, staleTime: 15 * 60 * 1000 })
}

export function useGetSourceTables() {
  return useQuery({ queryKey: ['wizard', 'source-tables'], queryFn: fetchSourceTables, staleTime: 5 * 60 * 1000 })
}

export function useGenerateDbName() {
  return useMutation({ mutationFn: generateDbName })
}

export function useTestDbConnection() {
  return useMutation({ mutationFn: testDbConnection })
}

export function useValidateUsersBulk() {
  return useMutation({ mutationFn: validateUsersBulk })
}

export function useDownloadUsersTemplate() {
  return useMutation({ mutationFn: downloadUsersTemplate })
}

export function useProvisionTenant() {
  return useMutation({ mutationFn: provisionTenant })
}



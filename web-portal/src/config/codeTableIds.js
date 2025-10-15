/**
 * Code Table UUIDs Configuration
 * 
 * These UUIDs reference code_tables in the database.
 * To get these values, run the SQL query in:
 * access-management-service/GET_CODE_TABLE_UUIDS.sql
 * 
 * Usage:
 *   import { CODE_TABLE_IDS } from '@/config/codeTableIds'
 *   const currencyId = CODE_TABLE_IDS.CURRENCY
 */

export const CODE_TABLE_IDS = {
  // ✅ All UUIDs confirmed from database
  BILLING_CYCLE: '8364e68d-b9f4-481d-a543-d32eb8bfbf09',
  COUNTRY: 'd1006514-0088-473b-8990-68f564cfa7f2',
  CURRENCY: '0e351629-526f-44d6-8912-737be0466c88',
  INDUSTRY_TYPE: '0d3797b1-9e13-44f7-ac77-142554719432',
  SUBSCRIPTION_PLAN: 'cc5dc23f-ee7b-41da-b2ae-32a8445a4dc4',
}

/**
 * Helper function to build cascade dropdown config
 * 
 * @param {string} codeTableId - UUID of the code table
 * @param {boolean} required - Whether the field is required
 * @returns {Object} - Configuration object for CrudPage field
 * 
 * @example
 * const currencyField = buildCascadeDropdownField(
 *   CODE_TABLE_IDS.CURRENCY, 
 *   true
 * )
 */
export function buildCascadeDropdownField(codeTableId, required = false) {
  return {
    apiUrl: '/access/api/cascade-dropdowns/access.code-table-values-by-table',
    apiParams: { codeTableId },
    valueKey: 'id',
    labelKey: 'name',
    required
  }
}

/**
 * Helper function to create a complete field config
 * 
 * @param {string} name - Field name (e.g., 'billingCurrencyId')
 * @param {string} label - Field label (e.g., 'Billing Currency')
 * @param {string} codeTableId - UUID of the code table
 * @param {boolean} required - Whether the field is required
 * @returns {Object} - Complete field configuration
 * 
 * @example
 * const currencyField = createCascadeField(
 *   'billingCurrencyId',
 *   'Billing Currency',
 *   CODE_TABLE_IDS.CURRENCY,
 *   true
 * )
 */
export function createCascadeField(name, label, codeTableId, required = false) {
  return {
    type: 'select',
    name,
    label,
    required,
    ...buildCascadeDropdownField(codeTableId, required)
  }
}

/**
 * Pre-configured tenant fields
 * Ready to use in TenantList or TenantDetails
 * 
 * @example
 * import { TENANT_CASCADE_FIELDS } from '@/config/codeTableIds'
 * 
 * const tenantFields = [
 *   { type: 'text', name: 'name', label: 'Tenant Name', required: true },
 *   ...TENANT_CASCADE_FIELDS
 * ]
 */
export const TENANT_CASCADE_FIELDS = [
  createCascadeField(
    'industryTypeId',
    'Industry Type',
    CODE_TABLE_IDS.INDUSTRY_TYPE,
    false
  ),
  createCascadeField(
    'subscriptionPlanId',
    'Subscription Plan',
    CODE_TABLE_IDS.SUBSCRIPTION_PLAN,
    false
  ),
  createCascadeField(
    'billingCurrencyId',
    'Billing Currency',
    CODE_TABLE_IDS.CURRENCY,
    true
  ),
  createCascadeField(
    'billingCycleId',
    'Billing Cycle',
    CODE_TABLE_IDS.BILLING_CYCLE,
    false
  ),
  createCascadeField(
    'countryId',
    'Country',
    CODE_TABLE_IDS.COUNTRY,
    true
  ),
]


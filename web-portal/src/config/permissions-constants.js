/**
 * PERMISSIONS CONSTANTS
 * 
 * ⚠️ IMPORTANT: These values MUST match exactly with backend data
 * If you change anything here, make sure it matches the backend
 * 
 * To verify the correct names, check the API response:
 * GET /auth/me/permissions
 */

// ============================================
// SYSTEMS
// ============================================
export const SYSTEMS = {
  // Content Management System
  CMS: 'Content Management System',
  
  // Appointments System  
  APPOINTMENTS: 'Appointments',
  
  // Chatbot AI System
  CHATBOT: 'ChatbotAI',
  
  // Access Management System
  ACCESS_MANAGEMENT: 'Access Management',
  
  // Data Analysis Service
  DAS: 'Data Analysis Service',
}

// ============================================
// TENANTS (Access Management System)
// ============================================
// NOTE: Tenants are NOT part of CMS!
// They belong to "Access Management" System with sections:
//   - "Tenants" (CRUD for tenants)
//   - "Tenants Subscription" (CRUD for subscriptions)
export const TENANTS = {
  ACCESS_MANAGEMENT: 'Access Management',
}

// Access Management Sections
export const ACCESS_SECTIONS = {
  TENANTS: 'Tenants',
  SUBSCRIPTIONS: 'Tenants Subscription',
}

// ============================================
// SECTIONS (CMS)
// ============================================
export const CMS_SECTIONS = {
  CODE_TABLE: 'Code Table',
  CODE_COUNTRY: 'Code Country',
  LOCATION: 'Location',
  USER_MANAGEMENT: 'User Management',
  ROLES: 'Roles',
  SYSTEMS: 'System',
  SECTIONS: 'System Section',
  ORGANIZATION: 'Organization',  // Main Organization entity
  ORGANIZATIONS: 'Organizations',  // For backwards compatibility
  ACTIONS: 'System Section Action',
  TENANTS: 'Tenants',
  SUBSCRIPTIONS: 'Tenants Subscription',  // Note: "Tenants Subscription" not "Tenant Subscriptions"
  TEST_CMS: 'Test CMS',  // Test section
}

// ============================================
// ACTION CODES
// ============================================

/**
 * Code Table Action Codes
 * Based on your API response
 */
export const CODE_TABLE_ACTIONS = {
  CREATE: 'CRE',        // "Create Code Table"
  DELETE: 'Del',        // "Delete Code Table"
  LIST: 'List',         // "List Code Table"
  UPDATE: 'UP',         // "Update Code Table"
}

/**
 * Code Country Action Codes
 * Based on your API response
 */
export const CODE_COUNTRY_ACTIONS = {
  CREATE: 'CRE',        // "Create Code Country"
  DELETE: 'Del',        // "Delete Code Country"
  LIST: 'List',         // "List Code Country"
  UPDATE: 'UP',         // "Update Code Country"
}

/**
 * Location Action Codes
 * Based on your API response
 */
export const LOCATION_ACTIONS = {
  CREATE: 'CRE',        // "Create Location"
  DELETE: 'Del',        // "Delete Location"
  LIST: 'List',         // "List Location"
  UPDATE: 'UP',         // "Update Location"
}

/**
 * User Management Action Codes
 * Based on your API response
 */
export const USER_MANAGEMENT_ACTIONS = {
  CREATE: 'CRE',   // "Create User"
  DELETE: 'Del',   // "Delete User"
  LIST: 'List',    // "List Users"
  UPDATE: 'UP',    // "Update User"
}

/**
 * System Action Codes
 * All CMS sections use the same pattern
 */
export const SYSTEM_ACTIONS = {
  CREATE: 'CRE',   // "Create System"
  DELETE: 'Del',   // "Delete System"
  LIST: 'List',    // "List Systems"
  UPDATE: 'UP',    // "Update System"
}

/**
 * System Section Action Codes
 */
export const SYSTEM_SECTION_ACTIONS = {
  CREATE: 'CRE',   // "Create System Section"
  DELETE: 'Del',   // "Delete System Section"
  LIST: 'List',    // "List System Section"
  UPDATE: 'UP',    // "Update System Section"
}

/**
 * System Section Action (Actions page) Codes
 */
export const SECTION_ACTION_ACTIONS = {
  CREATE: 'CRE',
  DELETE: 'Del',
  LIST: 'List',
  UPDATE: 'UP',
}

/**
 * Tenants Action Codes
 */
export const TENANTS_ACTIONS = {
  CREATE: 'CRE',
  DELETE: 'Del',
  LIST: 'List',
  UPDATE: 'UP',
}

/**
 * Tenants Subscription Action Codes
 */
export const SUBSCRIPTIONS_ACTIONS = {
  CREATE: 'CRE',
  DELETE: 'Del',
  LIST: 'List',
  UPDATE: 'UP',
}

/**
 * Appointments Action Codes
 * Example - adjust based on your actual data
 */
export const APPOINTMENTS_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  LIST: 'list',
  DELETE: 'delete',
  CANCEL: 'cancel',
}

export const ORGANIZATIONS_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  LIST: 'list',
  DELETE: 'delete',
  CANCEL: 'cancel',
}

// ============================================
// DAS SECTIONS
// ============================================
export const DAS_SECTIONS = {
  FILES: 'Files',
  DATASETS: 'Datasets',
  ANALYSIS: 'Analysis',
  PIPELINES: 'Pipelines',
  JOBS: 'Jobs',
}

/**
 * DAS Action Codes
 */
export const DAS_ACTIONS = {
  CREATE: 'CRE',
  DELETE: 'Del',
  LIST: 'List',
  UPDATE: 'UP',
  UPLOAD: 'Upload',
  DOWNLOAD: 'Download',
  VALIDATE: 'Validate',
  JOIN: 'Join',
  PROFILE: 'Profile',
  EXECUTE: 'Execute',
}

// ============================================
// MENU ITEMS CONFIGURATION
// ============================================

/**
 * CMS Menu Items
 * Used in Home.jsx to show/hide menu items based on permissions
 */
export const CMS_MENU_ITEMS = [
  {
    id: 'systems',
    to: 'systems',
    label: 'Systems',
    sectionName: CMS_SECTIONS.SYSTEMS,
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'sections',
    to: 'sections',
    label: 'Sections',
    sectionName: CMS_SECTIONS.SECTIONS,
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'actions',
    to: 'actions',
    label: 'Actions',
    sectionName: CMS_SECTIONS.ACTIONS,
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'organizations',
    to: 'organizations',
    label: 'Organizations',
    sectionName: CMS_SECTIONS.CODE_COUNTRY, // Use CODE_COUNTRY permissions (same as Countries)
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'organizationBranches',
    to: 'organization-branches',
    label: 'Organization Branches',
    sectionName: CMS_SECTIONS.CODE_COUNTRY, // Use CODE_COUNTRY permissions (same as Countries)
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'dutyStations',
    to: 'duty-stations',
    label: 'Duty Stations',
    sectionName: CMS_SECTIONS.CODE_COUNTRY, // Use CODE_COUNTRY permissions (same as Countries)
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'tenants',
    to: 'tenants',
    label: 'Tenants',
    sectionName: CMS_SECTIONS.TENANTS,
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'users',
    to: 'users',
    label: 'Users',
    sectionName: CMS_SECTIONS.USER_MANAGEMENT,
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'roles',
    to: 'roles',
    label: 'Roles',
    sectionName: CMS_SECTIONS.ROLES,
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'subscriptions',
    to: 'subscriptions',
    label: 'Tenant Subscriptions',
    sectionName: CMS_SECTIONS.SUBSCRIPTIONS,
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'codeTable',
    to: 'codeTable',
    label: 'Code Table',
    sectionName: CMS_SECTIONS.CODE_TABLE,
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'codeCountry',
    to: 'codeCountry',
    label: 'Countries',
    sectionName: CMS_SECTIONS.CODE_COUNTRY,
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'location',
    to: 'location',
    label: 'Country Location (City, District, Sub-District...)',
    sectionName: CMS_SECTIONS.CODE_COUNTRY, // Use CODE_COUNTRY permissions (same as Countries)
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'location-ocha',
    to: 'location-ocha',
    label: 'Location Syria OCHA',
    sectionName: CMS_SECTIONS.CODE_TABLE,
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  {
    id: 'operations',
    to: 'operations',
    label: 'Operations',
    sectionName: CMS_SECTIONS.CODE_COUNTRY, // Use CODE_COUNTRY permissions (same as Countries)
    systemName: SYSTEMS.CMS,
    requiredPermission: 'List',
  },
  
]

// ============================================
// SCOPE CONSTANTS (if needed)
// ============================================

/**
 * Gender Scope IDs
 * From your API response
 */
export const GENDER_SCOPES = {
  FEMALE: 'b9002472-a2c2-4f62-9a9f-7571ccdb7fde',
  MALE: '4cb34397-aba7-4b3d-8d72-627c2d107d70',
}

/**
 * Code Table IDs
 * From your API response
 */
export const CODE_TABLES = {
  GENDER: '8969b32a-2ff5-4004-9dca-ad6a2425d762',
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get section name by route path
 * @param {string} path - Route path (e.g., 'codeTable')
 * @returns {string|null} Section name or null
 */
export function getSectionNameByPath(path) {
  const item = CMS_MENU_ITEMS.find(item => item.to === path)
  return item?.sectionName || null
}

/**
 * Get system name by route path
 * @param {string} path - Route path
 * @returns {string|null} System name or null
 */
export function getSystemNameByPath(path) {
  const item = CMS_MENU_ITEMS.find(item => item.to === path)
  return item?.systemName || null
}

/**
 * Get required permission by route path
 * @param {string} path - Route path
 * @returns {string|null} Required permission code or null
 */
export function getRequiredPermissionByPath(path) {
  const item = CMS_MENU_ITEMS.find(item => item.to === path)
  return item?.requiredPermission || null
}

// ============================================
// EXPORT ALL
// ============================================

export default {
  SYSTEMS,
  CMS_SECTIONS,
  CODE_TABLE_ACTIONS,
  CODE_COUNTRY_ACTIONS,
  LOCATION_ACTIONS,
  USER_MANAGEMENT_ACTIONS,
  APPOINTMENTS_ACTIONS,
  CMS_MENU_ITEMS,
  GENDER_SCOPES,
  CODE_TABLES,
  getSectionNameByPath,
  getSystemNameByPath,
  getRequiredPermissionByPath,
}


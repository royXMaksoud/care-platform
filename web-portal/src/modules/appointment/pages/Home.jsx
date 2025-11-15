import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  FileText,
  Users,
  CalendarCheck,
  Shield,
  Settings,
  BookOpen,
  CalendarDays,
  Star,
  Building2,
  BarChart3,
  FileSpreadsheet,
  Search,
} from 'lucide-react'
import { useFastAccessShortcuts } from '@/hooks/useFastAccessShortcuts'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'
import { useTranslation } from 'react-i18next'
import { SYSTEM_SECTIONS } from '@/config/systemSectionConstants'
import { useSystemSectionScopes } from '@/modules/appointment/hooks/useSystemSectionScopes'

const CATEGORY_ORDER = ['Analytics', 'Operations', 'Users', 'Reference', 'Scheduling', 'Configuration']

// Map each section to its required system section for permission checking
const SECTION_PERMISSION_MAP = {
  'dashboard': 'APPOINTMENT_REPORTING_AND_ANALYTICS',
  'excel': 'APPOINTMENT_REPORTING_AND_ANALYTICS',
  'aiQuickPrediction': 'APPOINTMENT_REPORTING_AND_ANALYTICS',
  'appointments': 'APPOINTMENT_SCHEDULING',
  'schedules': 'APPOINTMENT_SCHEDULING',
  'holidays': 'APPOINTMENT_SCHEDULING',
  'branchServices': 'Appointment_SETUP_AND_CONFIGURATION',
  'beneficiaries': 'Appointment_USERS',
  'serviceTypes': 'Appointment_Reference_Data',
  'actionTypes': 'Appointment_Reference_Data',
  'appointmentStatuses': 'Appointment_Reference_Data',
}

const RAW_SECTIONS = [
  {
    id: 'dashboard',
    category: 'Analytics',
    titleKey: 'appointment.home.sections.dashboard.title',
    descriptionKey: 'appointment.home.sections.dashboard.description',
    defaultTitle: 'Dashboard',
    defaultDescription: 'Analytics and reporting with advanced visualizations and center metrics.',
    icon: BarChart3,
    path: '/appointment/reports/dashboard',
  },
  {
    id: 'excel',
    category: 'Analytics',
    titleKey: 'appointment.home.sections.excel.title',
    descriptionKey: 'appointment.home.sections.excel.description',
    defaultTitle: 'Excel Reports',
    defaultDescription: 'Generate and download Excel-based appointment analytics reports.',
    icon: FileSpreadsheet,
    path: '/appointment/reports/excel',
  },
  {
    id: 'aiQuickPrediction',
    category: 'Analytics',
    titleKey: 'appointment.home.sections.aiQuickPrediction.title',
    descriptionKey: 'appointment.home.sections.aiQuickPrediction.description',
    defaultTitle: 'AI Quick Prediction',
    defaultDescription: 'Run instant no-show predictions powered by the AI risk engine.',
    icon: Star,
    path: '/appointment/ai/quick-prediction',
  },
  {
    id: 'appointments',
    category: 'Operations',
    titleKey: 'appointment.home.sections.appointments.title',
    descriptionKey: 'appointment.home.sections.appointments.description',
    defaultTitle: 'Appointments',
    defaultDescription: 'View and manage appointments, update statuses, transfer, and cancel.',
    icon: Calendar,
    path: '/appointment/appointments',
  },
  {
    id: 'branchServices',
    category: 'Configuration',
    titleKey: 'appointment.home.sections.branchServices.title',
    descriptionKey: 'appointment.home.sections.branchServices.description',
    defaultTitle: 'Branch Service Mapping',
    defaultDescription: 'Configure services and pricing available at each organization branch.',
    icon: Building2,
    path: '/appointment/branch-services',
  },
  {
    id: 'beneficiaries',
    category: 'Users',
    titleKey: 'appointment.home.sections.beneficiaries.title',
    descriptionKey: 'appointment.home.sections.beneficiaries.description',
    defaultTitle: 'Beneficiaries',
    defaultDescription: 'Manage patients and service recipients.',
    icon: Users,
    path: '/appointment/beneficiaries',
  },
  {
    id: 'serviceTypes',
    category: 'Reference',
    titleKey: 'appointment.home.sections.serviceTypes.title',
    descriptionKey: 'appointment.home.sections.serviceTypes.description',
    defaultTitle: 'Service Types',
    defaultDescription: 'Define and organize service types (general and detailed categories).',
    icon: FileText,
    path: '/appointment/service-types',
  },
  {
    id: 'actionTypes',
    category: 'Reference',
    titleKey: 'appointment.home.sections.actionTypes.title',
    descriptionKey: 'appointment.home.sections.actionTypes.description',
    defaultTitle: 'Action Types',
    defaultDescription: 'Configure appointment outcomes such as arrived, completed, or no-show.',
    icon: Shield,
    path: '/appointment/action-types',
  },
  {
    id: 'appointmentStatuses',
    category: 'Reference',
    titleKey: 'appointment.home.sections.appointmentStatuses.title',
    descriptionKey: 'appointment.home.sections.appointmentStatuses.description',
    defaultTitle: 'Appointment Statuses',
    defaultDescription: 'Manage appointment workflow statuses and localized labels.',
    icon: CalendarCheck,
    path: '/appointment/statuses',
  },
  {
    id: 'holidays',
    category: 'Scheduling',
    titleKey: 'appointment.home.sections.holidays.title',
    descriptionKey: 'appointment.home.sections.holidays.description',
    defaultTitle: 'Holiday Management',
    defaultDescription: 'Configure holidays, off-days, and recurring yearly events.',
    icon: CalendarDays,
    path: '/appointment/holidays',
  },
  {
    id: 'schedules',
    category: 'Scheduling',
    titleKey: 'appointment.home.sections.schedules.title',
    descriptionKey: 'appointment.home.sections.schedules.description',
    defaultTitle: 'Schedule Management',
    defaultDescription: 'Manage weekly schedules, working hours, and slot configurations for centers.',
    icon: Clock,
    path: '/appointment/schedules',
  },
]

const baseCategoryTheme = {
  icon: Settings,
  label: '',
  caption: 'Core modules and configuration',
  accent: 'text-slate-800',
  badgeClass: 'border border-slate-200 bg-slate-100 text-slate-600',
  iconGradient: 'from-slate-600 to-slate-500',
  cardBorder: 'border-slate-200',
  cardBackground: 'from-slate-50 via-white to-white',
}

export default function AppointmentHome() {
  const { t } = useTranslation()
  const { toggleShortcut, isPinned } = useFastAccessShortcuts()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')

  // Get scopes for each permission section needed
  const analyticsPermissions = useSystemSectionScopes(SYSTEM_SECTIONS.APPOINTMENT_REPORTING_AND_ANALYTICS)
  const schedulingPermissions = useSystemSectionScopes(SYSTEM_SECTIONS.APPOINTMENT_SCHEDULING)
  const configPermissions = useSystemSectionScopes(SYSTEM_SECTIONS.Appointment_SETUP_AND_CONFIGURATION)
  const usersPermissions = useSystemSectionScopes(SYSTEM_SECTIONS.Appointment_USERS)
  const referencePermissions = useSystemSectionScopes(SYSTEM_SECTIONS.Appointment_Reference_Data)

  // Create a map of permission section names to their access status
  const permissionAccessMap = useMemo(() => ({
    'APPOINTMENT_REPORTING_AND_ANALYTICS': analyticsPermissions.hasAccess,
    'APPOINTMENT_SCHEDULING': schedulingPermissions.hasAccess,
    'Appointment_SETUP_AND_CONFIGURATION': configPermissions.hasAccess,
    'Appointment_USERS': usersPermissions.hasAccess,
    'Appointment_Reference_Data': referencePermissions.hasAccess,
  }), [
    analyticsPermissions.hasAccess,
    schedulingPermissions.hasAccess,
    configPermissions.hasAccess,
    usersPermissions.hasAccess,
    referencePermissions.hasAccess,
  ])

  // Helper function to check if user has permission for a section
  const hasPermissionForSection = (sectionId) => {
    const permissionSection = SECTION_PERMISSION_MAP[sectionId]
    if (!permissionSection) return true // If no permission mapping, allow access
    return permissionAccessMap[permissionSection] ?? false
  }

  const sections = useMemo(
    () =>
      RAW_SECTIONS.map((section) => ({
        ...section,
        title: t(section.titleKey, { defaultValue: section.defaultTitle }),
        description: t(section.descriptionKey, { defaultValue: section.defaultDescription }),
      })),
    [t]
  )

  const categoryMeta = useMemo(
    () => ({
      Analytics: {
        ...baseCategoryTheme,
        icon: BarChart3,
        label: t('appointment.home.categories.analytics', { defaultValue: 'Analytics' }),
        caption: t('appointment.home.categoryDescriptions.analytics', { defaultValue: 'Insights and reporting dashboards' }),
        accent: 'text-[#0b4ea2]',
        badgeClass: 'border border-blue-200 bg-blue-50 text-[#0b4ea2]',
        iconGradient: 'from-[#0b4ea2] to-[#1276d1]',
        cardBorder: 'border-blue-200',
        cardBackground: 'from-blue-900/5 via-white to-blue-50',
      },
      Operations: {
        ...baseCategoryTheme,
        icon: Calendar,
        label: t('appointment.home.categories.operations', { defaultValue: 'Operations' }),
        caption: t('appointment.home.categoryDescriptions.operations', { defaultValue: 'Daily scheduling and workflow tools' }),
        accent: 'text-slate-800',
        badgeClass: 'border border-slate-300 bg-slate-100 text-slate-700',
        iconGradient: 'from-slate-600 to-slate-500',
        cardBorder: 'border-slate-300',
        cardBackground: 'from-slate-900/5 via-white to-slate-50',
      },
      Users: {
        ...baseCategoryTheme,
        icon: Users,
        label: t('appointment.home.categories.users', { defaultValue: 'Users' }),
        caption: t('appointment.home.categoryDescriptions.users', { defaultValue: 'Beneficiaries and stakeholder management' }),
        accent: 'text-slate-800',
        badgeClass: 'border border-blue-200 bg-blue-50 text-blue-800',
        iconGradient: 'from-blue-700 to-slate-600',
        cardBorder: 'border-blue-200',
        cardBackground: 'from-blue-900/5 via-white to-slate-50',
      },
      Reference: {
        ...baseCategoryTheme,
        icon: BookOpen,
        label: t('appointment.home.categories.reference', { defaultValue: 'Reference' }),
        caption: t('appointment.home.categoryDescriptions.reference', { defaultValue: 'Standards, lookups, and governance' }),
        accent: 'text-blue-700',
        badgeClass: 'border border-blue-200 bg-blue-50 text-blue-700',
        iconGradient: 'from-blue-700 to-blue-500',
        cardBorder: 'border-blue-200',
        cardBackground: 'from-blue-900/5 via-white to-slate-100',
      },
      Scheduling: {
        ...baseCategoryTheme,
        icon: CalendarDays,
        label: t('appointment.home.categories.scheduling', { defaultValue: 'Scheduling' }),
        caption: t('appointment.home.categoryDescriptions.scheduling', { defaultValue: 'Availability and working calendars' }),
        accent: 'text-cyan-700',
        badgeClass: 'border border-cyan-200 bg-cyan-50 text-cyan-700',
        iconGradient: 'from-blue-700 to-cyan-600',
        cardBorder: 'border-cyan-200',
        cardBackground: 'from-blue-900/5 via-white to-cyan-50',
      },
      Configuration: {
        ...baseCategoryTheme,
        icon: Settings,
        label: t('appointment.home.categories.configuration', { defaultValue: 'Configuration' }),
        caption: t('appointment.home.categoryDescriptions.configuration', { defaultValue: 'Global parameters and system tailoring' }),
        accent: 'text-slate-800',
        badgeClass: 'border border-slate-300 bg-slate-100 text-slate-700',
        iconGradient: 'from-slate-700 to-blue-700',
        cardBorder: 'border-slate-300',
        cardBackground: 'from-slate-900/5 via-white to-blue-50',
      },
    }),
    [t]
  )

  const filteredSections = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    return RAW_SECTIONS.map((section) => ({
      ...section,
      title: t(section.titleKey, { defaultValue: section.defaultTitle }),
      description: t(section.descriptionKey, { defaultValue: section.defaultDescription }),
    }))
      .filter((section) => {
        // Filter by permissions first - hide sections user doesn't have access to
        if (!hasPermissionForSection(section.id)) return false

        const matchesCategory = activeCategory === 'ALL' || section.category === activeCategory
        if (!matchesCategory) return false
        if (!normalized) return true
        const title = section.title.toLowerCase()
        const description = section.description?.toLowerCase?.() ?? ''
        return title.includes(normalized) || description.includes(normalized)
      })
  }, [t, searchTerm, activeCategory, hasPermissionForSection])

  const sectionsByCategory = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => {
        const items = filteredSections.filter((section) => section.category === category)
        if (items.length === 0) return null
        const meta = categoryMeta[category] ?? {
          ...baseCategoryTheme,
          icon: Settings,
          label: category,
        }
        return { category, meta, items }
      }).filter(Boolean),
    [filteredSections, categoryMeta]
  )

  const statsCards = useMemo(
    () => [
      {
        id: 'modules',
        value: sections.length,
        label: 'Available Modules',
        icon: BookOpen,
      },
      {
        id: 'categories',
        value: sectionsByCategory.length,
        label: 'Active Categories',
        icon: CalendarDays,
      },
      {
        id: 'visible',
        value: filteredSections.length,
        label: 'Visible Results',
        icon: Star,
      },
    ],
    [sections.length, sectionsByCategory.length, filteredSections.length]
  )

  const handleToggleShortcut = (event, section, label) => {
    event.preventDefault()
    event.stopPropagation()
    toggleShortcut({
      path: section.path,
      title: section.title,
      badge: label ?? section.category,
      module: 'appointment',
    })
  }

  const activeFilterClass = 'border-[#0b4ea2] bg-[#0b4ea2] text-white shadow-sm'
  const inactiveFilterClass = 'border-slate-300 bg-white text-slate-600 hover:border-[#0b4ea2]/60 hover:text-[#0b4ea2]'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AppointmentBreadcrumb />

        <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0b4ea2]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0b4ea2]">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#0b4ea2]" />
              {t('appointment.home.heroBadge', { defaultValue: 'Appointments' })}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                {t('appointment.home.heroTitle', { defaultValue: 'Appointment Management' })}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600">
                {t('appointment.home.heroSubtitle', {
                  defaultValue:
                    'All tools for scheduling, analytics, and configuration in one workspace.',
                })}
              </p>
            </div>
          </div>

          <div className="relative w-full max-w-md">
            <label className="block text-sm font-semibold text-slate-600">
              {t('appointment.home.searchLabel', { defaultValue: 'Search modules' })}
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('appointment.home.searchPlaceholder', {
                  defaultValue: 'Search by module name or description...',
                })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm text-slate-700 shadow-sm transition focus:border-[#0b4ea2]/50 focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]/10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-slate-600"
                  aria-label={t('appointment.home.clearSearch', { defaultValue: 'Clear search' })}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && filteredSections.length > 0 && (
              <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
                {t(
                  filteredSections.length === 1
                    ? 'appointment.home.searchResultSingular'
                    : 'appointment.home.searchResultPlural',
                  {
                    count: filteredSections.length,
                    defaultValue:
                      filteredSections.length === 1
                        ? '1 module found'
                        : `${filteredSections.length} modules found`,
                  }
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-10 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t('appointment.home.quickFilters', { defaultValue: 'Quick filters' })}
            </p>
            <div className="flex flex-wrap gap-2">
              {['ALL', ...CATEGORY_ORDER].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    activeCategory === category ? activeFilterClass : inactiveFilterClass
                  }`}
                >
                  {t(`appointment.home.filters.${category.toLowerCase()}`, {
                    defaultValue: category === 'ALL' ? 'All' : category,
                  })}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {sectionsByCategory.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-12 text-center text-slate-500 shadow-sm">
              {t('appointment.home.noResults', { defaultValue: 'No modules match your current search.' })}
            </div>
          )}

          {sectionsByCategory.map((group) => (
            <section
              key={group.category}
              className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${group.meta.iconGradient} text-white shadow-sm`}>
                    <group.meta.icon className="h-5 w-5" strokeWidth={2.4} />
                  </div>
                  <div>
                    <h2 className={`text-sm font-semibold uppercase tracking-wide ${group.meta.accent}`}>
                      {group.meta.label}
                    </h2>
                    <p className="text-xs text-slate-500">{group.meta.caption}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {group.items.length}{' '}
                  {group.items.length === 1
                    ? t('appointment.home.moduleSingular', { defaultValue: 'module' })
                    : t('appointment.home.modulePlural', { defaultValue: 'modules' })}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((section) => {
                  const pinned = isPinned(section.path)
                  const SectionIcon = section.icon
                  return (
                    <Link
                      key={section.id}
                      to={section.path}
                      className="group/item block rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm transition hover:-translate-y-1 hover:border-[#0b4ea2]/30 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${group.meta.iconGradient} text-white shadow-sm`}>
                          <SectionIcon className="h-4.5 w-4.5" strokeWidth={2.2} />
                        </div>
                        <button
                          type="button"
                          aria-label={
                            pinned
                              ? t('appointment.home.removeShortcut', { defaultValue: 'Remove from fast access' })
                              : t('appointment.home.addShortcut', { defaultValue: 'Add to fast access' })
                          }
                          onClick={(event) => handleToggleShortcut(event, section, group.meta.label)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                            pinned
                              ? 'border-amber-400 bg-amber-50 text-amber-500'
                              : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                          }`}
                        >
                          <Star className="h-4 w-4" strokeWidth={2} fill={pinned ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <h3 className="mt-3 text-base font-semibold text-slate-900 group-hover/item:text-[#0b4ea2]">
                        {section.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{section.description}</p>

                      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400 transition group-hover/item:text-[#0b4ea2]">
                        <span>{t('appointment.home.manageCta', { defaultValue: 'Manage' })}</span>
                        <svg className="h-3.5 w-3.5 transition-transform group-hover/item:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statsCards.map((stat) => {
            const StatIcon = stat.icon
            return (
              <div
                key={stat.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm transition hover:border-[#0b4ea2]/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b4ea2] to-[#1276d1] text-white shadow-sm">
                  <StatIcon className="h-5 w-5" strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


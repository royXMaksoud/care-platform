import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, FileText, Users, CalendarCheck, Shield, Settings, BookOpen, CalendarDays, Star, Building2 } from 'lucide-react'
import { useFastAccessShortcuts } from '@/hooks/useFastAccessShortcuts'

export default function AppointmentHome() {
  const sections = [
    {
      title: 'Appointments',
      description: 'View and manage all appointments, update statuses, transfer, and cancel',
      icon: Calendar,
      color: 'from-pink-500 to-rose-500',
      path: '/appointment/appointments',
      badge: 'Operations',
    },
    {
      title: 'Branch Service Mapping',
      description: 'Configure services and pricing available at each organization branch',
      icon: Building2,
      color: 'from-teal-500 to-emerald-500',
      path: '/appointment/branch-services',
      badge: 'Operations',
    },
    {
      title: 'Beneficiaries',
      description: 'Manage patients and service recipients',
      icon: Users,
      color: 'from-indigo-500 to-purple-500',
      path: '/appointment/beneficiaries',
      badge: 'Users',
    },
    {
      title: 'Service Types',
      description: 'Define and organize service types (general and detailed categories)',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      path: '/appointment/service-types',
      badge: 'Reference',
    },
    {
      title: 'Action Types',
      description: 'Configure appointment outcomes (arrived, completed, no-show, etc.)',
      icon: Shield,
      color: 'from-orange-500 to-red-500',
      path: '/appointment/action-types',
      badge: 'Reference',
    },
    {
      title: 'Appointment Statuses',
      description: 'Manage appointment workflow statuses and localized labels',
      icon: CalendarCheck,
      color: 'from-amber-500 to-orange-500',
      path: '/appointment/statuses',
      badge: 'Reference',
    },
    {
      title: 'Holiday Management',
      description: 'Configure holidays, off-days, and recurring yearly events',
      icon: CalendarCheck,
      color: 'from-green-500 to-emerald-500',
      path: '/appointment/holidays',
      badge: 'Planning',
    },
    {
      title: 'Schedule Management',
      description: 'Manage weekly schedules, working hours, and slot configurations for centers',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      path: '/appointment/schedules',
      badge: 'Configuration',
    },
  ]

  const categoryOrder = ['Operations', 'Users', 'Reference', 'Planning', 'Configuration']

  const groupedSections = categoryOrder
    .map((category) => ({
      category,
      items: sections.filter((section) => section.badge === category),
    }))
    .filter(({ items }) => items.length > 0)

  const categoryMeta = {
    Operations: {
      icon: Calendar,
      color: 'text-rose-500',
      label: 'Daily Workflows',
    },
    Users: {
      icon: Users,
      color: 'text-indigo-500',
      label: 'People & Profiles',
    },
    Reference: {
      icon: BookOpen,
      color: 'text-amber-500',
      label: 'Reference Data',
    },
    Planning: {
      icon: CalendarDays,
      color: 'text-emerald-500',
      label: 'Planning Tools',
    },
    Configuration: {
      icon: Settings,
      color: 'text-sky-500',
      label: 'Setup & Configuration',
    },
  }

  const { toggleShortcut, isPinned } = useFastAccessShortcuts()

  const handleToggleShortcut = (event, section) => {
    event.preventDefault()
    event.stopPropagation()
    toggleShortcut({
      path: section.path,
      title: section.title,
      badge: section.badge,
      module: 'appointment',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Calendar className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
              <p className="text-gray-600">Manage schedules, appointments, and center configurations</p>
            </div>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="space-y-8">
          {groupedSections.map(({ category, items }) => {
            const meta = categoryMeta[category]
            const CategoryIcon = meta?.icon ?? Calendar

            return (
              <div
                key={category}
                className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-indigo-100 backdrop-blur-sm"
              >
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    <CategoryIcon className={`h-4 w-4 ${meta?.color ?? 'text-slate-500'}`} />
                    {category}
                  </span>
                  {meta?.label && (
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {meta.label}
                    </span>
                  )}
                  <span className="ml-auto text-xs font-medium text-slate-400">
                    {items.length} {items.length === 1 ? 'module' : 'modules'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((section) => (
                    <Link
                      key={section.path}
                      to={section.path}
                      className="group block"
                    >
                      <div className="h-full rounded-xl border border-slate-200/70 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg">
                        {/* Icon & Badge */}
                        <div className="mb-4 flex items-start justify-between">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${section.color} shadow-md`}>
                            <section.icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              type="button"
                              aria-label={isPinned(section.path) ? 'Remove from fast access' : 'Add to fast access'}
                              onClick={(event) => handleToggleShortcut(event, section)}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                                isPinned(section.path)
                                  ? 'border-amber-400 bg-amber-50 text-amber-500'
                                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                              }`}
                            >
                              <Star
                                className="h-4 w-4"
                                strokeWidth={2}
                                fill={isPinned(section.path) ? 'currentColor' : 'none'}
                              />
                            </button>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                              {section.badge}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <h3 className="mb-2 text-lg font-semibold text-slate-900 transition-colors group-hover:text-slate-900">
                          {section.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-500">
                          {section.description}
                        </p>

                        {/* Arrow */}
                        <div className="mt-4 flex items-center text-sm font-medium text-slate-400 transition-all group-hover:text-slate-700">
                          <span>Manage</span>
                          <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Stats (Optional) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-white border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">7</div>
            <div className="text-sm text-gray-600">Admin Sections</div>
          </div>
          <div className="p-4 rounded-lg bg-white border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">48+</div>
            <div className="text-sm text-gray-600">API Endpoints</div>
          </div>
          <div className="p-4 rounded-lg bg-white border border-gray-200">
            <div className="text-2xl font-bold text-green-600">Active</div>
            <div className="text-sm text-gray-600">Service Status</div>
          </div>
          <div className="p-4 rounded-lg bg-white border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">2</div>
            <div className="text-sm text-gray-600">Languages (AR/EN)</div>
          </div>
        </div>
      </div>
    </div>
  )
}


import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Heart, FileText, Users, CalendarCheck, Shield } from 'lucide-react'

export default function AppointmentHome() {
  const sections = [
    {
      title: 'Schedule Management',
      description: 'Manage weekly schedules, working hours, and slot configurations for centers',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      path: '/appointment/schedules',
      badge: 'Configuration',
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
      title: 'Beneficiaries',
      description: 'Manage patients and service recipients',
      icon: Users,
      color: 'from-indigo-500 to-purple-500',
      path: '/appointment/beneficiaries',
      badge: 'Users',
    },
    {
      title: 'Appointments',
      description: 'View and manage all appointments, update statuses, transfer, and cancel',
      icon: Calendar,
      color: 'from-pink-500 to-rose-500',
      path: '/appointment/appointments',
      badge: 'Operations',
    },
  ]

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Link
              key={section.path}
              to={section.path}
              className="group block"
            >
              <div className="h-full p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-900 hover:shadow-xl transition-all duration-200">
                {/* Icon & Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md`}>
                    <section.icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">
                    {section.badge}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-900">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {section.description}
                </p>

                {/* Arrow */}
                <div className="mt-4 flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-900">
                  <span>Manage</span>
                  <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats (Optional) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-white border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">6</div>
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


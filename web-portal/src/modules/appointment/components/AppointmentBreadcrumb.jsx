import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const SEGMENT_LABELS = {
  appointments: 'Appointments',
  schedules: 'Schedules',
  holidays: 'Holidays',
  'service-types': 'Service Types',
  'action-types': 'Action Types',
  statuses: 'Appointment Statuses',
  beneficiaries: 'Beneficiaries',
  'branch-services': 'Branch Service Types',
}

const isLikelyIdentifier = (segment) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
  /^\d+$/.test(segment) ||
  segment.length > 20

const formatLabel = (segment) =>
  segment
    .replace(/-([a-z])/g, (_, letter) => ' ' + letter.toUpperCase())
    .replace(/^([a-z])/, (_, letter) => letter.toUpperCase())
    .replace(/([A-Z])/g, ' $1')
    .trim()

export default function AppointmentBreadcrumb({ currentPageLabel }) {
  const location = useLocation()
  const navigate = useNavigate()

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const segments = pathSegments[0] === 'appointment' ? pathSegments.slice(1) : pathSegments

  const breadcrumbs = [
    { label: 'Home', to: '/', isClickable: true },
    { label: 'Appointments', to: '/appointment', isClickable: true },
  ]

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
          {breadcrumbs.map((crumb, index) => (
            <li key={`${crumb.to}-${index}`} className="flex items-center">
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-slate-900">{crumb.label}</span>
              ) : (
                <>
                  <Link
                    to={crumb.to}
                    className="hover:text-slate-900 underline-offset-4 hover:underline transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(crumb.to)
                    }}
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight className="mx-1.5 h-3.5 w-3.5 opacity-60" />
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    )
  }

  let currentPath = '/appointment'

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    const normalizedSegment = segment.toLowerCase()
    currentPath += `/${segment}`

    const looksLikeId = isLikelyIdentifier(segment)

    let label = SEGMENT_LABELS[normalizedSegment] || formatLabel(segment)

    if (looksLikeId) {
      if (currentPageLabel) {
        label = currentPageLabel
      } else {
        label = 'Details'
      }
    } else if (isLast && currentPageLabel) {
      label = currentPageLabel
    }

    const isClickable = !isLast && !looksLikeId

    breadcrumbs.push({
      label,
      to: currentPath,
      isClickable,
    })
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={`${crumb.to}-${index}`} className="flex items-center">
              {isLast || !crumb.isClickable ? (
                <span className="font-medium text-slate-900">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.to}
                  className="hover:text-slate-900 underline-offset-4 hover:underline transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(crumb.to)
                  }}
                >
                  {crumb.label}
                </Link>
              )}
              {!isLast && <ChevronRight className="mx-1.5 h-3.5 w-3.5 opacity-60" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}



// Modern Page Header Component for consistent styling across all pages
import React from 'react'

/**
 * PageHeader - Professional page header with icon, title, description, and actions
 * 
 * @param {object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {React.ReactNode} props.icon - Optional icon component
 * @param {React.ReactNode} props.actions - Optional action buttons
 * @param {string} props.badge - Optional badge text
 * @param {string} props.className - Additional classes
 */
export default function PageHeader({ 
  title, 
  description, 
  icon, 
  actions, 
  badge,
  className = '' 
}) {
  return (
    <div className={`mb-6 animate-slide-in-up ${className}`}>
      {/* Badge (if provided) */}
      {badge && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium mb-3">
          {icon && <span className="w-3 h-3">{icon}</span>}
          {badge}
        </div>
      )}
      
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            {icon && !badge && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {icon}
              </div>
            )}
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {title}
            </h1>
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground max-w-3xl">
              {description}
            </p>
          )}
        </div>
        
        {/* Actions Section */}
        {actions && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * PageContainer - Wrapper for page content with consistent padding and styling
 */
export function PageContainer({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-muted/20 ${className}`}>
      <div className="gradient-mesh fixed inset-0 opacity-20 pointer-events-none"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  )
}

/**
 * PageCard - Card wrapper for page content sections
 */
export function PageCard({ children, className = '', title, actions }) {
  return (
    <div className={`bg-card rounded-2xl border shadow-modern overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
          {title && (
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          )}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

/**
 * EmptyState - Professional empty state component
 */
export function EmptyState({ 
  icon, 
  title = 'No data', 
  description = 'Get started by creating a new item.',
  action,
  actionLabel = 'Create New'
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {icon && (
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <div className="w-6 h-6 text-muted-foreground">
            {icon}
          </div>
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      
      {action && (
        <button 
          onClick={action}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover-lift transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

/**
 * LoadingState - Professional loading skeleton
 */
export function LoadingState({ rows = 5 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded-lg"></div>
      ))}
    </div>
  )
}

/**
 * ActionButton - Consistent action button styling
 */
export function ActionButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  icon,
  disabled = false,
  className = '' 
}) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-background hover:bg-muted/50',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    success: 'bg-success text-success-foreground hover:bg-success/90',
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {icon && <span className="w-3 h-3">{icon}</span>}
      {children}
    </button>
  )
}

/**
 * StatusBadge - Modern status badge
 */
export function StatusBadge({ status, label }) {
  const statusColors = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-destructive/10 text-destructive',
    info: 'bg-primary/10 text-primary',
    default: 'bg-muted text-muted-foreground',
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[status] || statusColors.default}`}>
      {label}
    </span>
  )
}


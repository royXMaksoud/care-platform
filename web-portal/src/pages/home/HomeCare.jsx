import { useQuery } from '@tanstack/react-query'
import { fetchMyPermissions } from '@/api/permissions.api'
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { resolveModulePath } from '@/config/module-routes'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Cog, Plus, Database, MessageSquare, Calendar, Bot, Bell, BarChart3, Shield, CheckCircle2, Lock, ArrowRight, Sparkles, FileText, Users, Settings } from 'lucide-react'
import { getAccessibleSystems } from '@/utils/permissions'
import { useTranslation } from 'react-i18next'

// Icon picker function with refined color assignments
function pickIcon(name = '') {
  const n = name.toLowerCase()
  if (n.includes('content')) return { Icon: FileText, color: 'from-blue-500 to-cyan-500' }
  if (n.includes('appointment')) return { Icon: Calendar, color: 'from-purple-500 to-pink-500' }
  if (n.includes('chat')) return { Icon: MessageSquare, color: 'from-green-500 to-emerald-500' }
  if (n.includes('complaint')) return { Icon: MessageSquare, color: 'from-orange-500 to-red-500' }
  if (n.includes('reference') || n.includes('data')) return { Icon: Database, color: 'from-indigo-500 to-purple-500' }
  if (n.includes('notification')) return { Icon: Bell, color: 'from-yellow-500 to-orange-500' }
  if (n.includes('report')) return { Icon: BarChart3, color: 'from-teal-500 to-cyan-500' }
  if (n.includes('access') || n.includes('auth')) return { Icon: Shield, color: 'from-red-500 to-pink-500' }
  if (n.includes('user')) return { Icon: Users, color: 'from-blue-500 to-indigo-500' }
  if (n.includes('setting')) return { Icon: Settings, color: 'from-gray-500 to-slate-500' }
  return { Icon: Sparkles, color: 'from-violet-500 to-purple-500' }
}

export default function HomeCare() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me', 'permissions'],
    queryFn: fetchMyPermissions,
    staleTime: 5 * 60 * 1000,
  })

  const [sp, setSp] = useSearchParams()
  const q = (sp.get('q') || '').toLowerCase().trim()
  const [term, setTerm] = useState(q)
  useEffect(() => setTerm(q), [q])
  const { t } = useTranslation()

  function applySearch(v) {
    const nv = (v || '').trim()
    if (!nv) setSp({}, { replace: true })
    else setSp({ q: nv }, { replace: true })
  }

  if (isLoading) return <div className="p-6 text-base">{t('common.loading')}</div>
  if (isError) return <div className="p-6 text-destructive text-base">Failed to load systems.</div>

  // Get all systems from response
  const allSystems = data?.systems || []
  
  const items = allSystems
    .map((sys, idx) => {
      // Calculate permissions
      const totalSections = sys.sections?.length || 0
      const totalActions = sys.sections?.reduce((acc, s) => acc + (s.actions?.length || 0), 0) || 0
      
      const allowedActions = sys.sections?.reduce((acc, section) => {
        const allowed = section.actions?.filter(action => {
          // Action-level permission
          if (action.effect === 'ALLOW') return true
          // Scope-level permission
          return action.scopes?.some(s => s.effect === 'ALLOW')
        }).length || 0
        return acc + allowed
      }, 0) || 0

      const hasFullAccess = allowedActions === totalActions && totalActions > 0
      const hasPartialAccess = allowedActions > 0 && allowedActions < totalActions
      const hasNoAccess = allowedActions === 0

      const iconData = pickIcon(sys.name || '')

      return {
        key: sys.systemId || `${sys.name}-${idx}`,
        systemId: sys.systemId,
        name: sys.name || 'System',
        desc: hasFullAccess 
          ? t('portal.fullAccess')
          : hasNoAccess
          ? `${totalActions} ${t('portal.actionsAvailable')}`
          : `${t('portal.accessTo')} ${allowedActions} ${t('portal.of')} ${totalActions} ${t('portal.actions')}`,
        path: resolveModulePath(sys),
        Icon: iconData.Icon,
        iconColor: iconData.color,
        sections: totalSections,
        actions: totalActions,
        allowedActions: allowedActions,
        hasFullAccess: hasFullAccess,
        hasPartialAccess: hasPartialAccess,
        hasNoAccess: hasNoAccess,
      }
    })
    .filter(it => (q ? it.name.toLowerCase().includes(q) : true))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Clean Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('portal.title')}</h1>
            <p className="text-base text-gray-500">
              {items.length} {items.length === 1 ? t('portal.oneSystem') : t('portal.systemsAvailable')}
            </p>
          </div>
          
          {/* Simple Search */}
          <form
            onSubmit={(e) => { e.preventDefault(); applySearch(term) }}
            className="flex items-center gap-2 w-full max-w-sm"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={t('portal.searchSystems')}
                className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <button 
              type="submit"
              className="px-5 py-3 text-base font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t('portal.search')}
            </button>
          </form>
        </div>
        
        {q && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-base text-gray-700">
            <Search className="h-4 w-4" strokeWidth={2.5} />
            <span>{t('portal.filtering')} <span className="font-medium">{q}</span></span>
          </div>
        )}
      </div>

      {/* Empty States */}
      {items.length === 0 && !q && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Lock className="h-8 w-8 text-gray-400" strokeWidth={2} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('portal.noSystemsAvailable')}</h3>
          <p className="text-gray-600 text-base">
            {t('portal.contactAdmin')}
          </p>
        </div>
      )}
      
      {items.length === 0 && q && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Search className="h-8 w-8 text-gray-400" strokeWidth={2} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('portal.noResultsFound')}</h3>
          <p className="text-gray-600 text-base">
            {t('portal.noSystemsMatch')} "<span className="font-medium">{q}</span>".
          </p>
        </div>
      )}

      {/* Systems Grid - Clean Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(({ key, systemId, name, desc, path, Icon, iconColor, sections, actions, allowedActions, hasFullAccess, hasPartialAccess, hasNoAccess }) => (
          <Link
            key={key}
            to={path}
            className="group relative block"
          >
            <div className="flex items-start gap-5 p-7 rounded-xl border border-gray-200 bg-white hover:border-gray-900 hover:shadow-lg transition-all duration-200">
              {/* Icon */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-sm`}>
                <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-900">
                    {name}
                  </h3>
                  
                  {/* Status Icon */}
                  {hasFullAccess && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" strokeWidth={2.5} title="Full access" />
                  )}
                  {hasPartialAccess && (
                    <Lock className="h-4 w-4 text-orange-500 flex-shrink-0" strokeWidth={2.5} title="Partial access" />
                  )}
                  {hasNoAccess && (
                    <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" strokeWidth={2.5} title="No access" />
                  )}
                </div>

                <p className="text-base text-gray-600 mb-4">{desc}</p>

                {/* Stats */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">{sections} {t('portal.sections')}</span>
                  <span className="text-gray-300">•</span>
                  {allowedActions > 0 ? (
                    <span className={hasFullAccess ? 'text-green-600 font-medium' : 'text-orange-500 font-medium'}>
                      {allowedActions}/{actions} {t('portal.actions')}
                    </span>
                  ) : (
                    <span className="text-gray-500">{actions} {t('portal.actions')}</span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 transform group-hover:translate-x-1 transition-transform" strokeWidth={2} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

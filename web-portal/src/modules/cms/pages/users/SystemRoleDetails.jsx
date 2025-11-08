import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'

const pk = (arr) => arr.join('|')

const ScopeApi = {
  loadScopeChildren: async (actionId, levelIndex, scopeTableId, parentIds, lang, levelName) => {
    // If level is Organization Branch and we have a parent organization ID, use the special provider
    const isOrganizationBranch = levelName?.toLowerCase().includes('organization branch') || 
                                  levelName?.toLowerCase().includes('branch')
    const hasSingleParent = Array.isArray(parentIds) && parentIds.length === 1
    
    if (isOrganizationBranch && hasSingleParent) {
      // Use organization-branches-by-organization provider
      const params = new URLSearchParams()
      params.set('organizationId', parentIds[0])
      params.set('lang', lang || 'en')
      try {
        const { data } = await api.get('/access/api/cascade-dropdowns/access.organization-branches-by-organization', { params })
        return Array.isArray(data) ? data : []
      } catch {
        return []
      }
    } else {
      // Use generic code-table-values-by-table provider
      const params = new URLSearchParams()
      params.set('codeTableId', scopeTableId)
      params.set('tableId', scopeTableId)
      params.set('lang', lang || 'en')
      params.set('depth', String(levelIndex))
      if (Array.isArray(parentIds)) {
        for (let i = 0; i < parentIds.length; i++) {
          params.append(`p${i}`, parentIds[i])
        }
        // Also pass parentId for hierarchical filtering
        if (parentIds.length > 0) {
          params.set('parentId', parentIds[parentIds.length - 1])
        }
      }
      try {
        const { data } = await api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', { params })
        return Array.isArray(data) ? data : []
      } catch {
        return []
      }
    }
  }
}

export default function SystemRoleDetails() {
  const { systemRoleId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { getSectionPermissions } = usePermissionCheck()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState(null)
  const [systemTree, setSystemTree] = useState(null)
  const [roleActions, setRoleActions] = useState([]) // Actions already in role
  const [selectedActions, setSelectedActions] = useState(new Set()) // Selected action IDs
  const [actionEffects, setActionEffects] = useState({}) // actionId -> "ALLOW" | "DENY" | "NONE"
  const [actionScopes, setActionScopes] = useState({}) // actionId -> [scopeTableId, ...]
  const [actionScopeNodes, setActionScopeNodes] = useState({}) // actionId -> Set of selected node IDs
  const [levelsByAction, setLevelsByAction] = useState({}) // actionId -> [levels]
  const [treeByAction, setTreeByAction] = useState({}) // actionId -> { pathKey: { nodes: [...] } }
  const [expandedSections, setExpandedSections] = useState(new Set())
  const [expandedActions, setExpandedActions] = useState(new Set())
  const [expandedScopeNodes, setExpandedScopeNodes] = useState(new Set())
  const [loadingChildren, setLoadingChildren] = useState(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const permissions = useMemo(
    () => getSectionPermissions(CMS_SECTIONS.SYSTEMS || CMS_SECTIONS.SYSTEM_ROLES, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  const canDelete = permissions.canDelete

  useEffect(() => {
    if (systemRoleId) {
      loadRole()
      loadRoleActions()
    }
  }, [systemRoleId])

  useEffect(() => {
    if (role?.systemId) {
      loadSystemTree()
    }
  }, [role?.systemId])

  const loadRole = async () => {
    try {
      const { data } = await api.get(`/access/api/system-roles/${systemRoleId}`)
      setRole(data)
    } catch (err) {
      console.error('Failed to load role:', err)
      toast.error('Failed to load role')
    }
  }

  const loadSystemTree = async () => {
    if (!role?.systemId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/system-trees/${role.systemId}`, {
        params: { lang: i18n.language || 'en' }
      })
      setSystemTree(data)
      
      // Build scope tree structure for each action
      const levels = {}, trees = {}
      const flatten = (actionId, nodes, pathIds, levelCount) => {
        const key = pk(pathIds)
        console.log(`flatten called for actionId: ${actionId}, pathIds: ${pathIds}, nodes count: ${nodes?.length || 0}`)
        // Remove duplicates by ID
        const seenIds = new Set()
        const uniqueNodes = (nodes ?? []).filter(n => {
          const nodeId = String(n.id)
          if (seenIds.has(nodeId)) return false
          seenIds.add(nodeId)
          return true
        })
        
        const list = uniqueNodes
          .map(n => {
            const shouldHaveChildren = n.levelIndex < levelCount - 1
            const hasChildrenInData = Array.isArray(n.children) && n.children.length > 0
            // If node has children in data, it definitely has children
            // Otherwise, check if it's not the last level
            return {
              id: String(n.id), 
              name: n.name || '(Unnamed)', 
              levelIndex: n.levelIndex,
              hasChildren: hasChildrenInData || shouldHaveChildren, 
              pathIds
            }
          })
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        trees[actionId] = trees[actionId] || {}
        trees[actionId][key] = { loaded: true, nodes: list }
        console.log(`Saved ${list.length} nodes for actionId: ${actionId}, key: ${key}`, list)
        for (const n of uniqueNodes) {
          if (n.children && n.children.length) {
            flatten(actionId, n.children, [...pathIds, String(n.id)], levelCount)
          }
        }
      }

      const secList = Array.isArray(data?.sections) ? data.sections : []
      for (const sec of secList) {
        for (const act of (sec.actions ?? [])) {
          // Use both act.id and systemSectionActionId to handle different API response formats
          const actionId = act.systemSectionActionId || act.id
          const actionIdStr = String(actionId)
          levels[actionIdStr] = act.levels ?? []
          if (!act.levels || act.levels.length === 0) {
            const row = [{ id: actionIdStr, name: '(All)', levelIndex: 0, hasChildren: false, pathIds: [] }]
            trees[actionIdStr] = { '': { loaded: true, nodes: row } }
          } else {
            flatten(actionIdStr, act.scopes ?? [], [], act.levels.length)
          }
        }
      }
      console.log('Levels by action:', levels)
      console.log('Tree by action:', trees)
      setLevelsByAction(levels)
      setTreeByAction(trees)
    } catch (err) {
      console.error('Failed to load system tree:', err)
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.error('فشل تحميل شجرة النظام')
      } else {
        toast.error('Failed to load system tree')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadRoleActions = async () => {
    try {
      const { data } = await api.get(`/access/api/system-role-actions/role/${systemRoleId}`)
      setRoleActions(data || [])
      
      // Populate selected actions and effects
      const selected = new Set()
      const effects = {}
      const scopes = {}
      const scopeNodes = {}
      
      for (const actionData of data) {
        const actionId = actionData.systemSectionActionId
        const actionIdStr = String(actionId)
        selected.add(actionIdStr)
        effects[actionIdStr] = actionData.actionEffect || 'NONE'
        scopes[actionIdStr] = (actionData.scopes || []).map(s => s.codeTableId)
        // Load scope nodes if available
        if (actionData.scopeNodes && Array.isArray(actionData.scopeNodes)) {
          scopeNodes[actionIdStr] = new Set(actionData.scopeNodes.map(n => {
            // Handle both object format {codeTableValueId: ...} and direct UUID string
            return String(n.codeTableValueId || n)
          }))
        } else {
          scopeNodes[actionIdStr] = new Set()
        }
      }
      
      setSelectedActions(selected)
      setActionEffects(effects)
      setActionScopes(scopes)
      setActionScopeNodes(scopeNodes)
    } catch (err) {
      console.error('Failed to load role actions:', err)
    }
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const toggleAction = (actionId) => {
    setExpandedActions(prev => {
      const next = new Set(prev)
      if (next.has(actionId)) {
        next.delete(actionId)
      } else {
        next.add(actionId)
      }
      return next
    })
  }

  const toggleActionSelection = (actionId) => {
    setSelectedActions(prev => {
      const next = new Set(prev)
      if (next.has(actionId)) {
        next.delete(actionId)
        // Remove from effects, scopes, and scope nodes
        setActionEffects(effects => {
          const newEffects = { ...effects }
          delete newEffects[actionId]
          return newEffects
        })
        setActionScopes(scopes => {
          const newScopes = { ...scopes }
          delete newScopes[actionId]
          return newScopes
        })
        setActionScopeNodes(nodes => {
          const newNodes = { ...nodes }
          delete newNodes[actionId]
          return newNodes
        })
      } else {
        next.add(actionId)
        setActionEffects(effects => ({ ...effects, [actionId]: 'ALLOW' }))
        setActionScopeNodes(nodes => ({ ...nodes, [actionId]: new Set() }))
      }
      return next
    })
  }

  const setActionEffect = (actionId, effect) => {
    setActionEffects(prev => ({ ...prev, [actionId]: effect }))
  }

  const toggleScopeLevel = (actionId, level) => {
    setActionScopes(prev => {
      const current = prev[actionId] || []
      const next = [...current]
      const index = next.indexOf(level.codeTableId)
      
      if (index >= 0) {
        next.splice(index, 1)
      } else {
        next.push(level.codeTableId)
      }
      
      return { ...prev, [actionId]: next }
    })
  }

  const moveScopeLevel = (actionId, fromIndex, direction) => {
    setActionScopes(prev => {
      const current = prev[actionId] || []
      const next = [...current]
      const toIndex = fromIndex + direction
      
      if (toIndex < 0 || toIndex >= next.length) return prev
      
      const temp = next[fromIndex]
      next[fromIndex] = next[toIndex]
      next[toIndex] = temp
      
      return { ...prev, [actionId]: next }
    })
  }

  // Scope tree functions
  const lastIndexOf = useCallback((actionId) => {
    const actionIdStr = String(actionId)
    const lvls = levelsByAction[actionIdStr] || levelsByAction[actionId] || []
    return lvls.length ? lvls.length - 1 : -1
  }, [levelsByAction])

  const rootNodesForAction = (actionId) => {
    // Try both the actionId as-is and as string
    const actionIdStr = String(actionId)
    const tree = treeByAction[actionIdStr] || treeByAction[actionId]
    console.log(`rootNodesForAction(${actionId}):`, {
      actionIdStr,
      originalActionId: actionId,
      hasTree: !!tree,
      allTreeKeys: Object.keys(treeByAction),
      treeKeys: tree ? Object.keys(tree) : [],
      hasEmptyKey: tree ? ('' in tree) : false,
      emptyKeyValue: tree?.[''],
      nodesCount: tree?.['']?.nodes?.length || 0,
      nodes: tree?.['']?.nodes || []
    })
    const nodes = tree?.['']?.nodes || []
    return nodes
  }

  const getChildrenForNode = (actionId, pathIds) => {
    const actionIdStr = String(actionId)
    const key = pk(pathIds)
    const tree = treeByAction[actionIdStr] || treeByAction[actionId]
    return tree?.[key]?.nodes || []
  }

  const toggleScopeNode = async (actionId, node) => {
    if (!node.hasChildren) return
    const newPath = [...node.pathIds, node.id]
    const branchKey = `scp:${actionId}|${pk(newPath)}`
    const isCurrentlyOpen = expandedScopeNodes.has(branchKey)
    
    // Toggle expansion
    setExpandedScopeNodes(prev => {
      const next = new Set(prev)
      if (isCurrentlyOpen) {
        next.delete(branchKey)
      } else {
        next.add(branchKey)
      }
      return next
    })

    // If opening and children not loaded, load them
    if (!isCurrentlyOpen) {
      const children = getChildrenForNode(actionId, newPath)
      if (children.length === 0) {
        // Children not loaded, fetch them
        const lvls = levelsByAction[actionId] || []
        if (node.levelIndex < lvls.length - 1) {
          const nextLevel = lvls[node.levelIndex + 1]
          if (nextLevel) {
            const loadingKey = `${actionId}|${pk(newPath)}`
            setLoadingChildren(prev => new Set(prev).add(loadingKey))
            try {
              const items = await ScopeApi.loadScopeChildren(
                actionId,
                node.levelIndex + 1,
                nextLevel.scopeTableId,
                newPath,
                i18n.language || 'en',
                nextLevel.name
              )
              // Remove duplicates by ID
              const seenIds = new Set()
              const uniqueItems = items.filter(item => {
                const itemId = String(item.id)
                if (seenIds.has(itemId)) return false
                seenIds.add(itemId)
                return true
              })
              // Add children to tree
              setTreeByAction(prev => {
                const next = { ...prev }
                if (!next[actionId]) next[actionId] = {}
                const key = pk(newPath)
                const mapped = uniqueItems
                  .map(item => ({
                    id: String(item.id),
                    name: item.name,
                    levelIndex: node.levelIndex + 1,
                    hasChildren: node.levelIndex + 1 < lvls.length - 1,
                    pathIds: newPath
                  }))
                  .sort((a, b) => a.name.localeCompare(b.name))
                next[actionId][key] = { loaded: true, nodes: mapped }
                return next
              })
            } catch (err) {
              console.error('Failed to load children:', err)
            } finally {
              setLoadingChildren(prev => {
                const next = new Set(prev)
                next.delete(loadingKey)
                return next
              })
            }
          }
        }
      }
    }
  }

  const toggleScopeNodeSelection = (actionId, nodeId) => {
    setActionScopeNodes(prev => {
      const current = prev[actionId] || new Set()
      const next = new Set(current)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return { ...prev, [actionId]: next }
    })
  }

  const isScopeNodeSelected = (actionId, nodeId) => {
    return actionScopeNodes[actionId]?.has(String(nodeId)) || false
  }

  // Render scope node recursively
  const renderScopeNode = (actionId, node, depth = 0) => {
    const isLeafNode = node.levelIndex === lastIndexOf(actionId)
    const isSelected = isScopeNodeSelected(actionId, node.id)
    const branchKey = `scp:${actionId}|${pk([...node.pathIds, node.id])}`
    const scopeOpen = expandedScopeNodes.has(branchKey)
    const children = getChildrenForNode(actionId, [...node.pathIds, node.id])
    const loadingKey = `${actionId}|${pk([...node.pathIds, node.id])}`
    const isLoading = loadingChildren.has(loadingKey)

    return (
      <div key={node.id} className={depth > 0 ? 'ml-4' : ''}>
        {!isLeafNode ? (
          <>
            <div className="flex items-center gap-2 py-1 px-2">
              <button 
                className="flex items-center gap-1.5 flex-1 text-left hover:bg-gray-50 rounded"
                onClick={()=>toggleScopeNode(actionId, node)}
                disabled={isLoading}
              >
                <div className={`transition-transform ${scopeOpen ? 'rotate-90' : ''}`}>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <span className="text-xs text-gray-700 truncate">
                  {node.name}
                </span>
                {isLoading && (
                  <svg className="w-3 h-3 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </button>
              <input
                type="checkbox"
                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                checked={isSelected}
                onChange={() => toggleScopeNodeSelection(actionId, node.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {scopeOpen && (
              <div className="mt-1 space-y-1">
                {isLoading ? (
                  <div className="ml-4 text-[10px] text-gray-400 px-2 py-1">Loading...</div>
                ) : children.length > 0 ? (
                  children.map(child => renderScopeNode(actionId, child, depth + 1))
                ) : (
                  <div className="ml-4 text-[10px] text-gray-400 px-2 py-1">No items</div>
                )}
              </div>
            )}
          </>
        ) : (
          <label className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 cursor-pointer rounded">
            <input
              type="checkbox"
              className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              checked={isSelected}
              onChange={() => toggleScopeNodeSelection(actionId, node.id)}
            />
            <span className={`text-xs flex-1 truncate ${
              isSelected ? 'text-gray-700 font-medium' : 'text-gray-500'
            }`}>
              {node.name}
            </span>
          </label>
        )}
      </div>
    )
  }

  const handleSave = async () => {
    if (!systemRoleId) return
    
    setSaving(true)
    try {
      const requests = Array.from(selectedActions).map(actionId => ({
        systemSectionActionId: actionId,
        actionEffect: actionEffects[actionId] || 'NONE',
        orderIndex: 0,
        scopes: actionScopes[actionId] || [],
        scopeNodes: actionScopeNodes[actionId] ? Array.from(actionScopeNodes[actionId]) : []
      }))

      await api.post(`/access/api/system-role-actions/role/${systemRoleId}/actions`, requests)
      
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.success('تم حفظ Actions بنجاح')
      } else {
        toast.success('Actions saved successfully')
      }
      
      await loadRoleActions()
    } catch (err) {
      console.error('Failed to save actions:', err)
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.error('فشل حفظ Actions')
      } else {
        toast.error('Failed to save actions')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!systemRoleId) return
    
    setDeleting(true)
    try {
      await api.delete(`/access/api/system-roles/${systemRoleId}`)
      
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.success('تم حذف System Role بنجاح')
      } else {
        toast.success('System Role deleted successfully')
      }
      
      navigate('/cms/system-roles')
    } catch (err) {
      console.error('Failed to delete role:', err)
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.error(err.response?.data?.message || 'فشل حذف System Role')
      } else {
        toast.error(err.response?.data?.message || 'Failed to delete system role')
      }
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showDeleteModal && !deleting) {
        setShowDeleteModal(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showDeleteModal, deleting])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!role || !systemTree) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Role or system tree not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const allSelectedActions = Array.from(selectedActions)
  const hasChanges = allSelectedActions.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="mb-4">
          <CMSBreadcrumb currentPageLabel={role.name || 'System Role'} />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition text-white font-bold"
                >
                  ←
                </button>
                <h1 className="text-3xl font-bold">{role.name}</h1>
              </div>
              <p className="text-blue-100 mt-2">
                Code: <span className="font-semibold">{role.code}</span> | 
                Type: <span className="font-semibold">{role.roleType || 'CUSTOM'}</span>
              </p>
              {role.description && (
                <p className="text-blue-100 mt-1">{role.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  🗑️ Delete Role
                </button>
              )}
              <div className="text-6xl opacity-20">🎭</div>
            </div>
          </div>
        </div>

        {/* Actions Management */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Actions & Scopes</h2>
              <p className="text-sm text-gray-600">Select actions and define scope hierarchy for this role</p>
            </div>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                '💾 Save Actions'
              )}
            </button>
          </div>

          <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {systemTree?.sections?.map(section => {
              const sectionKey = `sec:${section.systemSectionId || section.id}`
              const isExpanded = expandedSections.has(sectionKey)
              
              return (
                <div key={sectionKey} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(sectionKey)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-800">{section.name}</span>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                        {(section.actions || []).length} actions
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 space-y-2 bg-white">
                      {(section.actions || []).map(action => {
                        const actionId = action.systemSectionActionId || action.id
                        const actionIdStr = String(actionId)
                        const actionKey = `act:${actionIdStr}`
                        const isSelected = selectedActions.has(actionIdStr)
                        const isExpanded = expandedActions.has(actionKey)
                        const effect = actionEffects[actionIdStr] || 'NONE'
                        const scopes = actionScopes[actionIdStr] || []
                        // Get levels from action scope hierarchy or from loaded levelsByAction
                        const actionLevels = levelsByAction[actionIdStr] || action.levels || action.scopeLevels || []
                        console.log(`Action ${action.name}: actionIdStr=${actionIdStr}, actionLevels.length=${actionLevels.length}, hasTree=${!!treeByAction[actionIdStr]}`)

                        return (
                          <div key={actionKey} className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleActionSelection(actionIdStr)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => toggleAction(actionKey)}
                                className="flex-1 text-left flex items-center gap-2"
                              >
                                <div className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                                <span className="font-medium text-gray-700">{action.name}</span>
                                <span className="text-xs text-gray-500">({action.code})</span>
                              </button>
                              
                              {isSelected && (
                                <select
                                  value={effect}
                                  onChange={(e) => setActionEffect(actionIdStr, e.target.value)}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="NONE">NONE</option>
                                  <option value="ALLOW">ALLOW</option>
                                  <option value="DENY">DENY</option>
                                </select>
                              )}
                            </div>

                            {isExpanded && (
                              <>
                                {actionLevels.length > 0 && (
                                  <div className="px-3 py-2 bg-white border-t border-gray-200">
                                    <div className="text-xs font-semibold text-gray-600 mb-2">Scope Hierarchy:</div>
                                    <div className="space-y-1">
                                      {actionLevels.map((level, idx) => {
                                        const isSelected = scopes.includes(level.scopeTableId)
                                        const currentIndex = scopes.indexOf(level.scopeTableId)
                                        
                                        return (
                                          <div key={level.scopeTableId} className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => toggleScopeLevel(actionIdStr, level)}
                                              className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                                            />
                                            <span className="text-xs text-gray-700 flex-1">
                                              {level.name} (Level {level.index + 1})
                                            </span>
                                            {isSelected && (
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => moveScopeLevel(actionIdStr, currentIndex, -1)}
                                                  disabled={currentIndex === 0}
                                                  className="px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                  title="Move up"
                                                >
                                                  ↑
                                                </button>
                                                <button
                                                  onClick={() => moveScopeLevel(actionIdStr, currentIndex, 1)}
                                                  disabled={currentIndex === scopes.length - 1}
                                                  className="px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                  title="Move down"
                                                >
                                                  ↓
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Scope Nodes Tree */}
                                {actionLevels.length > 0 && (
                                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                                    <div className="text-xs font-semibold text-gray-600 mb-2">
                                      Scope Nodes {scopes.length === 0 && '(Select scope hierarchy levels above to enable selection)'}:
                                    </div>
                                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                                      {(() => {
                                        const rootNodes = rootNodesForAction(actionIdStr)
                                        console.log('Rendering scope nodes for actionId:', actionIdStr, 'rootNodes:', rootNodes, 'treeByAction:', treeByAction[actionIdStr])
                                        if (rootNodes && rootNodes.length > 0) {
                                          return (
                                            <div className="space-y-1">
                                              {rootNodes.map((node, idx) => {
                                                console.log(`Rendering node ${idx}:`, node)
                                                return (
                                                  <div key={node.id || `node-${idx}`}>
                                                    {renderScopeNode(actionIdStr, node)}
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )
                                        } else {
                                          return (
                                            <div className="text-[10px] text-gray-400 px-2 py-1">
                                              {scopes.length === 0 
                                                ? 'Please select scope hierarchy levels above to view scope nodes.'
                                                : `No scope nodes available for action ${actionIdStr}. Available actions: ${Object.keys(treeByAction).join(', ')}`}
                                            </div>
                                          )
                                        }
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setShowDeleteModal(false)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">⚠️</div>
                <h3 className="text-xl font-bold text-white">Delete System Role</h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 font-semibold mb-2">
                  Are you sure you want to delete this system role?
                </p>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <div className="text-red-600 text-xl">⚠️</div>
                    <div>
                      <p className="text-red-800 font-bold mb-1">This action cannot be undone!</p>
                      <p className="text-red-700 text-sm">
                        Role: <span className="font-semibold">{role?.name}</span>
                      </p>
                      <p className="text-red-700 text-sm">
                        Code: <span className="font-semibold">{role?.code}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-4">
                  <strong>Permanent deletion:</strong> This will permanently delete the system role from the database.
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  All associated data including actions, scopes, and user assignments will be permanently deleted.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    🗑️ Delete Role
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


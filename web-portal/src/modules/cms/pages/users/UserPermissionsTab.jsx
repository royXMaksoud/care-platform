// src/components/UserPermissionsSystemTree.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

const pk = (arr) => arr.join('|')

const AccessApi = {
  systems: async () => {
    try {
      const { data } = await api.get('/access/api/dropdowns/systems')
      if (Array.isArray(data)) return data.map(x => ({ id: String(x.id), name: x.name }))
    } catch {}
    const { data } = await api.get('/access/api/systems', { params: { page: 0, size: 500 } })
    const list = data?.content ?? data ?? []
    return list.map(x => ({ id: String(x.systemId ?? x.id), name: x.name }))
  },

  systemRoles: async (systemId) => {
    try {
      const { data } = await api.get(`/access/api/system-roles/dropdown/by-system/${systemId}`)
      return Array.isArray(data) ? data.map(x => ({ id: String(x.id), name: x.name, code: x.code })) : []
    } catch {
      return []
    }
  },

  users: async () => {
    try {
      const { data } = await api.get('/auth/api/users', { params: { page: 0, size: 500 } })
      const list = data?.content ?? data ?? []
      return list.map(x => ({ 
        id: String(x.id ?? x.userId), 
        name: x.fullName ?? x.name ?? x.username ?? x.emailAddress ?? x.email ?? 'Unknown' 
      }))
    } catch {
      return []
    }
  },

  copyUserPermissions: async (sourceUserId, targetUserId, tenantId, systemId) => {
    const systemTree = await AccessApi.systemTree(systemId, 'en')
    const allActionIds = systemTree?.sections?.flatMap(s => (s.actions ?? []).map(a => a.id)) || []
    
    const { data } = await api.get('/access/api/user-permissions', {
      params: { userId: sourceUserId, actionIds: allActionIds },
      paramsSerializer: p => p.toString(),
      headers: tenantId ? { 'X-Tenant-Id': tenantId } : undefined
    })
    
    const items = (data || []).map(item => ({
      userId: targetUserId,
      systemSectionActionId: item.systemSectionActionId,
      actionEffect: item.actionEffect === 'ALLOW' ? 'ALLOW' : item.actionEffect === 'DENY' ? 'DENY' : 'NONE',
      nodes: (item.nodes || []).map(n => ({
        codeTableId: n.codeTableId,
        codeTableValueId: n.codeTableValueId,
        effect: n.effect === 'DENY' ? 'DENY' : 'ALLOW'
      })),
      deleted: false
    }))
    
    if (items.length > 0) {
      await AccessApi.saveBulk(items, tenantId)
    }
    
    return items.length
  },

  applyRoleToUser: async (userId, roleId, tenantId, systemId) => {
    try {
      const headers = {}
      if (tenantId) {
        headers['X-Tenant-Id'] = String(tenantId)
      }
      
      const { data } = await api.post(`/access/api/user-system-roles/apply-role`, {
        userId,
        systemRoleId: roleId,
        tenantId: tenantId || null,
        systemId
      }, {
        headers: Object.keys(headers).length > 0 ? headers : undefined
      })
      return data?.success || false
    } catch (err) {
      console.error('Failed to apply role:', err)
      return false
    }
  },

  systemTree: async (systemId, lang) => {
    const { data } = await api.get(`/access/api/system-trees/${encodeURIComponent(systemId)}`, { params: { lang } })
    return data
  },

  loadScopeChildren: async (actionId, levelIndex, scopeTableId, parentIds, lang, levelName) => {
    const isOrganizationBranch = levelName?.toLowerCase().includes('organization branch') || 
                                  levelName?.toLowerCase().includes('branch')
    const hasSingleParent = Array.isArray(parentIds) && parentIds.length === 1
    
    if (isOrganizationBranch && hasSingleParent) {
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
      const params = new URLSearchParams()
      params.set('codeTableId', scopeTableId)
      params.set('tableId', scopeTableId)
      params.set('lang', lang || 'en')
      params.set('depth', String(levelIndex))
      if (Array.isArray(parentIds)) {
        for (let i = 0; i < parentIds.length; i++) {
          params.append(`p${i}`, parentIds[i])
        }
      }
      try {
        const { data } = await api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', { params })
        return Array.isArray(data) ? data : []
      } catch {
        return []
      }
    }
  },

  readUserNodesAll: async ({ userId, tenantId, actionIds }) => {
    const params = new URLSearchParams()
    params.set('userId', userId)
    if (Array.isArray(actionIds)) {
      for (const id of actionIds) params.append('actionIds', id)
    }

    const { data } = await api.get('/access/api/user-permissions/states', {
      params,
      paramsSerializer: p => p.toString(),
      headers: tenantId ? { 'X-Tenant-Id': tenantId } : undefined
    })

    const allowByAction = {}
    const denyByAction  = {}
    const actionLevelEffect = {}

    for (const g of (data ?? [])) {
      const a = new Set(), d = new Set()

      const states = g.nodeStates || {}
      for (const [valueId, eff] of Object.entries(states)) {
        ;(eff === 'DENY' ? d : a).add(String(valueId))
      }

      if (a.size) allowByAction[g.systemSectionActionId] = a
      if (d.size) denyByAction[g.systemSectionActionId] = d

      if (g.actionEffect && g.actionEffect !== 'NONE') {
        actionLevelEffect[g.systemSectionActionId] = g.actionEffect
      }
    }

    return { allowByAction, denyByAction, actionLevelEffect }
  },

  saveBulk: async (items, tenantId) => {
    await api.post('/access/api/user-permissions/bulk', { items }, {
      params: { mode: 'REPLACE' },
      headers: tenantId ? { 'X-Tenant-Id': tenantId } : undefined
    })
  }
}

export default function UserPermissionsSystemTree({ userId, tenantId, defaultLang = 'en' }) {
  const { t, i18n } = useTranslation()
  const [lang, setLang] = useState(defaultLang)
  const [systems, setSystems] = useState([])
  const [systemId, setSystemId] = useState('')
  const [systemRoles, setSystemRoles] = useState([])
  const [selectedRoleBySystem, setSelectedRoleBySystem] = useState({})
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [copySourceUserId, setCopySourceUserId] = useState('')
  const [users, setUsers] = useState([])
  const [copyingPermissions, setCopyingPermissions] = useState(false)

  const [sections, setSections] = useState([])
  const [levelsByAction, setLevelsByAction] = useState({})
  const [treeByAction, setTreeByAction] = useState({})
  const [nodePathsByAction, setNodePathsByAction] = useState({})

  const [actionLevelEffect, setActionLevelEffect] = useState({})
  const [expanded, setExpanded] = useState(new Set())
  const [loadingChildren, setLoadingChildren] = useState(new Set())
  const [mode, setMode] = useState('ALLOW')
  const [allowByAction, setAllowByAction] = useState({})
  const [denyByAction,  setDenyByAction]  = useState({})
  const [saving, setSaving] = useState(false)

  const baselineRef = useRef('{"A":{},"D":{},"AE":{}}')
  const snapshot = useCallback(() => {
    const normSets = (m) =>
      Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Array.from(v || []).map(String).sort().join(',')]))
    const normAction = Object.fromEntries(Object.entries(actionLevelEffect).filter(([, eff]) => eff && eff !== 'NONE'))
    return JSON.stringify({ A: normSets(allowByAction), D: normSets(denyByAction), AE: normAction })
  }, [allowByAction, denyByAction, actionLevelEffect])
  const isDirty = useMemo(() => snapshot() !== baselineRef.current, [snapshot])

  const toggleAllSystem = () => {
    const allActionIds = sections.flatMap(s => (s.actions ?? []).map(a => a.id))
    
    const allSelected = allActionIds.every(actionId => {
      const lvls = levelsByAction[actionId] || []
      if (lvls.length === 0) {
        const eff = actionLevelEffect[actionId]
        return eff === mode
      } else {
        const rootNodes = rootNodesForAction(actionId)
        if (rootNodes.length === 0) return false
        return rootNodes.every(n => {
          const isLeaf = n.levelIndex === lastIndexOf(actionId)
          if (isLeaf) {
            const state = selState(actionId, n.id)
            return state === mode
          }
          return false
        })
      }
    })

    if (allSelected) {
      setActionLevelEffect({})
      setAllowByAction({})
      setDenyByAction({})
    } else {
      const newActionEffects = {}
      const newAllow = {}
      const newDeny = {}

      for (const actionId of allActionIds) {
        const lvls = levelsByAction[actionId] || []
        if (lvls.length === 0) {
          newActionEffects[actionId] = mode
        } else {
          const rootNodes = rootNodesForAction(actionId)
          const leafNodes = rootNodes.filter(n => n.levelIndex === lastIndexOf(actionId))
          const ids = leafNodes.map(n => String(n.id))
          if (mode === 'ALLOW') {
            newAllow[actionId] = new Set(ids)
          } else {
            newDeny[actionId] = new Set(ids)
          }
        }
      }

      setActionLevelEffect(newActionEffects)
      setAllowByAction(newAllow)
      setDenyByAction(newDeny)
    }
  }

  const toggleAllSection = (sectionId) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    const actionIds = (section.actions ?? []).map(a => a.id)
    
    const allSelected = actionIds.every(actionId => {
      const lvls = levelsByAction[actionId] || []
      if (lvls.length === 0) {
        const eff = actionLevelEffect[actionId]
        return eff === mode
      } else {
        const rootNodes = rootNodesForAction(actionId)
        if (rootNodes.length === 0) return false
        return rootNodes.every(n => {
          const isLeaf = n.levelIndex === lastIndexOf(actionId)
          if (isLeaf) {
            const state = selState(actionId, n.id)
            return state === mode
          }
          return false
        })
      }
    })

    if (allSelected) {
      const newActionEffects = { ...actionLevelEffect }
      const newAllow = { ...allowByAction }
      const newDeny = { ...denyByAction }

      for (const actionId of actionIds) {
        delete newActionEffects[actionId]
        delete newAllow[actionId]
        delete newDeny[actionId]
      }

      setActionLevelEffect(newActionEffects)
      setAllowByAction(newAllow)
      setDenyByAction(newDeny)
    } else {
      const newActionEffects = { ...actionLevelEffect }
      const newAllow = { ...allowByAction }
      const newDeny = { ...denyByAction }

      for (const actionId of actionIds) {
        const lvls = levelsByAction[actionId] || []
        if (lvls.length === 0) {
          newActionEffects[actionId] = mode
        } else {
          const rootNodes = rootNodesForAction(actionId)
          const leafNodes = rootNodes.filter(n => n.levelIndex === lastIndexOf(actionId))
          const ids = leafNodes.map(n => String(n.id))
          if (mode === 'ALLOW') {
            newAllow[actionId] = new Set(ids)
          } else {
            newDeny[actionId] = new Set(ids)
          }
        }
      }

      setActionLevelEffect(newActionEffects)
      setAllowByAction(newAllow)
      setDenyByAction(newDeny)
    }
  }

  const canSave = Boolean(userId && systemId && isDirty)

  useEffect(() => { (async () => setSystems(await AccessApi.systems()))() }, [])
  useEffect(() => { (async () => setUsers(await AccessApi.users()))() }, [])

  useEffect(() => {
    if (systemId) {
      (async () => {
        const roles = await AccessApi.systemRoles(systemId)
        setSystemRoles(roles)
      })()
    } else {
      setSystemRoles([])
    }
  }, [systemId])

  const computeExpandedSet = useCallback((sectionsList, levelsMap, nodePathsMap, allowMap, denyMap, actionEffectMap) => {
    if (!Array.isArray(sectionsList) || sectionsList.length === 0) return new Set()

    const expandedSet = new Set()
    const actionToSection = new Map()

    for (const sec of sectionsList) {
      const actions = sec?.actions || []
      for (const act of actions) {
        actionToSection.set(String(act.id), sec.id)
      }
    }

    const touchedActions = new Set()

    if (actionEffectMap) {
      for (const [actionId, eff] of Object.entries(actionEffectMap)) {
        if (eff && eff !== 'NONE') touchedActions.add(String(actionId))
      }
    }

    if (allowMap) {
      for (const [actionId, set] of Object.entries(allowMap)) {
        if (set && set.size) touchedActions.add(String(actionId))
      }
    }

    if (denyMap) {
      for (const [actionId, set] of Object.entries(denyMap)) {
        if (set && set.size) touchedActions.add(String(actionId))
      }
    }

    for (const actionId of touchedActions) {
      const sectionId = actionToSection.get(String(actionId))
      if (sectionId === undefined) continue

      expandedSet.add(`sec:${sectionId}`)
      expandedSet.add(`act:${actionId}`)

      const levels = levelsMap?.[actionId] || []
      if (!levels.length) continue

      const nodePaths = nodePathsMap?.[actionId] || {}
      const nodeIds = new Set()

      const allowSet = allowMap?.[actionId]
      if (allowSet) {
        for (const id of allowSet) nodeIds.add(String(id))
      }

      const denySet = denyMap?.[actionId]
      if (denySet) {
        for (const id of denySet) nodeIds.add(String(id))
      }

      for (const nodeId of nodeIds) {
        const paths = nodePaths[nodeId]
        if (!paths || !paths.length) continue
        const bestPath = paths[0]
        if (!Array.isArray(bestPath)) continue
        for (let i = 0; i < bestPath.length; i++) {
          const branch = bestPath.slice(0, i + 1)
          expandedSet.add(`scp:${actionId}|${pk(branch)}`)
        }
      }
    }

    return expandedSet
  }, [])

  const updateExpandedFromPermissions = useCallback((allowMap, denyMap, actionEffectMap) => {
    setExpanded(computeExpandedSet(sections, levelsByAction, nodePathsByAction, allowMap, denyMap, actionEffectMap || {}))
  }, [computeExpandedSet, sections, levelsByAction, nodePathsByAction])

  useEffect(() => {
    (async () => {
      setSections([]); setLevelsByAction({}); setTreeByAction({}); setNodePathsByAction({}); setExpanded(new Set())
      setAllowByAction({}); setDenyByAction({}); setActionLevelEffect({})
      baselineRef.current = '{"A":{},"D":{},"AE":{}}'
      if (!systemId) return

      const tree = await AccessApi.systemTree(systemId, lang)
      const secList = Array.isArray(tree?.sections) ? tree.sections : []
      setSections(secList)

      const levels = {}, trees = {}, paths = {}
      const registerNodePath = (actionId, nodeId, fullPath) => {
        const actKey = String(actionId)
        if (!paths[actKey]) paths[actKey] = {}
        const nodeKey = String(nodeId)
        const existing = paths[actKey][nodeKey]
        const serialized = fullPath.join('|')
        if (existing) {
          if (!existing.some(path => path.join('|') === serialized)) {
            paths[actKey][nodeKey] = [...existing, [...fullPath]]
          }
        } else {
          paths[actKey][nodeKey] = [[...fullPath]]
        }
      }
      const flatten = (actionId, nodes, pathIds, levelCount) => {
        const key = pk(pathIds)
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
            const nodeId = String(n.id)
            registerNodePath(actionId, nodeId, [...pathIds, nodeId])
            return {
              id: nodeId, 
              name: n.name, 
              levelIndex: n.levelIndex,
              hasChildren: shouldHaveChildren || hasChildrenInData, 
              pathIds
            }
          })
          .sort((a, b) => a.name.localeCompare(b.name))
        trees[actionId] = trees[actionId] || {}
        trees[actionId][key] = { loaded: true, nodes: list }
        for (const n of uniqueNodes) {
          if (n.children && n.children.length) {
            flatten(actionId, n.children, [...pathIds, String(n.id)], levelCount)
          }
        }
      }

      const allActionIds = []
      for (const sec of secList) {
        for (const act of (sec.actions ?? [])) {
          allActionIds.push(act.id)
          levels[act.id] = act.levels ?? []
          if (!act.levels || act.levels.length === 0) {
            const row = [{ id: String(act.id), name: '(All)', levelIndex: 0, hasChildren: false, pathIds: [] }]
            trees[act.id] = { '': { loaded: true, nodes: row } }
          } else {
            flatten(act.id, act.scopes ?? [], [], act.levels.length)
          }
        }
      }
      setLevelsByAction(levels); setTreeByAction(trees); setNodePathsByAction(paths)

      if (userId) {
        const { allowByAction: A, denyByAction: D, actionLevelEffect: AE } =
          await AccessApi.readUserNodesAll({ userId, tenantId, actionIds: allActionIds })
        setAllowByAction(A); setDenyByAction(D); if (AE) setActionLevelEffect(AE)
        const normSets = (m) =>
          Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Array.from(v || []).map(String).sort().join(',')]))
        baselineRef.current = JSON.stringify({ A: normSets(A), D: normSets(D), AE: AE || {} })
        const expandedSet = computeExpandedSet(secList, levels, paths, A, D, AE || {})
        setExpanded(expandedSet)
      }
    })()
  }, [systemId, lang, userId, tenantId, computeExpandedSet])

  const lastIndexOf = useCallback((actionId) => {
    const lvls = levelsByAction[actionId] || []
    return lvls.length ? lvls.length - 1 : -1
  }, [levelsByAction])

  const rootNodesForAction = (actionId) => treeByAction[actionId]?.['']?.nodes || []

  const getChildrenForNode = (actionId, pathIds) => {
    const key = pk(pathIds)
    return treeByAction[actionId]?.[key]?.nodes || []
  }

  const toggleSection = (sectionId) => {
    setExpanded(prev => { const k = `sec:${sectionId}`; const next = new Set(prev); next.has(k) ? next.delete(k) : next.add(k); return next })
  }
  const toggleAction = (actionId) => {
    setExpanded(prev => { const k = `act:${actionId}`; const next = new Set(prev); next.has(k) ? next.delete(k) : next.add(k); return next })
  }
  const toggleScopeNode = async (actionId, node) => {
    if (!node.hasChildren) return
    const newPath = [...node.pathIds, node.id]
    const branchKey = `scp:${actionId}|${pk(newPath)}`
    const isCurrentlyOpen = expanded.has(branchKey)
    
    setExpanded(prev => {
      const next = new Set(prev)
      if (isCurrentlyOpen) {
        next.delete(branchKey)
      } else {
        next.add(branchKey)
      }
      return next
    })

    if (!isCurrentlyOpen) {
      const children = getChildrenForNode(actionId, newPath)
      if (children.length === 0) {
        const lvls = levelsByAction[actionId] || []
        if (node.levelIndex < lvls.length - 1) {
          const nextLevel = lvls[node.levelIndex + 1]
          if (nextLevel) {
            const loadingKey = `${actionId}|${pk(newPath)}`
            setLoadingChildren(prev => new Set(prev).add(loadingKey))
            try {
              const items = await AccessApi.loadScopeChildren(
                actionId,
                node.levelIndex + 1,
                nextLevel.scopeTableId,
                newPath,
                lang,
                nextLevel.name
              )
              const seenIds = new Set()
              const uniqueItems = items.filter(item => {
                const itemId = String(item.id)
                if (seenIds.has(itemId)) return false
                seenIds.add(itemId)
                return true
              })
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

  const selState = (actionId, valueId) => {
    const a = allowByAction[actionId]; const d = denyByAction[actionId]
    if (a?.has(String(valueId))) return 'ALLOW'
    if (d?.has(String(valueId))) return 'DENY'
    return 'NONE'
  }

  const renderScopeNode = (actionId, node, depth = 0) => {
    const isLeafNode = node.levelIndex === lastIndexOf(actionId)
    const state = selState(actionId, node.id)
    const branchKey = `scp:${actionId}|${pk([...node.pathIds, node.id])}`
    const scopeOpen = expanded.has(branchKey)
    const children = getChildrenForNode(actionId, [...node.pathIds, node.id])
    const loadingKey = `${actionId}|${pk([...node.pathIds, node.id])}`
    const isLoading = loadingChildren.has(loadingKey)

    return (
      <div key={node.id} className={depth > 0 ? 'ml-4' : ''}>
        {!isLeafNode ? (
          <>
            <button 
              className="w-full flex items-center gap-1.5 py-1 px-2 text-left hover:bg-slate-50 rounded"
              onClick={()=>toggleScopeNode(actionId, node)}
              disabled={isLoading}
            >
              <div className={`transition-transform ${scopeOpen ? 'rotate-90' : ''}`}>
                <svg className="w-2 h-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <span className="text-[11px] text-slate-600 truncate">
                {node.name}
              </span>
              {isLoading && (
                <svg className="w-3 h-3 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
            {scopeOpen && (
              <div className="mt-1 space-y-1">
                {isLoading ? (
                  <div className="ml-4 text-[10px] text-slate-400 px-2 py-1">Loading...</div>
                ) : children.length > 0 ? (
                  children.map(child => renderScopeNode(actionId, child, depth + 1))
                ) : (
                  <div className="ml-4 text-[10px] text-slate-400 px-2 py-1">No items</div>
                )}
              </div>
            )}
          </>
        ) : (
          <label className="flex items-center gap-1.5 py-1 px-2 hover:bg-slate-50 cursor-pointer rounded">
            <input
              type="checkbox"
              className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              checked={state!=='NONE'}
              onChange={e=>onLeafCheckChange(actionId, node, e.target.checked)}
            />
            <span className={`text-[11px] flex-1 truncate ${
              state==='ALLOW' 
                ? 'text-slate-700 font-medium' 
                : state==='DENY' 
                ? 'text-slate-500 line-through'
                : 'text-slate-500'
            }`}>
              {node.name}
            </span>
            {state !== 'NONE' && (
              <span className={`px-1 py-0.5 text-[8px] font-bold rounded ${
                state==='ALLOW' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-rose-500 text-white'
              }`}>
                {state}
              </span>
            )}
          </label>
        )}
      </div>
    )
  }

  const onLeafCheckChange = (actionId, leaf, checked) => {
    const noLevels = (levelsByAction[actionId] ?? []).length === 0
    if (noLevels) {
      setActionLevelEffect(prev => {
        const cur = prev[actionId] || 'NONE'
        if (!checked) return { ...prev, [actionId]: 'NONE' }
        const nextEff = mode
        return { ...prev, [actionId]: (cur === nextEff) ? 'NONE' : nextEff }
      })
      return
    }
    const id = String(leaf.id)
    const current = selState(actionId, id)
    const a = new Set(allowByAction[actionId] || [])
    const d = new Set(denyByAction[actionId]  || [])
    if (!checked) { a.delete(id); d.delete(id) }
    else {
      if (current === mode) { a.delete(id); d.delete(id) }
      else { a.delete(id); d.delete(id); (mode === 'ALLOW' ? a : d).add(id) }
    }
    setAllowByAction(prev => ({ ...prev, [actionId]: a }))
    setDenyByAction (prev => ({ ...prev, [actionId]: d }))
  }

  const onSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const allCurrentActionIds = sections.flatMap(s => (s.actions ?? []).map(a => a.id))
      
      const baseline = JSON.parse(baselineRef.current)
      const hadPermissionsBefore = new Set([
        ...Object.keys(baseline.A || {}),
        ...Object.keys(baseline.D || {}),
        ...Object.keys(baseline.AE || {})
      ])
      
      const items = []
      const touchedActions = new Set([
        ...Object.keys(allowByAction), 
        ...Object.keys(denyByAction), 
        ...Object.keys(actionLevelEffect),
        ...hadPermissionsBefore
      ])
      
      for (const actionId of touchedActions) {
        const lvls = levelsByAction[actionId] || []
        
        if (lvls.length === 0) {
          const eff = actionLevelEffect[actionId]
          const hadBefore = hadPermissionsBefore.has(actionId)
          
          if (eff && eff !== 'NONE') {
            items.push({ userId, systemSectionActionId: actionId, actionEffect: eff, nodes: [], deleted: false })
          } else if (hadBefore) {
            items.push({ userId, systemSectionActionId: actionId, actionEffect: 'NONE', nodes: [], deleted: true })
          }
          continue
        }
        
        const last = lvls[lvls.length - 1]
        const allowIds = [...(allowByAction[actionId] || [])]
        const denyIds  = [...(denyByAction[actionId]  || [])]
        const hadBefore = hadPermissionsBefore.has(actionId)
        
        if (allowIds.length || denyIds.length) {
          const nodes = [
            ...allowIds.map(v => ({ codeTableId: last.scopeTableId, codeTableValueId: v, effect: 'ALLOW' })),
            ...denyIds .map(v => ({ codeTableId: last.scopeTableId, codeTableValueId: v, effect: 'DENY'  })),
          ]
          items.push({ userId, systemSectionActionId: actionId, actionEffect: 'NONE', nodes, deleted: false })
        } else if (hadBefore) {
          items.push({ userId, systemSectionActionId: actionId, actionEffect: 'NONE', nodes: [], deleted: true })
        }
      }
      
      if (items.length) {
        await AccessApi.saveBulk(items, tenantId)
        const allActionIds = sections.flatMap(s => (s.actions ?? []).map(a => a.id))
        const { allowByAction: A, denyByAction: D, actionLevelEffect: AE } =
          await AccessApi.readUserNodesAll({ userId, tenantId, actionIds: allActionIds })
        setAllowByAction(A); setDenyByAction(D); if (AE) setActionLevelEffect(AE)
        const normSets = (m) =>
          Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Array.from(v || []).map(String).sort().join(',')]))
        baselineRef.current = JSON.stringify({ A: normSets(A), D: normSets(D), AE: AE || {} })
        updateExpandedFromPermissions(A, D, AE || {})
        
        const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
        if (currentLang === 'ar') {
          toast.success('تم الحفظ بنجاح')
        } else {
          toast.success('Saved successfully')
        }
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-none bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                User Permissions
              </h2>
              <p className="text-xs text-slate-500">Configure access control</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-md">
              <button 
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  mode==='ALLOW'
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800'
                }`} 
                onClick={()=>setMode('ALLOW')}
              >
                Allow
              </button>
              <button 
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  mode==='DENY'
                    ? 'bg-rose-500 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800'
                }`} 
                onClick={()=>setMode('DENY')}
              >
                Deny
              </button>
            </div>

            <button 
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                canSave && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              onClick={onSave} 
              disabled={!canSave || saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="px-6 pb-3 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">System:</label>
            <select 
              className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              value={systemId} 
              onChange={e=>{
                setSystemId(e.target.value)
                setLang(defaultLang)
              }}
            >
              <option value="">Choose a system...</option>
              {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            
            {systemId && (
              <>
                <button
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all shadow-sm whitespace-nowrap"
                  onClick={toggleAllSystem}
                  title="Select/Deselect all permissions for this system"
                >
                  <svg className="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select All
                </button>
                <button
                  className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-all shadow-sm whitespace-nowrap"
                  onClick={() => setShowCopyModal(true)}
                  title="Copy permissions from another user"
                >
                  <svg className="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy From User
                </button>
              </>
            )}
            
            {isDirty && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-semibold text-amber-700">Unsaved</span>
              </div>
            )}
          </div>
          
          {systemId && systemRoles.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Apply Role:</label>
              <select 
                className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                value={selectedRoleBySystem[systemId] || ''}
                onChange={async (e) => {
                  const roleId = e.target.value
                  if (!roleId) {
                    const newSelected = { ...selectedRoleBySystem }
                    delete newSelected[systemId]
                    setSelectedRoleBySystem(newSelected)
                    return
                  }
                  
                  if (!tenantId) {
                    const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
                    if (currentLang === 'ar') {
                      toast.error('معرف المستأجر مطلوب لتطبيق الدور')
                    } else {
                      toast.error('Tenant ID is required to apply role')
                    }
                    return
                  }
                  
                  try {
                    const success = await AccessApi.applyRoleToUser(userId, roleId, tenantId, systemId)
                    if (success) {
                      setSelectedRoleBySystem({ ...selectedRoleBySystem, [systemId]: roleId })
                      const allActionIds = sections.flatMap(s => (s.actions ?? []).map(a => a.id))
                      const { allowByAction: A, denyByAction: D, actionLevelEffect: AE } =
                        await AccessApi.readUserNodesAll({ userId, tenantId, actionIds: allActionIds })
                      setAllowByAction(A); setDenyByAction(D); if (AE) setActionLevelEffect(AE)
                      const normSets = (m) =>
                        Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Array.from(v || []).map(String).sort().join(',')]))
                      baselineRef.current = JSON.stringify({ A: normSets(A), D: normSets(D), AE: AE || {} })
                      updateExpandedFromPermissions(A, D, AE || {})
                      
                      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
                      if (currentLang === 'ar') {
                        toast.success('تم تطبيق الدور بنجاح')
                      } else {
                        toast.success('Role applied successfully')
                      }
                    } else {
                      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
                      if (currentLang === 'ar') {
                        toast.error('فشل تطبيق الدور')
                      } else {
                        toast.error('Failed to apply role')
                      }
                    }
                  } catch (err) {
                    console.error('Failed to apply role:', err)
                    const errorMessage = err?.response?.data?.error || err?.response?.data?.message || 'Unknown error'
                    const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
                    if (currentLang === 'ar') {
                      toast.error(`فشل تطبيق الدور: ${errorMessage}`)
                    } else {
                      toast.error(`Failed to apply role: ${errorMessage}`)
                    }
                  }
                }}
              >
                <option value="">-- Choose a role (optional) --</option>
                {systemRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        {!systemId ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
              <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <p className="text-xs text-slate-500 text-center">
                Select a system to configure permissions
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {sections.map((sec) => {
              const secKey = `sec:${sec.id}`
              const secOpen = expanded.has(secKey)
              return (
                <div 
                  key={sec.id}
                  className="bg-white rounded-lg border border-slate-200"
                >
                  <div className="flex items-center px-3 py-2 border-b border-slate-100">
                    <button 
                      className="flex items-center gap-2 flex-1 text-left group"
                      onClick={()=>toggleSection(sec.id)}
                    >
                      <div className={`transition-transform ${secOpen ? 'rotate-90' : ''}`}>
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                      <span className="text-xs font-semibold text-slate-700 truncate">
                        {sec.name}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 rounded">
                        {(sec.actions ?? []).length}
                      </span>
                    </button>
                    
                    <button
                      className="px-2 py-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleAllSection(sec.id)
                      }}
                      title="Select/Deselect all permissions in this section"
                    >
                      Select All
                    </button>
                  </div>

                  {secOpen && (
                    <div className="px-3 pb-2 space-y-1">
                      {(sec.actions ?? []).map(act => {
                        const actOpen = expanded.has(`act:${act.id}`)
                        const lvls = levelsByAction[act.id] || []
                        const noLevels = lvls.length === 0
                        const actionEff = actionLevelEffect[act.id] || 'NONE'
                        const checkedAction = actionEff !== 'NONE'

                        return (
                          <div key={act.id} className="border border-slate-200 rounded-md overflow-hidden">
                            <div className="flex items-center px-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors">
                              <button 
                                className="flex items-center gap-1.5 text-xs text-slate-700 flex-1 min-w-0"
                                onClick={()=>toggleAction(act.id)}
                              >
                                <div className={`transition-transform ${actOpen ? 'rotate-90' : ''}`}>
                                  <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                                <span className="truncate font-medium">{act.name}</span>
                              </button>

                              {noLevels && (
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                    checked={checkedAction}
                                    onChange={e=>{
                                      const checked = e.target.checked
                                      setActionLevelEffect(prev=>{
                                        const cur = prev[act.id] || 'NONE'
                                        if (!checked) return { ...prev, [act.id]: 'NONE' }
                                        const next = mode
                                        return { ...prev, [act.id]: (cur === next) ? 'NONE' : next }
                                      })
                                    }}
                                  />
                                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${checkedAction
                                    ? (actionEff==='ALLOW' 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-rose-500 text-white')
                                    : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    {checkedAction ? actionEff : 'NONE'}
                                  </span>
                                </label>
                              )}
                            </div>

                            {actOpen && !noLevels && (
                              <div className="px-3 py-2 bg-white space-y-1">
                                {rootNodesForAction(act.id).map(n => renderScopeNode(act.id, n))}
                              </div>
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
        )}
      </div>

      {showCopyModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !copyingPermissions) {
              setShowCopyModal(false)
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Copy Permissions from User</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select User to Copy From:
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={copySourceUserId}
                  onChange={(e) => setCopySourceUserId(e.target.value)}
                  disabled={copyingPermissions}
                >
                  <option value="">-- Select a user --</option>
                  {users.filter(u => u.id !== userId).map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  This will copy all permissions from the selected user for the current system ({systems.find(s => s.id === systemId)?.name || systemId}).
                  Existing permissions will be replaced.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCopyModal(false)
                  setCopySourceUserId('')
                }}
                disabled={copyingPermissions}
                className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!copySourceUserId || !systemId || !userId) return
                  
                  setCopyingPermissions(true)
                  try {
                    const count = await AccessApi.copyUserPermissions(copySourceUserId, userId, tenantId, systemId)
                    
                    const allActionIds = sections.flatMap(s => (s.actions ?? []).map(a => a.id))
                    const { allowByAction: A, denyByAction: D, actionLevelEffect: AE } =
                      await AccessApi.readUserNodesAll({ userId, tenantId, actionIds: allActionIds })
                    setAllowByAction(A); setDenyByAction(D); if (AE) setActionLevelEffect(AE)
                    const normSets = (m) =>
                      Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Array.from(v || []).map(String).sort().join(',')]))
                    baselineRef.current = JSON.stringify({ A: normSets(A), D: normSets(D), AE: AE || {} })
                    updateExpandedFromPermissions(A, D, AE || {})
                    
                    const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
                    if (currentLang === 'ar') {
                      toast.success(`تم نسخ ${count} صلاحية بنجاح`)
                    } else {
                      toast.success(`Copied ${count} permissions successfully`)
                    }
                    
                    setShowCopyModal(false)
                    setCopySourceUserId('')
                  } catch (err) {
                    console.error('Failed to copy permissions:', err)
                    const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
                    if (currentLang === 'ar') {
                      toast.error('فشل نسخ الصلاحيات')
                    } else {
                      toast.error('Failed to copy permissions')
                    }
                  } finally {
                    setCopyingPermissions(false)
                  }
                }}
                disabled={!copySourceUserId || copyingPermissions}
                className="px-4 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {copyingPermissions ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Copying...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Permissions
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



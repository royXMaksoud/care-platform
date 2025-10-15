// src/components/UserPermissionsSystemTree.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/axios'

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

  systemTree: async (systemId, lang) => {
    const { data } = await api.get(`/access/api/system-trees/${encodeURIComponent(systemId)}`, { params: { lang } })
    return data
  },

  
  readUserNodesAll: async ({ userId, tenantId, actionIds }) => {
    const params = new URLSearchParams()
    params.set('userId', userId)
    if (Array.isArray(actionIds)) {
      for (const id of actionIds) params.append('actionIds', id)
    }

    const { data } = await api.get('/access/api/user-permissions/states', {
      params,
      paramsSerializer: p => p.toString(), // actionIds=...&actionIds=...
      headers: tenantId ? { 'X-Tenant-Id': tenantId } : undefined
    })

    const allowByAction = {}
    const denyByAction  = {}
    const actionLevelEffect = {}

    for (const g of (data ?? [])) {
      const a = new Set(), d = new Set()

      // nodeStates: { [nodeId]: "ALLOW" | "DENY" }
      const states = g.nodeStates || {}
      for (const [valueId, eff] of Object.entries(states)) {
        ;(eff === 'DENY' ? d : a).add(String(valueId))
      }

      if (a.size) allowByAction[g.systemSectionActionId] = a
      if (d.size) denyByAction [g.systemSectionActionId] = d

      //  actionEffect = ALLOW/DENY
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
  const [lang, setLang] = useState(defaultLang)
  const [systems, setSystems] = useState([])
  const [systemId, setSystemId] = useState('')

  const [sections, setSections] = useState([])
  const [levelsByAction, setLevelsByAction] = useState({})
  const [treeByAction, setTreeByAction] = useState({})

  const [actionLevelEffect, setActionLevelEffect] = useState({})
  const [expanded, setExpanded] = useState(new Set())
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

  // Toggle all permissions for entire system
  const toggleAllSystem = () => {
    const allActionIds = sections.flatMap(s => (s.actions ?? []).map(a => a.id))
    
    // Check if all are selected
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
      // Deselect all
      setActionLevelEffect({})
      setAllowByAction({})
      setDenyByAction({})
    } else {
      // Select all
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

  // Toggle all permissions for a section
  const toggleAllSection = (sectionId) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    const actionIds = (section.actions ?? []).map(a => a.id)
    
    // Check if all in section are selected
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
      // Deselect all in section
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
      // Select all in section
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

  useEffect(() => {
    (async () => {
      setSections([]); setLevelsByAction({}); setTreeByAction({}); setExpanded(new Set())
      setAllowByAction({}); setDenyByAction({}); setActionLevelEffect({})
      baselineRef.current = '{"A":{},"D":{},"AE":{}}'
      if (!systemId) return

      const tree = await AccessApi.systemTree(systemId, lang)
      const secList = Array.isArray(tree?.sections) ? tree.sections : []
      setSections(secList)

      const levels = {}, trees = {}
      const flatten = (actionId, nodes, pathIds) => {
        const key = pk(pathIds)
        const list = (nodes ?? []).map(n => ({
          id: String(n.id), name: n.name, levelIndex: n.levelIndex,
          hasChildren: Array.isArray(n.children) && n.children.length > 0, pathIds
        }))
        trees[actionId] = trees[actionId] || {}
        trees[actionId][key] = { loaded: true, nodes: list }
        for (const n of (nodes ?? [])) if (n.children && n.children.length) flatten(actionId, n.children, [...pathIds, String(n.id)])
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
            flatten(act.id, act.scopes ?? [], [])
          }
        }
      }
      setLevelsByAction(levels); setTreeByAction(trees)

      if (userId) {
        const { allowByAction: A, denyByAction: D, actionLevelEffect: AE } =
          await AccessApi.readUserNodesAll({ userId, tenantId, actionIds: allActionIds })
        setAllowByAction(A); setDenyByAction(D); if (AE) setActionLevelEffect(AE)
        const normSets = (m) =>
          Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Array.from(v || []).map(String).sort().join(',')]))
        baselineRef.current = JSON.stringify({ A: normSets(A), D: normSets(D), AE: AE || {} })
      }
    })()
  }, [systemId, lang, userId, tenantId])

  const lastIndexOf = useCallback((actionId) => {
    const lvls = levelsByAction[actionId] || []
    return lvls.length ? lvls.length - 1 : -1
  }, [levelsByAction])

  const rootNodesForAction = (actionId) => treeByAction[actionId]?.['']?.nodes || []

  const toggleSection = (sectionId) => {
    setExpanded(prev => { const k = `sec:${sectionId}`; const next = new Set(prev); next.has(k) ? next.delete(k) : next.add(k); return next })
  }
  const toggleAction = (actionId) => {
    setExpanded(prev => { const k = `act:${actionId}`; const next = new Set(prev); next.has(k) ? next.delete(k) : next.add(k); return next })
  }
  const toggleScopeNode = (actionId, node) => {
    if (!node.hasChildren) return
    const newPath = [...node.pathIds, node.id]
    setExpanded(prev => { const k = `scp:${actionId}|${pk(newPath)}`; const next = new Set(prev); next.has(k) ? next.delete(k) : next.add(k); return next })
  }

  const selState = (actionId, valueId) => {
    const a = allowByAction[actionId]; const d = denyByAction[actionId]
    if (a?.has(String(valueId))) return 'ALLOW'
    if (d?.has(String(valueId))) return 'DENY'
    return 'NONE'
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
      // Get all actions from the current system to track what existed before
      const allCurrentActionIds = sections.flatMap(s => (s.actions ?? []).map(a => a.id))
      
      // Parse baseline to get actions that had permissions before
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
        ...hadPermissionsBefore // Include actions that had permissions before
      ])
      
      for (const actionId of touchedActions) {
        const lvls = levelsByAction[actionId] || []
        
        // For actions without scopes (action-level permissions)
        if (lvls.length === 0) {
          const eff = actionLevelEffect[actionId]
          const hadBefore = hadPermissionsBefore.has(actionId)
          
          // Send item if it has permission OR had permission before (to delete it)
          if (eff && eff !== 'NONE') {
            items.push({ userId, systemSectionActionId: actionId, actionEffect: eff, nodes: [], deleted: false })
          } else if (hadBefore) {
            // Had permission before, now NONE -> mark for deletion
            items.push({ userId, systemSectionActionId: actionId, actionEffect: 'NONE', nodes: [], deleted: true })
          }
          continue
        }
        
        // For actions with scopes (node-level permissions)
        const last = lvls[lvls.length - 1]
        const allowIds = [...(allowByAction[actionId] || [])]
        const denyIds  = [...(denyByAction[actionId]  || [])]
        const hadBefore = hadPermissionsBefore.has(actionId)
        
        if (allowIds.length || denyIds.length) {
          // Has permissions -> send them
          const nodes = [
            ...allowIds.map(v => ({ codeTableId: last.scopeTableId, codeTableValueId: v, effect: 'ALLOW' })),
            ...denyIds .map(v => ({ codeTableId: last.scopeTableId, codeTableValueId: v, effect: 'DENY'  })),
          ]
          items.push({ userId, systemSectionActionId: actionId, actionEffect: 'NONE', nodes, deleted: false })
        } else if (hadBefore) {
          // Had permissions before, now empty -> mark for deletion
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
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Compact Professional Header */}
      <div className="flex-none bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Title */}
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
          
          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Mode Toggle - Compact */}
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

            {/* Save Button */}
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

        {/* System Selector & Select All Bar */}
        <div className="px-6 pb-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">System:</label>
            <select 
              className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              value={systemId} 
              onChange={e=>setSystemId(e.target.value)}
            >
              <option value="">Choose a system...</option>
              {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            
            {systemId && (
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
            )}
            
            {isDirty && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-semibold text-amber-700">Unsaved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permissions Tree - Compact List */}
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
            {sections.map((sec, secIdx) => {
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
                                {rootNodesForAction(act.id).map(n => {
                                  const isLeafNode = n.levelIndex === lastIndexOf(act.id)
                                  const state = selState(act.id, n.id)
                                  const branchKey = `scp:${act.id}|${pk([...n.pathIds, n.id])}`
                                  const scopeOpen = expanded.has(branchKey)

                                  return (
                                    <div key={n.id}>
                                      {!isLeafNode ? (
                                        <button 
                                          className="w-full flex items-center gap-1.5 py-1 px-2 text-left hover:bg-slate-50 rounded"
                                          onClick={()=>toggleScopeNode(act.id, n)}
                                        >
                                          <div className={`transition-transform ${scopeOpen ? 'rotate-90' : ''}`}>
                                            <svg className="w-2 h-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                          </div>
                                          <span className="text-[11px] text-slate-600 truncate">
                                            {n.name}
                                          </span>
                                        </button>
                                      ) : (
                                        <label className="flex items-center gap-1.5 py-1 px-2 hover:bg-slate-50 cursor-pointer rounded">
                                          <input
                                            type="checkbox"
                                            className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                            checked={state!=='NONE'}
                                            onChange={e=>onLeafCheckChange(act.id, n, e.target.checked)}
                                          />
                                          <span className={`text-[11px] flex-1 truncate ${
                                            state==='ALLOW' 
                                              ? 'text-slate-700 font-medium' 
                                              : state==='DENY' 
                                              ? 'text-slate-500 line-through'
                                              : 'text-slate-500'
                                          }`}>
                                            {n.name}
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
                                })}
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
    </div>
  )
}

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import {
  Building2,
  LayoutDashboard,
  Loader2,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { SYSTEM_SECTIONS } from '@/config/systemSectionConstants'
import { useSystemSectionScopes } from '@/modules/appointment/hooks/useSystemSectionScopes'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'

export default function BranchServiceTypeList() {
  const queryClient = useQueryClient()
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [allOrganizationBranches, setAllOrganizationBranches] = useState([])
  const [loadingScopedBranches, setLoadingScopedBranches] = useState(false)

  const lastScopeFetchKeyRef = useRef(null)

  // Get scopeValueIds from APPOINTMENT_SETUP_AND_CONFIGURATION section only
  const { scopeValueIds, isLoading: isLoadingScopes } = useSystemSectionScopes(SYSTEM_SECTIONS.Appointment_SETUP_AND_CONFIGURATION)

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['branch-service-types'],
    queryFn: async () => {
      const { data } = await api.get('/appointment-service/api/admin/branch-service-types')
      return data ?? []
    },
  })

  const hydrateBranch = (input) => {
    if (!input) return null
    const branchInfo = allOrganizationBranches.find(
      (item) => item.organizationBranchId === input.organizationBranchId,
    )

    if (branchInfo) {
      return {
        organizationBranchId: branchInfo.organizationBranchId,
        branchName: branchInfo.organizationBranchName || branchInfo.name || branchInfo.organizationBranchId,
        organizationId: branchInfo.organizationId,
        organizationName: branchInfo.organizationName || branchInfo.organizationId,
      }
    }

    return {
      organizationBranchId: input.organizationBranchId,
      branchName: input.branchName || input.organizationBranchId,
      organizationId: input.organizationId,
      organizationName: input.organizationName || '',
    }
  }

  const handleOpenBranch = (branch) => {
    const hydrated = hydrateBranch(branch)
    if (!hydrated) return
    if (hydrated.organizationId) {
      setSelectedOrganizationId(hydrated.organizationId)
    }
    if (hydrated.organizationBranchId) {
      setSelectedBranchId(hydrated.organizationBranchId)
    }
    setSelectedBranch(hydrated)
  }

  const handleCloseEditor = () => {
    setSelectedBranch(null)
  }

  const handleAfterSave = async () => {
    await queryClient.invalidateQueries({ queryKey: ['branch-service-types'] })
    if (selectedBranch?.organizationBranchId) {
      await queryClient.invalidateQueries({
        queryKey: ['branch-service-types', selectedBranch.organizationBranchId],
      })
    }
  }

  useEffect(() => {
    let isActive = true
    const loadScopedBranches = async () => {
      try {
        setLoadingScopedBranches(true)
        const scopeKey = JSON.stringify((scopeValueIds ?? []).sort())

        if (!scopeValueIds.length) {
          lastScopeFetchKeyRef.current = scopeKey
          if (isActive) {
            setAllOrganizationBranches([])
            setSelectedOrganizationId('')
            setSelectedBranchId('')
          }
          return
        }

        if (lastScopeFetchKeyRef.current === scopeKey) {
          return
        }

        lastScopeFetchKeyRef.current = scopeKey

        const payload = { scopeValueIds, lang: 'en' }
        const { data } = await api.post(
          '/access/api/dropdowns/organization-branches/by-scope',
          payload,
        )
        if (!isActive) return

        const items = Array.isArray(data) ? data : []
        setAllOrganizationBranches(items)
      } catch (err) {
        if (!isActive) return
        console.error('Failed to load scoped organization branches:', err)
        toast.error('Failed to load organizations')
        setAllOrganizationBranches([])
        lastScopeFetchKeyRef.current = null
      } finally {
        if (isActive) {
          setLoadingScopedBranches(false)
        }
      }
    }

    loadScopedBranches()

    return () => {
      isActive = false
    }
  }, [scopeValueIds])

  const organizations = useMemo(() => {
    const seen = new Set()
    return allOrganizationBranches.reduce((acc, item) => {
      if (!item?.organizationId || seen.has(item.organizationId)) {
        return acc
      }
      seen.add(item.organizationId)
      acc.push({
        organizationId: item.organizationId,
        organizationName: item.organizationName || 'Unknown organization',
      })
      return acc
    }, [])
  }, [allOrganizationBranches])

  const branchesByOrganization = useMemo(() => {
    return allOrganizationBranches.filter(
      (item) => item.organizationId === selectedOrganizationId,
    )
  }, [allOrganizationBranches, selectedOrganizationId])

  const tableRows = useMemo(() => {
    let branches = allOrganizationBranches
    if (selectedOrganizationId) {
      branches = branches.filter((item) => item.organizationId === selectedOrganizationId)
    }
    if (selectedBranchId) {
      branches = branches.filter((item) => item.organizationBranchId === selectedBranchId)
    }

    const seen = new Set()
    const rows = branches
      .filter((branch) => branch?.organizationBranchId)
      .map((branch) => {
        const branchId = branch.organizationBranchId
        if (seen.has(branchId)) return null
        seen.add(branchId)
        const summary = summaries.find((item) => item.organizationBranchId === branchId)
        return {
          branchId,
          branchName: branch.organizationBranchName || branch.name || branchId,
          organizationId: branch.organizationId,
          organizationName: branch.organizationName || branch.organizationId,
          assignedServiceCount: summary?.assignedServiceCount ?? 0,
        }
      })
      .filter(Boolean)

    if (!rows.length && !selectedOrganizationId && !selectedBranchId) {
      summaries.forEach((summary) => {
        if (summary?.organizationBranchId && !seen.has(summary.organizationBranchId)) {
          rows.push({
            branchId: summary.organizationBranchId,
            branchName: summary.branchName || summary.organizationBranchId,
            organizationId: summary.organizationId,
            organizationName: summary.organizationName || summary.organizationId,
            assignedServiceCount: summary.assignedServiceCount ?? 0,
          })
        }
      })
    }

    return rows
  }, [allOrganizationBranches, selectedOrganizationId, selectedBranchId, summaries])

  const handleBranchSelection = (branchId) => {
    setSelectedBranchId(branchId)
  }

  const handleOpenSelectedBranch = () => {
    if (!selectedBranchId) {
      toast.error('Please select a branch first')
      return
    }
    const branch = hydrateBranch({
      organizationBranchId: selectedBranchId,
      organizationId: selectedOrganizationId,
    })
    if (!branch) {
      toast.error('Unable to find selected branch details')
      return
    }
    setSelectedBranch(branch)
  }

  useEffect(() => {
    if (!selectedOrganizationId) {
      if (selectedBranchId) {
        setSelectedBranchId('')
      }
      if (selectedBranch) {
        setSelectedBranch(null)
      }
      return
    }

    const belongs = allOrganizationBranches.some(
      (item) =>
        item.organizationId === selectedOrganizationId &&
        item.organizationBranchId === selectedBranchId,
    )

    if (!belongs) {
      if (selectedBranchId) {
        setSelectedBranchId('')
      }
      if (selectedBranch) {
        setSelectedBranch(null)
      }
    }
  }, [selectedOrganizationId, selectedBranchId, allOrganizationBranches])

  useEffect(() => {
    if (!selectedBranch || !selectedBranchId) {
      return
    }
    const branch = hydrateBranch({
      organizationBranchId: selectedBranchId,
      organizationId: selectedOrganizationId,
    })
    if (
      branch &&
      branch.organizationBranchId === selectedBranch.organizationBranchId &&
      (branch.branchName !== selectedBranch.branchName ||
        branch.organizationName !== selectedBranch.organizationName)
    ) {
      setSelectedBranch(branch)
    }
  }, [selectedBranchId, selectedOrganizationId, allOrganizationBranches])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb />
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
              <LayoutDashboard className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Branch Service Availability</h1>
              <p className="text-sm text-gray-600">
                Configure which services each organization branch provides and manage pricing
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm lg:flex-row lg:items-end lg:gap-4">
            <div className="flex flex-col min-w-[200px]">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Organization
              </label>
              <select
                value={selectedOrganizationId}
                onChange={(e) => setSelectedOrganizationId(e.target.value)}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Select organization…</option>
                {organizations.map((org) => (
                  <option key={org.organizationId} value={org.organizationId}>
                    {org.organizationName || org.organizationId}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col min-w-[200px]">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Branch
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => handleBranchSelection(e.target.value)}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100"
                disabled={!selectedOrganizationId || loadingScopedBranches}
              >
                <option value="">
                  {loadingScopedBranches
                    ? 'Loading…'
                    : selectedOrganizationId
                      ? 'Select branch…'
                      : 'Select organization first'}
                </option>
                {branchesByOrganization.map((branch) => (
                  <option key={branch.organizationBranchId} value={branch.organizationBranchId}>
                    {branch.organizationBranchName || branch.organizationBranchId}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleOpenSelectedBranch}
              disabled={!selectedBranchId}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200/60 transition-all hover:translate-y-[-1px] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Configure Selected Branch
            </button>
          </div>
        </div>

        {!loadingScopedBranches && allOrganizationBranches.length === 0 && (
          <div className="mx-auto mb-4 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            You don’t have any accessible branches yet. Selectors will be populated once your account is granted branch access.
          </div>
        )}

        <div className="rounded-2xl border border-white/70 bg-white/90 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Branch Overview
            </h2>
            <span className="text-xs text-slate-500">
              {tableRows.length} {tableRows.length === 1 ? 'branch' : 'branches'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Organization
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading branch data…
                      </span>
                    </td>
                  </tr>
                )}
                {!isLoading && tableRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-slate-600">
                        <Building2 className="h-8 w-8 text-slate-400" />
                        <p className="text-sm">
                          No branch mappings yet. Start by configuring which services a branch
                          provides.
                        </p>
                        <p className="text-xs text-slate-500">
                          Select an organization and branch from the controls above to start mapping services.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {tableRows.map((row) => {
                  const isSelected = row.branchId === selectedBranchId
                  return (
                    <tr
                      key={row.branchId}
                      onClick={() =>
                        handleOpenBranch({
                          organizationBranchId: row.branchId,
                          branchName: row.branchName,
                          organizationId: row.organizationId,
                          organizationName: row.organizationName,
                        })
                      }
                      className={`cursor-pointer transition hover:bg-slate-50/80 ${
                        isSelected ? 'bg-emerald-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {row.branchName || 'Unnamed Branch'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">
                          {row.organizationName || 'Unknown Organization'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedBranch && (
        <BranchServiceTypeEditor
          branch={selectedBranch}
          onClose={handleCloseEditor}
          onSaved={handleAfterSave}
        />
      )}
    </div>
  )
}

function BranchServiceTypeEditor({ branch, onClose, onSaved }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [assignments, setAssignments] = useState(new Map())
  const [expanded, setExpanded] = useState(new Set())

  const { data, isLoading } = useQuery({
    enabled: !!branch?.organizationBranchId,
    queryKey: ['branch-service-types', branch?.organizationBranchId],
    queryFn: async () => {
      const { data } = await api.get(
        `/appointment-service/api/admin/branch-service-types/${branch.organizationBranchId}`,
      )
      return data
    },
  })

  useEffect(() => {
    if (!data) return
    const initial = new Map()
    const expandIds = new Set()
    const collect = (node) => {
      if (node.assigned) {
        initial.set(node.serviceTypeId, {
          cost: Number(node.cost ?? 0),
        })
      }
      if (node.children && node.children.length > 0) {
        expandIds.add(node.serviceTypeId)
        node.children.forEach(collect)
      }
    }
    data.serviceTree?.forEach(collect)
    setAssignments(initial)
    setExpanded(expandIds)
  }, [data])

  const mutation = useMutation({
    mutationFn: async (payload) => {
      await api.put(
        `/appointment-service/api/admin/branch-service-types/${branch.organizationBranchId}`,
        payload,
      )
    },
    onSuccess: () => {
      toast.success('Branch services updated')
      queryClient.invalidateQueries({
        queryKey: ['branch-service-types', branch.organizationBranchId],
      })
      onSaved?.()
      onClose?.()
    },
    onError: (error) => {
      console.error('Failed to update branch services', error)
      toast.error(error.response?.data?.message || 'Failed to save branch services')
    },
  })

  const handleToggleNode = (node, assigned) => {
    setAssignments((prev) => {
      const next = new Map(prev)
      updateAssignmentRecursively(next, node, assigned)
      return next
    })
  }

  const handleCostChange = (serviceTypeId, value) => {
    const parsed = Number(value)
    const normalized = Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
    setAssignments((prev) => {
      const next = new Map(prev)
      const current = next.get(serviceTypeId) || { cost: 0 }
      next.set(serviceTypeId, { ...current, cost: normalized })
      return next
    })
  }

  const handleToggleExpand = (serviceTypeId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(serviceTypeId)) {
        next.delete(serviceTypeId)
      } else {
        next.add(serviceTypeId)
      }
      return next
    })
  }

  const filteredIds = useMemo(() => {
    const ids = new Set()
    if (!data?.serviceTree) return ids
    const term = search.trim().toLowerCase()
    const collect = (node, ancestors = []) => {
      const matches = !term || node.name?.toLowerCase().includes(term)
      const childMatches = (node.children || []).map((child) => collect(child, [...ancestors, node.serviceTypeId])).some(Boolean)
      if (matches || childMatches) {
        ids.add(node.serviceTypeId)
        ancestors.forEach((id) => ids.add(id))
      }
      return matches || childMatches
    }
    data.serviceTree.forEach((node) => collect(node, []))
    return ids
  }, [data, search])

  const filteredTree = useMemo(() => {
    if (!data?.serviceTree) return []
    const filter = (node, level = 0) => {
      if (!filteredIds.has(node.serviceTypeId)) {
        if (!node.children || node.children.length === 0) {
          return null
        }
      }

      const children = (node.children || [])
        .map((child) => filter(child, level + 1))
        .filter(Boolean)

      if (level === 0 && !node.parentServiceTypeId && children.length === 0) {
        return null
      }

      return { ...node, children }
    }
    return data.serviceTree.map((node) => filter(node, 0)).filter(Boolean)
  }, [data?.serviceTree, filteredIds])

  const selectedCount = assignments.size
  const totalCost = Array.from(assignments.values())
    .map((item) => Number(item.cost) || 0)
    .reduce((acc, value) => acc + value, 0)

  const handleSave = () => {
    const payload = {
      assignments: Array.from(assignments.entries()).map(([serviceTypeId, details]) => ({
        serviceTypeId,
        cost: Number(details.cost) || 0,
      })),
    }
    mutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-stretch justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="hidden flex-1 md:block" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl sm:max-w-3xl sm:max-h-[90vh] overflow-hidden border-l border-slate-200 bg-white shadow-2xl sm:rounded-l-2xl">
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Configure Services
            </h2>
            <p className="text-xs text-slate-500">
              {branch.organizationName ? `${branch.organizationName} • ` : ''}
              {branch.branchName || branch.organizationBranchId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="flex-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Loading service tree…</p>
              </div>
            )}
            {!isLoading && filteredTree.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
                <Circle className="h-10 w-10" />
                <p className="text-sm text-center max-w-xs">
                  There are no active service types configured. Add service types first to enable branch mapping.
                </p>
              </div>
            )}
            {!isLoading && filteredTree.length > 0 && (
              <div className="pb-20">
                {filteredTree.map((node) => (
                  <TreeNode
                    key={node.serviceTypeId}
                    node={node}
                    depth={0}
                    assignments={assignments}
                    filteredIds={filteredIds}
                    expanded={expanded}
                    onToggle={handleToggleNode}
                    onCostChange={handleCostChange}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {selectedCount} services selected
                </span>
                <span className="text-slate-500">
                  Estimated total cost:{' '}
                  <span className="font-semibold text-slate-700">
                    {formatCurrency(totalCost)}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={mutation.isLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200/60 transition-all hover:translate-y-[-1px] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mutation.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

function TreeNode({
  node,
  depth,
  assignments,
  filteredIds,
  expanded,
  onToggle,
  onCostChange,
  onToggleExpand,
}) {
  if (!filteredIds.has(node.serviceTypeId)) {
    return null
  }

  const hasChildren = node.children && node.children.length > 0
  const isLeaf = !hasChildren
  const isAssigned = isLeaf
    ? assignments.has(node.serviceTypeId)
    : areAllLeafDescendantsSelected(node, assignments)
  const costValue = assignments.get(node.serviceTypeId)?.cost ?? node.cost ?? 0
  const isExpanded = expanded.has(node.serviceTypeId) || depth === 0

  const handleToggle = (checked) => {
    onToggle(node, checked)
  }

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center justify-between rounded-lg px-3 py-2 transition ${
          isAssigned ? 'bg-emerald-50/60 border border-emerald-200' : 'hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleExpand(node.serviceTypeId)}
              className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <input
            type="checkbox"
            checked={isAssigned}
            onChange={(e) => handleToggle(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
          />
          <div>
            <p className="text-sm font-semibold text-slate-700">{node.name}</p>
            <p className="text-xs text-slate-400">
              {node.code || 'No code'}{node.leaf ? ' • Leaf' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={costValue}
            onChange={(e) => onCostChange(node.serviceTypeId, e.target.value)}
            disabled={!isLeaf || !isAssigned}
            className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="space-y-2">
          {node.children.map((child) => (
            <TreeNode
              key={child.serviceTypeId}
              node={child}
              depth={depth + 1}
              assignments={assignments}
              filteredIds={filteredIds}
              expanded={expanded}
              onToggle={onToggle}
              onCostChange={onCostChange}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function updateAssignmentRecursively(map, node, assigned) {
  const hasChildren = node.children && node.children.length > 0
  if (hasChildren) {
    node.children.forEach((child) => updateAssignmentRecursively(map, child, assigned))
    map.delete(node.serviceTypeId)
  } else {
    if (assigned) {
      const existing = map.get(node.serviceTypeId)
      map.set(node.serviceTypeId, {
        cost: existing?.cost ?? Number(node.cost ?? 0),
      })
    } else {
      map.delete(node.serviceTypeId)
    }
  }
}

function formatCurrency(value) {
  const numeric = Number(value) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numeric)
}

function areAllLeafDescendantsSelected(node, assignments) {
  if (!node.children || node.children.length === 0) {
    return assignments.has(node.serviceTypeId)
  }
  return node.children.every((child) => areAllLeafDescendantsSelected(child, assignments))
}



import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import CrudFormModal from '@/components/CrudFormModal'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import {
  FileText,
  Languages,
  List as ListIcon,
  Blocks,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
} from 'lucide-react'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'

export default function ServiceTypeList() {
  const navigate = useNavigate()
  const [serviceTypesMap, setServiceTypesMap] = useState({})
  const [activeTab, setActiveTab] = useState('list')
  const [listRefreshKey, setListRefreshKey] = useState(0)
  const [treeRefreshKey, setTreeRefreshKey] = useState(0)
  const [treeLoading, setTreeLoading] = useState(false)
  const [serviceTypeTree, setServiceTypeTree] = useState([])
  const [treeCreateOpen, setTreeCreateOpen] = useState(false)
  const [treeCreateDefaults, setTreeCreateDefaults] = useState(null)

  const loadServiceTypes = useCallback(async () => {
    setTreeLoading(true)
    try {
      const { data } = await api.get('/appointment-service/api/admin/service-types', {
        params: { page: 0, size: 5000 },
      })
      const items = data?.content ?? data ?? []
      const map = {}
      items.forEach((st) => {
        if (st?.serviceTypeId) {
          map[st.serviceTypeId] = st.name
        }
      })
      setServiceTypesMap(map)

      const nodes = {}
      items.forEach((item) => {
        nodes[item.serviceTypeId] = { ...item, children: [] }
      })
      const roots = []
      items.forEach((item) => {
        if (item.parentId && nodes[item.parentId]) {
          nodes[item.parentId].children.push(nodes[item.serviceTypeId])
        } else {
          roots.push(nodes[item.serviceTypeId])
        }
      })
      setServiceTypeTree(roots)
    } catch (err) {
      console.error('Failed to load service types tree:', err)
      toast.error('Failed to load service type hierarchy')
      setServiceTypeTree([])
    } finally {
      setTreeLoading(false)
    }
  }, [])

  useEffect(() => {
    loadServiceTypes()
  }, [loadServiceTypes, treeRefreshKey])

  const serviceTypeColumns = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Service Name',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900">{getValue() || '-'}</span>
      ),
      meta: { type: 'string', filterKey: 'name', operators: ['LIKE', 'EQUAL', 'STARTS_WITH'] },
    },
    {
      id: 'code',
      accessorKey: 'code',
      header: 'Code',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-600">{getValue() || '-'}</span>
      ),
      meta: { type: 'string', filterKey: 'code', operators: ['EQUAL', 'STARTS_WITH'] },
    },
    {
      id: 'parentId',
      accessorKey: 'parentId',
      header: 'Parent Service',
      cell: ({ getValue }) => {
        const parentId = getValue()
        if (!parentId) {
          return <span className="text-xs text-gray-500">Root</span>
        }
        const parentName = serviceTypesMap[parentId] || parentId
        return (
          <div className="flex flex-col">
            <span className="text-sm text-gray-900">{parentName}</span>
            <span className="text-xs text-indigo-500 font-medium">Leaf</span>
          </div>
        )
      },
      meta: { type: 'string', filterKey: 'parentId', operators: ['EQUAL', 'IS_NULL'] },
    },
    {
      id: 'isLeaf',
      accessorKey: 'isLeaf',
      header: 'Type',
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          getValue() 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {getValue() ? 'Detailed' : 'General'}
        </span>
      ),
      meta: { type: 'boolean', filterKey: 'isLeaf', operators: ['EQUAL'] },
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          getValue() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {getValue() ? 'Active' : 'Inactive'}
        </span>
      ),
      meta: { type: 'boolean', filterKey: 'isActive', operators: ['EQUAL'] },
    },
    {
      id: 'languages',
      header: 'Languages',
      cell: ({ row }) => (
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/appointment/service-types/${row.original.serviceTypeId}`)
          }}
        >
          <Languages className="w-4 h-4" />
          Manage
        </button>
      ),
      enableSorting: false,
    },
  ]

  const formFields = useMemo(
    () => [
      { type: 'text', name: 'name', label: 'Service Name', required: true, maxLength: 200 },
      { type: 'text', name: 'code', label: 'Code', required: true, maxLength: 100 },
      { type: 'textarea', name: 'description', label: 'Description', maxLength: 500, rows: 3 },
      {
        type: 'select',
        name: 'parentId',
        label: 'Parent Service (optional)',
        options: Object.entries(serviceTypesMap).map(([id, label]) => ({ value: id, label })),
        placeholder: 'Leave empty for root service',
      },
      { type: 'checkbox', name: 'isLeaf', label: 'Is Detailed Service (Leaf)', defaultValue: false },
      { type: 'number', name: 'displayOrder', label: 'Display Order', min: 1, defaultValue: 1 },
      { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
    ],
    [serviceTypesMap]
  )

  const toCreatePayload = (formData) => ({
    name: formData.name,
    code: formData.code,
    description: formData.description || null,
    parentId: formData.parentId || null,
    isLeaf: formData.isLeaf === true,
    displayOrder: parseInt(formData.displayOrder) || 1,
    isActive: formData.isActive !== false,
  })

  const toUpdatePayload = (formData) => ({
    name: formData.name,
    code: formData.code,
    description: formData.description || null,
    parentId: formData.parentId || null,
    isLeaf: formData.isLeaf === true,
    displayOrder: parseInt(formData.displayOrder) || 1,
    isActive: formData.isActive !== false,
  })

  const handleTreeAddRoot = useCallback(() => {
    setTreeCreateDefaults({
      parentId: null,
      isLeaf: false,
      isActive: true,
      displayOrder: 1,
    })
    setTreeCreateOpen(true)
  }, [])

  const handleTreeAddChild = useCallback((node) => {
    setTreeCreateDefaults({
      parentId: node.serviceTypeId,
      isLeaf: true,
      isActive: true,
      displayOrder: (node.children?.length ?? 0) + 1,
    })
    setTreeCreateOpen(true)
  }, [])

  const handleTreeEdit = useCallback(
    (node) => {
      navigate(`/appointment/service-types/${node.serviceTypeId}`)
    },
    [navigate]
  )

  const handleTreeCreateSubmit = useCallback(
    async (form) => {
      const payload = {
        name: form.name,
        code: form.code,
        description: form.description || null,
        parentId: form.parentId || null,
        isLeaf: form.isLeaf === true,
        displayOrder: parseInt(form.displayOrder) || 1,
        isActive: form.isActive !== false,
      }

      try {
        await api.post('/appointment-service/api/admin/service-types', payload)
        toast.success('Service type created')
        setTreeCreateOpen(false)
        setTreeCreateDefaults(null)
        setTreeRefreshKey((k) => k + 1)
        setListRefreshKey((k) => k + 1)
      } catch (err) {
        console.error('Failed to create service type', err)
        toast.error(err?.response?.data?.message || 'Failed to create service type')
        throw err
      }
    },
    []
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb />
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <FileText className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Type Management</h1>
            <p className="text-sm text-gray-600">Manage service types and categories</p>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'list'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <ListIcon className="h-4 w-4" />
            List View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'tree'
                ? 'bg-purple-600 text-whiteopacity-90 shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Blocks className="h-4 w-4" />
            Hierarchy View
          </button>
        </div>

        {activeTab === 'list' ? (
          <CrudPage
            key={listRefreshKey}
            title="Service Types"
            service="appointment-service"
            resourceBase="/api/admin/service-types"
            idKey="serviceTypeId"
            columns={serviceTypeColumns}
            formFields={formFields}
            toCreatePayload={toCreatePayload}
            toUpdatePayload={toUpdatePayload}
            pageSize={20}
            enableCreate={true}
            enableEdit={true}
            enableDelete={true}
            tableId="service-types-list"
            onRowClick={(row) => navigate(`/appointment/service-types/${row.serviceTypeId}`)}
          />
        ) : (
          <ServiceTypeTreeView
            loading={treeLoading}
            tree={serviceTypeTree}
            onAddRoot={handleTreeAddRoot}
            onAddChild={handleTreeAddChild}
            onEdit={handleTreeEdit}
          />
        )}
      </div>

      <CrudFormModal
        open={treeCreateOpen}
        mode="create"
        title="Service Type"
        fields={formFields}
        initial={{
          isActive: true,
          isLeaf: true,
          displayOrder: 1,
          ...(treeCreateDefaults ?? {}),
        }}
        onClose={() => {
          setTreeCreateOpen(false)
          setTreeCreateDefaults(null)
        }}
        onSubmit={handleTreeCreateSubmit}
      />
    </div>
  )
}

function ServiceTypeTreeView({ tree, loading, onAddRoot, onAddChild, onEdit }) {
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    const initial = new Set()
    tree.forEach((node) => initial.add(node.serviceTypeId))
    setExpanded(initial)
  }, [tree])

  const toggleNode = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  return (
    <div className="rounded-2xl border border-purple-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-purple-100 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-purple-700">Service Hierarchy</h2>
          <p className="text-xs text-gray-500">
            Navigate the hierarchy, open any node to edit, or add children under parents.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddRoot}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add Root Service
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading hierarchy…</p>
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500">
            <p className="text-sm text-center max-w-xs">
              No service types defined yet. Add a root service type to get started.
            </p>
            <button
              type="button"
              onClick={onAddRoot}
              className="inline-flex items-center gap-2 rounded-lg border border-purple-200 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50"
            >
              <Plus className="h-4 w-4" />
              Create Root Service
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tree
              .slice()
              .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .map((node) => (
                <ServiceTypeTreeNode
                  key={node.serviceTypeId}
                  node={node}
                  expanded={expanded}
                  onToggle={toggleNode}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ServiceTypeTreeNode({ node, expanded, onToggle, onAddChild, onEdit, depth = 0 }) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0
  const isExpanded = expanded.has(node.serviceTypeId)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.serviceTypeId)}
            className="rounded-full p-1 hover:bg-gray-100"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
          </button>
        ) : (
          <span className="w-6" />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="text-sm font-medium text-gray-800 hover:text-purple-600"
          >
            {node.name}
          </button>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-500">
            {node.code || '—'}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              node.isLeaf ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
            }`}
          >
            {node.isLeaf ? 'Leaf' : 'Group'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddChild(node)}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-purple-200 px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50"
        >
          <PlusCircle className="h-3 w-3" />
          Add child
        </button>
      </div>
      {isExpanded && hasChildren && (
        <div className="ml-5 border-l border-gray-200 pl-4">
          {node.children
            .slice()
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
            .map((child) => (
              <ServiceTypeTreeNode
                key={child.serviceTypeId}
                node={child}
                expanded={expanded}
                onToggle={onToggle}
                onAddChild={onAddChild}
                onEdit={onEdit}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  )
}


// src/packages/datatable/useServerTable.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { buildFilterRequest } from './buildFilter'

type Primitive = string | number | boolean | undefined | null
type QueryParams = Record<string, Primitive>

type Args = {
  base: string
  service?: string
  pageIndex: number
  pageSize: number
  sorting: any[]
  filters: any[]
  enabled?: boolean
  queryParams?: QueryParams
  refreshKey?: number            // <-- NEW
}

export function useServerTable({
  base,
  service,
  pageIndex,
  pageSize,
  sorting,
  filters,
  enabled = true,
  queryParams = {},
  refreshKey = 0,                // <-- NEW
}: Args) {
  const qs = new URLSearchParams()
  qs.set('page', String(pageIndex))
  qs.set('size', String(pageSize))

  if (sorting?.length) {
    const s = sorting[0]
    const col = s.id || s.accessorKey || s.field || 'createdAt'
    const dir = s.desc ? 'DESC' : 'ASC'
    qs.set('sort', `${col},${dir}`)
  }

  // extra query params (codeTableId, codeTableValueId, ...)
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })

  // bump to bust caches if needed
  qs.set('_k', String(refreshKey))   // <-- NEW

  const prefix = service ? `/${service}` : ''
  const url = `${prefix}${base}/filter?${qs.toString()}`

  const query = useQuery({
    queryKey: ['table', service, base, pageIndex, pageSize, sorting, filters, queryParams, refreshKey], // <-- NEW
    queryFn: async () => {
      const payload = buildFilterRequest(filters)
      const { data } = await api.post(url, payload)
    //  console.log('📤 DEBUG useServerTable - Response:', data)
      return {
        rows: data?.content ?? [],
        total: data?.totalElements ?? 0,
      }
    },
    enabled,
    keepPreviousData: true,
  })

  return {
    rows: query.data?.rows ?? [],
    total: query.data?.total ?? 0,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}

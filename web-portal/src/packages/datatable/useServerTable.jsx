// src/packages/datatable/useServerTable.js
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const mapSort = (sorting) =>
  sorting?.[0] ? `${sorting[0].id},${sorting[0].desc ? 'desc' : 'asc'}` : undefined

const mapFilters = (filters=[]) =>
  filters.map(f => `${f.id}:LIKE:${f.value ?? ''}`).join(',')

export function useServerTable({ endpoint, pageIndex, pageSize, sorting, columnFilters }) {
  const params = {
    page: pageIndex,
    size: pageSize,
    ...(mapSort(sorting) ? { sort: mapSort(sorting) } : {}),
    ...(columnFilters?.length ? { filters: mapFilters(columnFilters) } : {})
  }

  return useQuery({
    queryKey: ['table', endpoint, params],
    queryFn: async () => (await axios.get(endpoint, { params })).data, // expects Spring Page
    keepPreviousData: true,
  })
}

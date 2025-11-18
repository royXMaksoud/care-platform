/**
 * RTK Query API for Stock Operations
 * 
 * @author CARE Team
 */

import { baseApi } from './baseApi'

export interface StockTransaction {
  transactionId: string
  tenantId: string
  materialId: string
  transactionType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'
  sourceWarehouseId?: string
  targetWarehouseId?: string
  quantity: number
  reason?: string
  referenceDocument?: string
  notes?: string
  createdById: string
  createdAt: string
}

export interface StockBalance {
  warehouseId: string
  materialId: string
  tenantId: string
  quantity: number
  lastTransactionId?: string
  updatedAt: string
  updatedById?: string
}

export interface CreateStockTransactionRequest {
  materialId: string
  transactionType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'
  sourceWarehouseId?: string
  targetWarehouseId?: string
  quantity: number
  reason?: string
  referenceDocument?: string
  notes?: string
}

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createStockTransaction: builder.mutation<StockTransaction, CreateStockTransactionRequest>({
      query: (body) => ({
        url: '/stock/transactions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StockTransaction', 'StockBalance', 'Stock'],
    }),

    getStockTransactions: builder.query<any, any>({
      query: (params) => ({
        url: '/stock/transactions',
        method: 'GET',
        params,
      }),
      providesTags: ['StockTransaction'],
    }),

    getStockBalance: builder.query<StockBalance | { materialId: string; aggregatedQuantity: number }, { materialId: string; warehouseId?: string; aggregate?: boolean }>({
      query: ({ materialId, warehouseId, aggregate }) => ({
        url: '/stock/balance',
        method: 'GET',
        params: { materialId, warehouseId, aggregate },
      }),
      providesTags: ['StockBalance'],
    }),
  }),
})

export const {
  useCreateStockTransactionMutation,
  useGetStockTransactionsQuery,
  useGetStockBalanceQuery,
} = stockApi


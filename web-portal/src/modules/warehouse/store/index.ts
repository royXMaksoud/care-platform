/**
 * Redux Store Configuration for Warehouse Module
 * 
 * Sets up Redux Toolkit store with RTK Query API slices
 * 
 * @author CARE Team
 */

import { configureStore } from '@reduxjs/toolkit'
import { warehouseApi } from './api/warehouseApi'
import { materialApi } from './api/materialApi'
import { categoryApi } from './api/categoryApi'
import { brandApi } from './api/brandApi'
import { stockApi } from './api/stockApi'
import { orderApi } from './api/orderApi'
import { customFieldApi } from './api/customFieldApi'
import { reportApi } from './api/reportApi'
import draftReducer from './slices/draftSlice'

export const warehouseStore = configureStore({
  reducer: {
    [warehouseApi.reducerPath]: warehouseApi.reducer,
    [materialApi.reducerPath]: materialApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [brandApi.reducerPath]: brandApi.reducer,
    [stockApi.reducerPath]: stockApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [customFieldApi.reducerPath]: customFieldApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
    drafts: draftReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    })
      .concat(warehouseApi.middleware)
      .concat(materialApi.middleware)
      .concat(categoryApi.middleware)
      .concat(brandApi.middleware)
      .concat(stockApi.middleware)
      .concat(orderApi.middleware)
      .concat(customFieldApi.middleware)
      .concat(reportApi.middleware),
})

export type WarehouseRootState = ReturnType<typeof warehouseStore.getState>
export type WarehouseAppDispatch = typeof warehouseStore.dispatch


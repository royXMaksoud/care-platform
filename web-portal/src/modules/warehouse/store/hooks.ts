/**
 * Typed Redux Hooks for Warehouse Module
 * 
 * Provides typed useDispatch and useSelector hooks
 * 
 * @author CARE Team
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import type { WarehouseRootState, WarehouseAppDispatch } from './index'

export const useWarehouseDispatch = () => useDispatch<WarehouseAppDispatch>()
export const useWarehouseSelector: TypedUseSelectorHook<WarehouseRootState> = useSelector


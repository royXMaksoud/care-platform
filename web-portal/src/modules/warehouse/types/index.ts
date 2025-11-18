/**
 * Warehouse Module - TypeScript Type Definitions
 */

/**
 * Warehouse Entity Type
 */
export interface Warehouse {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  capacityCubicMeters: number;
  currentOccupancyCubicMeters: number;
  availableCapacityCubicMeters: number;
  utilizationPercentage: number;
  isPrimary: boolean;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
}

/**
 * Warehouse Request DTO
 */
export interface WarehouseRequest {
  code: string;
  name: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  capacityCubicMeters: number;
  isPrimary?: boolean;
  metadata?: string;
}

/**
 * Zone Entity Type
 */
export interface Zone {
  id: string;
  tenantId: string;
  warehouseId: string;
  code: string;
  name: string;
  zoneType: 'RECEIVING' | 'STORAGE' | 'PICKING' | 'PACKING' | 'SHIPPING';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  capacityCubicMeters: number;
  currentOccupancyCubicMeters: number;
  availableCapacityCubicMeters: number;
  utilizationPercentage: number;
  temperatureControlled: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
}

/**
 * Zone Request DTO
 */
export interface ZoneRequest {
  warehouseId: string;
  code: string;
  name: string;
  zoneType: 'RECEIVING' | 'STORAGE' | 'PICKING' | 'PACKING' | 'SHIPPING';
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  capacityCubicMeters: number;
  temperatureControlled?: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
}

/**
 * Bin Entity Type
 */
export interface Bin {
  id: string;
  tenantId: string;
  zoneId: string;
  code: string;
  name?: string;
  binType: 'PALLET' | 'SHELF' | 'RACK' | 'CAGE' | 'DRAWER';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  maxWeightKg?: number;
  currentWeightKg: number;
  capacityCubicMeters: number;
  currentOccupancyCubicMeters: number;
  availableCapacityCubicMeters: number;
  utilizationPercentage: number;
  aisleNumber?: number;
  shelfNumber?: number;
  levelNumber?: number;
  barcode?: string;
  locationString?: string;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
}

/**
 * Bin Request DTO
 */
export interface BinRequest {
  zoneId: string;
  code: string;
  name?: string;
  binType: 'PALLET' | 'SHELF' | 'RACK' | 'CAGE' | 'DRAWER';
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  maxWeightKg?: number;
  capacityCubicMeters: number;
  aisleNumber?: number;
  shelfNumber?: number;
  levelNumber?: number;
  barcode?: string;
}

/**
 * Paginated Response Type
 */
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

/**
 * API Error Response Type
 */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

/**
 * Filter Options for Warehouse
 */
export interface WarehouseFilterOptions {
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  searchText?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Filter Options for Zone
 */
export interface ZoneFilterOptions {
  warehouseId?: string;
  zoneType?: 'RECEIVING' | 'STORAGE' | 'PICKING' | 'PACKING' | 'SHIPPING';
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  searchText?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Filter Options for Bin
 */
export interface BinFilterOptions {
  zoneId?: string;
  binType?: 'PALLET' | 'SHELF' | 'RACK' | 'CAGE' | 'DRAWER';
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  searchText?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Dashboard Statistics Type
 */
export interface WarehouseDashboardStats {
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  totalOccupancy: number;
  utilizationPercentage: number;
  averageUtilization: number;
  nearcapacityWarehouses: number;
}

export interface ZoneDashboardStats {
  totalZones: number;
  activeZones: number;
  totalCapacity: number;
  totalOccupancy: number;
  utilizationPercentage: number;
  byType: Record<string, number>;
}

export interface BinDashboardStats {
  totalBins: number;
  availableBins: number;
  occupiedBins: number;
  totalCapacity: number;
  totalOccupancy: number;
  utilizationPercentage: number;
  byType: Record<string, number>;
}

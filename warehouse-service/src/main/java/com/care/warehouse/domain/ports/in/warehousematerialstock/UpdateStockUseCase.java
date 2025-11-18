package com.care.warehouse.domain.ports.in.warehousematerialstock;

import com.care.warehouse.application.warehousematerialstock.command.UpdateStockCommand;
import com.care.warehouse.domain.model.WarehouseMaterialStock;

import java.util.UUID;

/**
 * Use case interface for updating stock levels.
 */
public interface UpdateStockUseCase {
    
    /**
     * Update stock levels for a material in a warehouse.
     * 
     * @param command Update stock command
     * @return Updated stock record
     */
    WarehouseMaterialStock updateStock(UpdateStockCommand command);
    
    /**
     * Get or create stock record for material and warehouse.
     * 
     * @param materialId Material ID
     * @param warehouseId Warehouse ID
     * @return Stock record
     */
    WarehouseMaterialStock getOrCreateStock(UUID materialId, UUID warehouseId);
}


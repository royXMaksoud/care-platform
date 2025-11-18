package com.care.warehouse.domain.ports.in.warehousematerialstock;

import com.care.warehouse.application.warehousematerialstock.command.ReserveStockCommand;
import com.care.warehouse.domain.model.WarehouseMaterialStock;

/**
 * Use case interface for reserving stock.
 */
public interface ReserveStockUseCase {
    
    /**
     * Reserve stock (allocate for orders).
     * Increases stock_reserved and decreases available stock.
     * 
     * @param command Reserve stock command
     * @return Updated stock record
     */
    WarehouseMaterialStock reserveStock(ReserveStockCommand command);
}


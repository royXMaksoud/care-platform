package com.care.warehouse.domain.ports.in.warehousematerialstock;

import com.care.warehouse.application.warehousematerialstock.command.ReleaseStockCommand;
import com.care.warehouse.domain.model.WarehouseMaterialStock;

/**
 * Use case interface for releasing reserved stock.
 */
public interface ReleaseStockUseCase {
    
    /**
     * Release reserved stock (when order is cancelled or shipped).
     * Decreases stock_reserved and increases available stock.
     * 
     * @param command Release stock command
     * @return Updated stock record
     */
    WarehouseMaterialStock releaseStock(ReleaseStockCommand command);
}


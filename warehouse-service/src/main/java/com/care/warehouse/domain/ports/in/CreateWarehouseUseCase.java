package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.warehouse.command.CreateWarehouseCommand;
import com.care.warehouse.domain.model.Warehouse;
import com.sharedlib.core.domain.ports.in.CreateUseCase;

/**
 * Use case interface for creating a new warehouse.
 */
public interface CreateWarehouseUseCase extends CreateUseCase<CreateWarehouseCommand, Warehouse> {
    
    /**
     * Create a new warehouse.
     * 
     * @param command Create warehouse command
     * @return Created warehouse
     */
    default Warehouse createWarehouse(CreateWarehouseCommand command) {
        return create(command);
    }
}


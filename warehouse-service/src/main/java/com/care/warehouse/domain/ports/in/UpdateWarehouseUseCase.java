package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.warehouse.command.UpdateWarehouseCommand;
import com.care.warehouse.domain.model.Warehouse;
import com.sharedlib.core.domain.ports.in.UpdateUseCase;

import java.util.UUID;

/**
 * Use case interface for updating an existing warehouse.
 */
public interface UpdateWarehouseUseCase extends UpdateUseCase<UUID, UpdateWarehouseCommand, Warehouse> {
    
    /**
     * Update an existing warehouse.
     * 
     * @param command Update warehouse command
     * @return Updated warehouse
     */
    default Warehouse updateWarehouse(UpdateWarehouseCommand command) {
        return update(command.getId(), command);
    }
}


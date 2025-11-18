package com.care.warehouse.domain.ports.in;

import com.care.warehouse.domain.model.Warehouse;
import com.sharedlib.core.domain.ports.in.GetByIdUseCase;

import java.util.Optional;
import java.util.UUID;

/**
 * Use case interface for loading a warehouse by ID.
 */
public interface GetWarehouseByIdUseCase extends GetByIdUseCase<UUID, Warehouse> {
    
    /**
     * Get warehouse by ID.
     * 
     * @param id Warehouse ID
     * @return Optional warehouse if found
     */
    default Optional<Warehouse> getWarehouseById(UUID id) {
        return Optional.ofNullable(getById(id));
    }
}


package com.care.warehouse.domain.ports.in;

import com.care.warehouse.domain.model.Material;
import com.sharedlib.core.domain.ports.in.GetByIdUseCase;

import java.util.Optional;
import java.util.UUID;

/**
 * Use case interface for loading a material by ID.
 */
public interface GetMaterialByIdUseCase extends GetByIdUseCase<UUID, Material> {
    
    /**
     * Get material by ID.
     * 
     * @param id Material ID
     * @return Optional material if found
     */
    default Optional<Material> getMaterialById(UUID id) {
        return Optional.ofNullable(getById(id));
    }
}


package com.care.warehouse.domain.ports.in;

import com.care.warehouse.domain.model.Brand;
import com.sharedlib.core.domain.ports.in.GetByIdUseCase;

import java.util.Optional;
import java.util.UUID;

/**
 * Use case interface for loading a brand by ID.
 */
public interface GetBrandByIdUseCase extends GetByIdUseCase<UUID, Brand> {
    
    /**
     * Get brand by ID.
     * 
     * @param id Brand ID
     * @return Optional brand if found
     */
    default Optional<Brand> getBrandById(UUID id) {
        return Optional.ofNullable(getById(id));
    }
}


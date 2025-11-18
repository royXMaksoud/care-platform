package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.brand.command.UpdateBrandCommand;
import com.care.warehouse.domain.model.Brand;
import com.sharedlib.core.domain.ports.in.UpdateUseCase;

import java.util.UUID;

/**
 * Use case interface for updating an existing brand.
 */
public interface UpdateBrandUseCase extends UpdateUseCase<UUID, UpdateBrandCommand, Brand> {
    
    /**
     * Update an existing brand.
     * 
     * @param command Update brand command
     * @return Updated brand
     */
    default Brand updateBrand(UpdateBrandCommand command) {
        return update(command.getId(), command);
    }
}


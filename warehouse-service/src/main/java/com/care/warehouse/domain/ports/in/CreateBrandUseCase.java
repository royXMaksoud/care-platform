package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.brand.command.CreateBrandCommand;
import com.care.warehouse.domain.model.Brand;
import com.sharedlib.core.domain.ports.in.CreateUseCase;

/**
 * Use case interface for creating a new brand.
 */
public interface CreateBrandUseCase extends CreateUseCase<CreateBrandCommand, Brand> {
    
    /**
     * Create a new brand.
     * 
     * @param command Create brand command
     * @return Created brand
     */
    default Brand createBrand(CreateBrandCommand command) {
        return create(command);
    }
}


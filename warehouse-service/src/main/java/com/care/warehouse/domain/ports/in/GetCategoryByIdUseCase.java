package com.care.warehouse.domain.ports.in;

import com.care.warehouse.domain.model.Category;
import com.sharedlib.core.domain.ports.in.GetByIdUseCase;

import java.util.Optional;
import java.util.UUID;

/**
 * Use case interface for loading a category by ID.
 */
public interface GetCategoryByIdUseCase extends GetByIdUseCase<UUID, Category> {
    
    /**
     * Get category by ID.
     * 
     * @param id Category ID
     * @return Optional category if found
     */
    default Optional<Category> getCategoryById(UUID id) {
        return Optional.ofNullable(getById(id));
    }
}


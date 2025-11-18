package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.category.command.UpdateCategoryCommand;
import com.care.warehouse.domain.model.Category;
import com.sharedlib.core.domain.ports.in.UpdateUseCase;

import java.util.UUID;

/**
 * Use case interface for updating an existing category.
 */
public interface UpdateCategoryUseCase extends UpdateUseCase<UUID, UpdateCategoryCommand, Category> {
    
    /**
     * Update an existing category.
     * 
     * @param command Update category command
     * @return Updated category
     */
    default Category updateCategory(UpdateCategoryCommand command) {
        return update(command.getId(), command);
    }
}


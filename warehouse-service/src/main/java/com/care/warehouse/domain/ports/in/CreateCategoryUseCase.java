package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.category.command.CreateCategoryCommand;
import com.care.warehouse.domain.model.Category;
import com.sharedlib.core.domain.ports.in.CreateUseCase;

/**
 * Use case interface for creating a new category.
 */
public interface CreateCategoryUseCase extends CreateUseCase<CreateCategoryCommand, Category> {
    
    /**
     * Create a new category.
     * 
     * @param command Create category command
     * @return Created category
     */
    default Category createCategory(CreateCategoryCommand command) {
        return create(command);
    }
}


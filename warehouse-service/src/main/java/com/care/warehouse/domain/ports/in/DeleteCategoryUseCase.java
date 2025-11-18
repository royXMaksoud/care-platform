package com.care.warehouse.domain.ports.in;

import java.util.UUID;

/**
 * Use case interface for deleting a category (soft delete).
 * 
 * This use case performs a soft delete by setting isDeleted = true.
 * The category will not be returned in search results but data is preserved.
 * 
 * Note: Deleting a category with children will also soft-delete all descendants.
 */
public interface DeleteCategoryUseCase {
    
    /**
     * Delete a category by ID (soft delete).
     * 
     * Validates:
     * - Category exists
     * - Category belongs to current tenant
     * - No materials reference this category
     * 
     * If category has children, they will also be soft-deleted (cascade).
     * 
     * @param id Category ID to delete
     * @throws com.sharedlib.core.exception.NotFoundException if category not found
     * @throws com.sharedlib.core.exception.ValidationException if category has dependencies
     */
    void deleteCategory(UUID id);
}


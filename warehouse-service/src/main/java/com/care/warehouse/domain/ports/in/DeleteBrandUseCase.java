package com.care.warehouse.domain.ports.in;

import java.util.UUID;

/**
 * Use case interface for deleting a brand (soft delete).
 * 
 * This use case performs a soft delete by setting isDeleted = true.
 * The brand will not be returned in search results but data is preserved.
 */
public interface DeleteBrandUseCase {
    
    /**
     * Delete a brand by ID (soft delete).
     * 
     * Validates:
     * - Brand exists
     * - Brand belongs to current tenant
     * - No materials reference this brand
     * 
     * @param id Brand ID to delete
     * @throws com.sharedlib.core.exception.NotFoundException if brand not found
     * @throws com.sharedlib.core.exception.ValidationException if brand has dependencies
     */
    void deleteBrand(UUID id);
}


package com.care.warehouse.domain.ports.in;

import java.util.UUID;

/**
 * Use case interface for deleting a material (soft delete).
 * 
 * This use case performs a soft delete by setting isDeleted = true.
 * The material will not be returned in search results but data is preserved.
 */
public interface DeleteMaterialUseCase {
    
    /**
     * Delete a material by ID (soft delete).
     * 
     * Validates:
     * - Material exists
     * - Material belongs to current tenant
     * - No active dependencies (e.g., stock items, orders)
     * 
     * @param id Material ID to delete
     * @throws com.sharedlib.core.exception.NotFoundException if material not found
     * @throws com.sharedlib.core.exception.ValidationException if material has dependencies
     */
    void deleteMaterial(UUID id);
}


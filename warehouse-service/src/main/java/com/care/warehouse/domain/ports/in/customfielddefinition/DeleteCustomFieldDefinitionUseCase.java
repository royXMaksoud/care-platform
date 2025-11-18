package com.care.warehouse.domain.ports.in.customfielddefinition;

import com.sharedlib.core.domain.ports.in.DeleteUseCase;

import java.util.UUID;

/**
 * Use case interface for deleting a custom field definition.
 */
public interface DeleteCustomFieldDefinitionUseCase extends DeleteUseCase<UUID> {
    // Inherits delete(UUID id) method from DeleteUseCase
}


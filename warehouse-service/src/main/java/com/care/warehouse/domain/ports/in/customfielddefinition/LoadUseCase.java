package com.care.warehouse.domain.ports.in.customfielddefinition;

import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.sharedlib.core.domain.ports.in.GetByIdUseCase;

import java.util.Optional;
import java.util.UUID;

/**
 * Use case interface for loading a custom field definition by ID.
 */
public interface LoadUseCase extends GetByIdUseCase<UUID, CustomFieldDefinition> {
    
    /**
     * Get custom field definition by ID.
     * 
     * @param id Custom field definition ID
     * @return Optional custom field definition if found
     */
    default Optional<CustomFieldDefinition> getCustomFieldDefinitionById(UUID id) {
        return Optional.ofNullable(getById(id));
    }
}


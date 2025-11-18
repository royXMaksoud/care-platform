package com.care.warehouse.domain.ports.in.customfielddefinition;

import com.care.warehouse.application.customfielddefinition.command.UpdateCustomFieldDefinitionCommand;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.sharedlib.core.domain.ports.in.UpdateUseCase;

import java.util.UUID;

/**
 * Use case interface for updating an existing custom field definition.
 */
public interface UpdateCustomFieldDefinitionUseCase extends UpdateUseCase<UUID, UpdateCustomFieldDefinitionCommand, CustomFieldDefinition> {
    
    /**
     * Update an existing custom field definition.
     * 
     * @param command Update custom field definition command
     * @return Updated custom field definition
     */
    default CustomFieldDefinition update(UpdateCustomFieldDefinitionCommand command) {
        return update(command.getId(), command);
    }
}


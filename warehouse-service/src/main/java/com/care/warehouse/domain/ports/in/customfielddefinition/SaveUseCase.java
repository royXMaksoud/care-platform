package com.care.warehouse.domain.ports.in.customfielddefinition;

import com.care.warehouse.application.customfielddefinition.command.CreateCustomFieldDefinitionCommand;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.sharedlib.core.domain.ports.in.CreateUseCase;

import java.util.UUID;

/**
 * Use case interface for creating a new custom field definition.
 */
public interface SaveUseCase extends CreateUseCase<CreateCustomFieldDefinitionCommand, CustomFieldDefinition> {
    
    /**
     * Create a new custom field definition.
     * 
     * @param command Create custom field definition command
     * @return Created custom field definition
     */
    default CustomFieldDefinition save(CreateCustomFieldDefinitionCommand command) {
        return create(command);
    }
}


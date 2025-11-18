package com.care.warehouse.application.customfielddefinition.command;

import com.care.warehouse.domain.enums.CustomFieldType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * Command object used to update an existing CustomFieldDefinition.
 * This belongs to the application layer (Command side) in Clean Architecture.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCustomFieldDefinitionCommand {
    
    /** The unique identifier of the custom field definition to be updated */
    private UUID id;
    
    private Map<String, String> labelTranslations;
    private CustomFieldType fieldType;
    private Boolean isRequired;
    private Map<String, Object> validationRules;
    private Boolean isActive;
}


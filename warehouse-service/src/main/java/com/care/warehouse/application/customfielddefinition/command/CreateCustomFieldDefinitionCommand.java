package com.care.warehouse.application.customfielddefinition.command;

import com.care.warehouse.domain.enums.CustomFieldType;
import com.care.warehouse.domain.enums.EntityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Command object used to create a new CustomFieldDefinition.
 * This is part of the application layer (Command side) in Clean Architecture.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCustomFieldDefinitionCommand {
    
    private EntityType entityType;
    private String fieldKey;
    private Map<String, String> labelTranslations;
    private CustomFieldType fieldType;
    private Boolean isRequired;
    private Boolean isGlobal;
    private Map<String, Object> validationRules;
    private Boolean isActive;
}


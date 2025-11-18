package com.care.warehouse.web.dto.customfielddefinition;

import com.care.warehouse.domain.enums.CustomFieldType;
import com.care.warehouse.domain.enums.EntityType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

/**
 * Request DTO used to create a new CustomFieldDefinition.
 */
@Getter
@Setter
public class CreateCustomFieldDefinitionRequest {

    @NotNull(message = "{customFieldDefinition.entityType.required}")
    private EntityType entityType;

    @NotNull(message = "{customFieldDefinition.fieldKey.required}")
    @Size(max = 100, message = "{customFieldDefinition.fieldKey.max}")
    private String fieldKey;

    @NotNull(message = "{customFieldDefinition.labelTranslations.required}")
    @NotEmpty(message = "{customFieldDefinition.labelTranslations.notEmpty}")
    private Map<String, String> labelTranslations;

    @NotNull(message = "{customFieldDefinition.fieldType.required}")
    private CustomFieldType fieldType;

    private Boolean isRequired;

    private Boolean isGlobal;

    private Map<String, Object> validationRules;

    private Boolean isActive;
}


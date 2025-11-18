package com.care.warehouse.web.dto.customfielddefinition;

import com.care.warehouse.domain.enums.CustomFieldType;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

/**
 * Request DTO used to update an existing CustomFieldDefinition.
 */
@Getter
@Setter
public class UpdateCustomFieldDefinitionRequest {

    @NotEmpty(message = "{customFieldDefinition.labelTranslations.notEmpty}")
    private Map<String, String> labelTranslations;

    private CustomFieldType fieldType;

    private Boolean isRequired;

    private Map<String, Object> validationRules;

    private Boolean isActive;
}


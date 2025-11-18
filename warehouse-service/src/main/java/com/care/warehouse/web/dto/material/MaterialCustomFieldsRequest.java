package com.care.warehouse.web.dto.material;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

/**
 * Request DTO for saving Material custom fields.
 * 
 * Contains a map of fieldKey -> value pairs.
 * Values are validated against CustomFieldDefinition metadata.
 */
@Getter
@Setter
public class MaterialCustomFieldsRequest {

    /**
     * Map of custom field values.
     * Key: fieldKey (from CustomFieldDefinition)
     * Value: field value (type depends on field definition)
     * 
     * Example:
     * {
     *   "warranty_period": 24,
     *   "manufacturing_date": "2024-01-15",
     *   "color": "red"
     * }
     */
    @NotEmpty(message = "{material.customFields.notEmpty}")
    private Map<String, Object> customFields;
}


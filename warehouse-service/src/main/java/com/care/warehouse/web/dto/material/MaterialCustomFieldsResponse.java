package com.care.warehouse.web.dto.material;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

/**
 * Response DTO for Material custom fields.
 * 
 * Contains a map of fieldKey -> value pairs.
 */
@Getter
@Builder
public class MaterialCustomFieldsResponse {

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
    private Map<String, Object> customFields;
}


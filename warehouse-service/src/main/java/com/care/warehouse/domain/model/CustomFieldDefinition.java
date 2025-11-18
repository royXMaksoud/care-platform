package com.care.warehouse.domain.model;

import com.care.warehouse.domain.enums.CustomFieldDataType;
import com.care.warehouse.domain.enums.CustomFieldType;
import com.care.warehouse.domain.enums.EntityType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Domain model for CustomFieldDefinition aggregate.
 * 
 * This represents metadata definitions for custom fields that can be attached
 * to different entity types (MATERIAL, WAREHOUSE, ORDER, etc.).
 * 
 * **Purpose**:
 * - Define the schema/structure for custom fields per entity type
 * - Support multilingual labels for UI display
 * - Define validation rules (data type, required, min/max, allowed values)
 * - Enable dynamic form generation in UI
 * 
 * **Key Features**:
 * - Multi-tenant support (tenantId)
 * - Entity-type specific (each entity type has its own field definitions)
 * - Multilingual labels (JSONB)
 * - Flexible data types (TEXT, NUMBER, DATE, DROPDOWN, etc.)
 * - Validation rules (min/max, allowed values, required flag)
 * - Sort order for UI display
 * 
 * **Usage**:
 * When a user creates/updates a Material, Warehouse, Order, etc., the system:
 * 1. Fetches CustomFieldDefinitions for that entity type
 * 2. Validates the provided custom field values against these definitions
 * 3. Stores validated values in CustomFieldValue table
 * 
 * @author CARE Team
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomFieldDefinition {
    
    /** Unique identifier for the field definition */
    private UUID id;
    
    /** Tenant ID for multi-tenant isolation */
    private UUID tenantId;
    
    /**
     * Entity type this field applies to.
     * Examples: MATERIAL, WAREHOUSE, ORDER, CUSTOMER
     * Each entity type can have its own set of custom field definitions.
     */
    private EntityType entityType;
    
    /**
     * Unique key for the field within entity type and tenant.
     * Used to identify the field in CustomFieldValue records.
     * Example: "warranty_period", "manufacturing_date", "supplier_code"
     * 
     * Must be unique per (tenantId, entityType).
     */
    private String fieldKey;
    
    /**
     * Multilingual field labels for UI display.
     * Structure: {"en": "Warranty Period", "ar": "فترة الضمان", "fr": "Période de garantie"}
     * 
     * Used by UI to display field labels in user's preferred language.
     */
    private Map<String, String> labelTranslations;
    
    /**
     * Data type of the field value.
     * Determines validation rules and UI input type.
     * Examples: TEXT, NUMBER, DATE, DROPDOWN_SINGLE, BOOLEAN
     */
    private CustomFieldDataType dataType;
    
    /**
     * Whether this field is required.
     * If true, entity records must have a value for this field.
     */
    private Boolean isRequired;
    
    /**
     * Allowed values for DROPDOWN_SINGLE and DROPDOWN_MULTI fields.
     * 
     * Structure for dropdown options:
     * [
     *   {"key": "option1", "translations": {"en": "Option 1", "ar": "خيار 1"}},
     *   {"key": "option2", "translations": {"en": "Option 2", "ar": "خيار 2"}}
     * ]
     * 
     * For other data types, this is null.
     */
    private List<Map<String, Object>> allowedValues;
    
    /**
     * Minimum value for NUMBER and DECIMAL fields.
     * For TEXT fields, this represents min_length.
     * For DATE/DATETIME, this represents min_date.
     */
    private BigDecimal minValue;
    
    /**
     * Maximum value for NUMBER and DECIMAL fields.
     * For TEXT fields, this represents max_length.
     * For DATE/DATETIME, this represents max_date.
     */
    private BigDecimal maxValue;
    
    /**
     * Sort order for UI display.
     * Lower numbers appear first in forms and lists.
     * Default: 0
     */
    private Integer sortOrder;
    
    /**
     * Whether this field definition is active.
     * Inactive fields are not shown in UI and cannot accept new values.
     */
    private Boolean isActive;
    
    /** Active/Deleted flags */
    @Builder.Default
    private Boolean isDeleted = Boolean.FALSE;
    
    /** Audit fields */
    private UUID createdById;
    private Instant createdAt;
    
    private UUID updatedById;
    private Instant updatedAt;
    
    /** Optimistic locking */
    private Long rowVersion;
    
    /**
     * Whether this field definition is global (applies to all tenants).
     * If false, it's tenant-specific.
     */
    @Builder.Default
    private Boolean isGlobal = Boolean.FALSE;
    
    /**
     * Get the field type (CustomFieldType) from data type (CustomFieldDataType).
     * Maps the data type enum to the field type enum for compatibility.
     */
    public CustomFieldType getFieldType() {
        if (dataType == null) {
            return null;
        }
        return switch (dataType) {
            case STRING -> CustomFieldType.TEXT;
            case NUMBER -> CustomFieldType.NUMBER;
            case BOOLEAN -> CustomFieldType.BOOLEAN;
            case DATE -> CustomFieldType.DATE;
            case DATETIME -> CustomFieldType.DATE;
            case ENUM -> CustomFieldType.DROPDOWN_SINGLE;
            case LIST -> CustomFieldType.DROPDOWN_MULTI;
            case MEDIA -> CustomFieldType.MEDIA;
            case JSON -> CustomFieldType.TEXT; // Default to TEXT for JSON
        };
    }
    
    /**
     * Get validation rules as a map for compatibility with existing code.
     * Builds a map from existing validation fields.
     */
    public Map<String, Object> getValidationRules() {
        Map<String, Object> rules = new HashMap<>();
        if (minValue != null) {
            rules.put("minValue", minValue);
        }
        if (maxValue != null) {
            rules.put("maxValue", maxValue);
        }
        if (isRequired != null) {
            rules.put("isRequired", isRequired);
        }
        if (allowedValues != null && !allowedValues.isEmpty()) {
            rules.put("allowedValues", allowedValues);
        }
        return rules;
    }
    
    /**
     * Check if a value is valid for this field definition.
     * 
     * This method validates a value against the field's data type and rules:
     * - Checks data type compatibility
     * - Validates required field
     * - Validates min/max constraints
     * - Validates allowed values for dropdowns
     * 
     * @param value The value to validate (can be String, Number, Boolean, List, etc.)
     * @return true if value is valid, false otherwise
     */
    public boolean isValidValue(Object value) {
        // If field is required and value is null/empty, it's invalid
        if (Boolean.TRUE.equals(isRequired) && (value == null || 
                (value instanceof String && ((String) value).isBlank()))) {
            return false;
        }
        
        // If value is null and field is not required, it's valid
        if (value == null) {
            return true;
        }
        
        // Validate based on data type
        return switch (dataType) {
            case STRING -> validateTextValue(value);
            case NUMBER -> validateNumberValue(value);
            case DATE, DATETIME -> validateDateValue(value);
            case BOOLEAN -> value instanceof Boolean;
            case ENUM -> validateDropdownSingleValue(value);
            case LIST -> validateDropdownMultiValue(value);
            case MEDIA -> value instanceof String; // File reference
            case JSON -> true; // JSON is always valid (can add schema validation later)
        };
    }
    
    /**
     * Validate text value against min/max length constraints.
     */
    private boolean validateTextValue(Object value) {
        if (!(value instanceof String)) {
            return false;
        }
        String str = (String) value;
        if (minValue != null && str.length() < minValue.intValue()) {
            return false;
        }
        if (maxValue != null && str.length() > maxValue.intValue()) {
            return false;
        }
        return true;
    }
    
    /**
     * Validate number value against min/max constraints.
     */
    private boolean validateNumberValue(Object value) {
        if (!(value instanceof Number)) {
            return false;
        }
        double num = ((Number) value).doubleValue();
        if (minValue != null && num < minValue.doubleValue()) {
            return false;
        }
        if (maxValue != null && num > maxValue.doubleValue()) {
            return false;
        }
        return true;
    }
    
    /**
     * Validate decimal value against min/max constraints.
     */
    private boolean validateDecimalValue(Object value) {
        return validateNumberValue(value); // Same logic as NUMBER
    }
    
    /**
     * Validate date/datetime value.
     */
    private boolean validateDateValue(Object value) {
        // Basic check - can be enhanced with actual date parsing
        return value instanceof String;
    }
    
    /**
     * Validate single dropdown value against allowed values.
     */
    private boolean validateDropdownSingleValue(Object value) {
        if (allowedValues == null || allowedValues.isEmpty()) {
            return false; // No options defined
        }
        String valueKey = value.toString();
        return allowedValues.stream()
                .anyMatch(option -> valueKey.equals(option.get("key")));
    }
    
    /**
     * Validate multiple dropdown values against allowed values.
     */
    @SuppressWarnings("unchecked")
    private boolean validateDropdownMultiValue(Object value) {
        if (!(value instanceof List)) {
            return false;
        }
        List<String> values = (List<String>) value;
        if (allowedValues == null || allowedValues.isEmpty()) {
            return false;
        }
        return values.stream()
                .allMatch(val -> allowedValues.stream()
                        .anyMatch(option -> val.equals(option.get("key"))));
    }
}

package com.care.warehouse.domain.model;

import com.care.warehouse.domain.enums.EntityType;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain model for CustomFieldValue aggregate.
 * 
 * This represents an actual value for a custom field on a specific entity record.
 * 
 * **Purpose**:
 * - Store dynamic field values for any entity (Material, Warehouse, Order, etc.)
 * - Link to CustomFieldDefinition for validation and metadata
 * - Support multi-tenant isolation
 * - Enable flexible schema without database migrations
 * 
 * **Key Features**:
 * - Multi-tenant support (tenantId)
 * - Entity-type and record reference (entityType, entityRecordId)
 * - Field definition reference (fieldId -> CustomFieldDefinition)
 * - Flexible value storage (JSONB to support any data type)
 * - Unique constraint: (tenantId, entityType, entityRecordId, fieldId)
 * 
 * **Value Storage**:
 * The `value` field is stored as JSONB to support different data types:
 * - TEXT: "string value"
 * - NUMBER: 123
 * - DECIMAL: 123.45
 * - DATE: "2024-01-15"
 * - DATETIME: "2024-01-15T10:30:00Z"
 * - BOOLEAN: true
 * - DROPDOWN_SINGLE: "option_key"
 * - DROPDOWN_MULTI: ["option1", "option2"]
 * - FILE: "file://path/to/file" or UUID
 * - JSON: {"key": "value", "nested": {...}}
 * 
 * **Usage Example**:
 * - Material with ID "mat-123" has custom field "warranty_period" (fieldId: "field-456")
 * - CustomFieldValue: {entityType: MATERIAL, entityRecordId: "mat-123", fieldId: "field-456", value: 24}
 * 
 * @author CARE Team
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomFieldValue {
    
    /** Unique identifier for the custom field value */
    private UUID id;
    
    /** Tenant ID for multi-tenant isolation */
    private UUID tenantId;
    
    /**
     * Entity type this value belongs to.
     * Examples: MATERIAL, WAREHOUSE, ORDER, CUSTOMER
     */
    private EntityType entityType;
    
    /**
     * ID of the entity record this value belongs to.
     * Example: If entityType is MATERIAL, this is the Material's ID.
     */
    private UUID entityRecordId;
    
    /**
     * Reference to CustomFieldDefinition.
     * Links this value to its metadata definition.
     */
    private UUID fieldId;
    
    /**
     * The actual field value stored as JSONB.
     * 
     * The structure depends on the field's dataType:
     * - TEXT: String
     * - NUMBER: Number (Integer or Long)
     * - DECIMAL: Number (Double or BigDecimal)
     * - DATE: String (ISO date format)
     * - DATETIME: String (ISO datetime format)
     * - BOOLEAN: Boolean
     * - DROPDOWN_SINGLE: String (option key)
     * - DROPDOWN_MULTI: List<String> (option keys)
     * - FILE: String (file reference)
     * - JSON: Map<String, Object> or any JSON structure
     * 
     * Stored as JSONB for flexibility and efficient querying.
     */
    private Object value;
    
    /** Audit fields */
    private UUID createdById;
    private Instant createdAt;
    
    private UUID updatedById;
    private Instant updatedAt;
    
    /** Optimistic locking */
    private Long rowVersion;
    
    /**
     * Get value as String (for TEXT fields).
     * 
     * @return String representation of value, or null if value is null
     */
    public String getValueAsString() {
        return value != null ? value.toString() : null;
    }
    
    /**
     * Get value as Number (for NUMBER/DECIMAL fields).
     * 
     * @return Number value, or null if value is null or not a number
     */
    public Number getValueAsNumber() {
        if (value instanceof Number) {
            return (Number) value;
        }
        return null;
    }
    
    /**
     * Get value as Boolean (for BOOLEAN fields).
     * 
     * @return Boolean value, or null if value is null or not a boolean
     */
    public Boolean getValueAsBoolean() {
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return null;
    }
}


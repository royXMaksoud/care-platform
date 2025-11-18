package com.care.warehouse.application.customfield.service;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.enums.EntityType;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.care.warehouse.domain.model.CustomFieldValue;
import com.care.warehouse.domain.ports.out.customfield.CustomFieldDefinitionPort;
import com.care.warehouse.domain.ports.out.customfield.CustomFieldValuePort;
import com.sharedlib.core.dto.ErrorResponse;
import com.sharedlib.core.exception.ValidationException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Generic CustomFieldService for managing custom fields across all entity types.
 * 
 * **Purpose**:
 * This service provides a unified, reusable interface for managing custom fields
 * for any entity type (Material, Warehouse, Order, etc.). It handles:
 * - Validation of custom field values against metadata definitions
 * - Reading custom field values for entity records
 * - Writing custom field values for entity records
 * - Bulk operations (save/update multiple fields at once)
 * 
 * **Key Features**:
 * - Multi-tenant isolation (automatic via TenantContext)
 * - Entity-type agnostic (works with any EntityType)
 * - Comprehensive validation (data type, required, min/max, allowed values)
 * - Transactional operations
 * - Multilingual support (labels and dropdown options)
 * 
 * **Usage Example**:
 * ```java
 * // Save custom fields for a Material
 * Map<String, Object> values = Map.of(
 *     "warranty_period", 24,
 *     "manufacturing_date", "2024-01-15"
 * );
 * customFieldService.saveValues(EntityType.MATERIAL, materialId, values);
 * 
 * // Read custom fields for a Material
 * Map<String, Object> values = customFieldService.getValues(EntityType.MATERIAL, materialId);
 * ```
 * 
 * **Integration Points**:
 * This service is called from:
 * - MaterialService (when saving/updating materials)
 * - WarehouseService (when saving/updating warehouses)
 * - OrderService (when saving/updating orders)
 * - Any other service that needs custom fields
 * 
 * @author CARE Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomFieldService {

    private final CustomFieldDefinitionPort definitionPort;
    private final CustomFieldValuePort valuePort;
    private final MessageResolver messageResolver;

    /**
     * Validate custom field values against field definitions.
     * 
     * This method:
     * 1. Fetches all active field definitions for the entity type
     * 2. Validates each provided value against its definition
     * 3. Checks required fields are present
     * 4. Validates data types, min/max constraints, allowed values
     * 
     * **Validation Rules**:
     * - Required fields must have non-null, non-empty values
     * - Data types must match (TEXT -> String, NUMBER -> Number, etc.)
     * - Min/max constraints are enforced
     * - Dropdown values must be in allowed_values
     * 
     * @param entityType Entity type (MATERIAL, WAREHOUSE, etc.)
     * @param values Map of fieldKey -> value to validate
     * @throws ValidationException if validation fails with detailed error messages
     */
    @Transactional(readOnly = true)
    public void validateValues(EntityType entityType, Map<String, Object> values) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new ValidationException("error.tenant.required", List.of(
                    ErrorResponse.ValidationError.builder()
                            .field("tenantId")
                            .code("error.tenant.required")
                            .message(messageResolver.getMessage("error.tenant.required"))
                            .build()
            ));
        }

        // Get all active field definitions for this entity type
        List<CustomFieldDefinition> definitions = definitionPort.findActiveByTenantIdAndEntityType(tenantId, entityType);
        
        // Create a map of fieldKey -> definition for quick lookup
        Map<String, CustomFieldDefinition> definitionMap = definitions.stream()
                .collect(Collectors.toMap(CustomFieldDefinition::getFieldKey, def -> def));
        
        List<ErrorResponse.ValidationError> errors = new ArrayList<>();
        
        // Check required fields
        for (CustomFieldDefinition definition : definitions) {
            if (Boolean.TRUE.equals(definition.getIsRequired())) {
                String fieldKey = definition.getFieldKey();
                Object value = values.get(fieldKey);
                
                if (value == null || (value instanceof String && ((String) value).isBlank())) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("customFields." + fieldKey)
                            .code("error.customField.required")
                            .message(messageResolver.getMessage("error.customField.required", 
                                    new Object[]{fieldKey}))
                            .build());
                }
            }
        }
        
        // Validate provided values
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            String fieldKey = entry.getKey();
            Object value = entry.getValue();
            
            CustomFieldDefinition definition = definitionMap.get(fieldKey);
            if (definition == null) {
                // Unknown field - log warning but don't fail (allows for future fields)
                log.warn("Unknown custom field '{}' for entity type '{}' in tenant '{}'", 
                        fieldKey, entityType, tenantId);
                continue;
            }
            
            // Validate value against definition
            if (!definition.isValidValue(value)) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("customFields." + fieldKey)
                        .code("error.customField.invalid")
                        .message(messageResolver.getMessage("error.customField.invalid", 
                                new Object[]{fieldKey, definition.getDataType()}))
                        .build());
            }
        }
        
        if (!errors.isEmpty()) {
            throw new ValidationException("error.customField.validation", errors);
        }
    }

    /**
     * Get all custom field values for an entity record.
     * 
     * Returns a map of fieldKey -> value for easy access.
     * 
     * **Usage**:
     * ```java
     * Map<String, Object> values = customFieldService.getValues(EntityType.MATERIAL, materialId);
     * Integer warrantyPeriod = (Integer) values.get("warranty_period");
     * ```
     * 
     * @param entityType Entity type
     * @param entityRecordId Entity record ID
     * @return Map of fieldKey -> value, empty map if no values found
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getValues(EntityType entityType, UUID entityRecordId) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return Collections.emptyMap();
        }
        
        // Get all values for this entity record
        List<CustomFieldValue> values = valuePort.findByTenantIdAndEntityTypeAndEntityRecordId(
                tenantId, entityType, entityRecordId);
        
        if (values.isEmpty()) {
            return Collections.emptyMap();
        }
        
        // Get all field definitions to map fieldId -> fieldKey
        List<CustomFieldDefinition> definitions = definitionPort.findActiveByTenantIdAndEntityType(
                tenantId, entityType);
        Map<UUID, String> fieldIdToKeyMap = definitions.stream()
                .collect(Collectors.toMap(CustomFieldDefinition::getId, CustomFieldDefinition::getFieldKey));
        
        // Build result map: fieldKey -> value
        Map<String, Object> result = new HashMap<>();
        for (CustomFieldValue value : values) {
            String fieldKey = fieldIdToKeyMap.get(value.getFieldId());
            if (fieldKey != null) {
                result.put(fieldKey, value.getValue());
            }
        }
        
        return result;
    }

    /**
     * Save or update custom field values for an entity record.
     * 
     * This method:
     * 1. Validates all values against field definitions
     * 2. Saves new values or updates existing ones
     * 3. Deletes values that are not in the provided map
     * 
     * **Transaction**:
     * This method is transactional. If validation fails, no values are saved.
     * 
     * **Usage**:
     * ```java
     * Map<String, Object> values = Map.of(
     *     "warranty_period", 24,
     *     "manufacturing_date", "2024-01-15"
     * );
     * customFieldService.saveValues(EntityType.MATERIAL, materialId, values);
     * ```
     * 
     * @param entityType Entity type
     * @param entityRecordId Entity record ID
     * @param values Map of fieldKey -> value to save
     * @return Map of fieldKey -> saved value
     */
    @Transactional
    public Map<String, Object> saveValues(EntityType entityType, UUID entityRecordId, Map<String, Object> values) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new ValidationException("error.tenant.required", List.of(
                    ErrorResponse.ValidationError.builder()
                            .field("tenantId")
                            .code("error.tenant.required")
                            .message(messageResolver.getMessage("error.tenant.required"))
                            .build()
            ));
        }
        
        // Validate values first
        validateValues(entityType, values);
        
        // Save or update values
        List<CustomFieldValue> savedValues = valuePort.saveOrUpdateValues(
                tenantId, entityType, entityRecordId, values);
        
        // Get field definitions to map fieldId -> fieldKey
        List<CustomFieldDefinition> definitions = definitionPort.findActiveByTenantIdAndEntityType(
                tenantId, entityType);
        Map<UUID, String> fieldIdToKeyMap = definitions.stream()
                .collect(Collectors.toMap(CustomFieldDefinition::getId, CustomFieldDefinition::getFieldKey));
        
        // Build result map: fieldKey -> value
        Map<String, Object> result = new HashMap<>();
        for (CustomFieldValue savedValue : savedValues) {
            String fieldKey = fieldIdToKeyMap.get(savedValue.getFieldId());
            if (fieldKey != null) {
                result.put(fieldKey, savedValue.getValue());
            }
        }
        
        log.debug("Saved {} custom field values for entity type '{}', record '{}'", 
                savedValues.size(), entityType, entityRecordId);
        
        return result;
    }

    /**
     * Delete all custom field values for an entity record.
     * 
     * Used when deleting an entity (Material, Warehouse, etc.).
     * 
     * @param entityType Entity type
     * @param entityRecordId Entity record ID
     */
    @Transactional
    public void deleteValues(EntityType entityType, UUID entityRecordId) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return;
        }
        
        valuePort.deleteByTenantIdAndEntityTypeAndEntityRecordId(tenantId, entityType, entityRecordId);
        
        log.debug("Deleted custom field values for entity type '{}', record '{}'", 
                entityType, entityRecordId);
    }

    /**
     * Get all field definitions for an entity type.
     * 
     * Used by UI to generate dynamic forms.
     * 
     * @param entityType Entity type
     * @return List of active field definitions, ordered by sortOrder
     */
    @Transactional(readOnly = true)
    public List<CustomFieldDefinition> getFieldDefinitions(EntityType entityType) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return Collections.emptyList();
        }
        
        return definitionPort.findActiveByTenantIdAndEntityType(tenantId, entityType);
    }
}


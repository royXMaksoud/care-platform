package com.care.warehouse.application.warehouse.validation;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.enums.CustomFieldType;
import com.care.warehouse.domain.enums.EntityType;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.care.warehouse.domain.ports.out.customfielddefinition.CustomFieldDefinitionCrudPort;
import com.sharedlib.core.dto.ErrorResponse;
import com.sharedlib.core.exception.ValidationException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Validator for custom fields (customData JSONB).
 * 
 * Validates custom fields against metadata definitions from CustomFieldDefinition.
 * This validator is shared between Warehouse and Material entities.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CustomFieldsValidator {

    private final MessageResolver messageResolver;
    private final CustomFieldDefinitionCrudPort customFieldDefinitionCrudPort;

    /**
     * Validates custom fields against predefined metadata definitions.
     * 
     * @param customData The map of custom fields to validate
     * @param entityType The entity type (MATERIAL, WAREHOUSE, etc.)
     */
    public void validate(Map<String, Object> customData, EntityType entityType) {
        if (customData == null || customData.isEmpty()) {
            // If no custom data, check if any required fields are missing
            validateRequiredFieldsMissing(entityType);
            return;
        }

        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            log.warn("No tenant context available for custom fields validation");
            return;
        }

        // Fetch all custom field definitions for this entity type
        List<CustomFieldDefinition> definitions = customFieldDefinitionCrudPort.findByTenantIdAndEntityType(tenantId, entityType);
        
        // Also include global definitions
        List<CustomFieldDefinition> globalDefinitions = customFieldDefinitionCrudPort.findGlobalByEntityType(entityType);
        
        // Combine tenant-specific and global definitions
        List<CustomFieldDefinition> allDefinitions = new ArrayList<>(definitions);
        allDefinitions.addAll(globalDefinitions);
        
        // Create a map for quick lookup
        Map<String, CustomFieldDefinition> definitionMap = allDefinitions.stream()
                .collect(Collectors.toMap(CustomFieldDefinition::getFieldKey, d -> d, (d1, d2) -> d1));

        List<ErrorResponse.ValidationError> errors = new ArrayList<>();

        // Validate each custom field against its definition
        for (Map.Entry<String, Object> entry : customData.entrySet()) {
            String fieldKey = entry.getKey();
            Object fieldValue = entry.getValue();

            CustomFieldDefinition definition = definitionMap.get(fieldKey);
            if (definition == null) {
                // Field not defined in metadata - allow it but log warning
                log.warn("Custom field '{}' is not defined in metadata for entity type {}", fieldKey, entityType);
                continue;
            }

            // Validate field value based on definition
            validateFieldValue(fieldKey, fieldValue, definition, errors);
        }

        // Check for missing required fields
        for (CustomFieldDefinition definition : allDefinitions) {
            if (Boolean.TRUE.equals(definition.getIsRequired()) && 
                !customData.containsKey(definition.getFieldKey())) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("customData." + definition.getFieldKey())
                        .code("error.customField.required")
                        .message(messageResolver.getMessage("error.customField.required", new Object[]{definition.getFieldKey()}))
                        .build());
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation.customFields", errors);
        }
        log.debug("Custom fields validated successfully for entity type {}", entityType);
    }

    /**
     * Validate a single field value against its definition.
     */
    private void validateFieldValue(String fieldKey, Object fieldValue, CustomFieldDefinition definition, 
                                     List<ErrorResponse.ValidationError> errors) {
        // Check required
        if (Boolean.TRUE.equals(definition.getIsRequired()) && fieldValue == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("customData." + fieldKey)
                    .code("error.customField.required")
                    .message(messageResolver.getMessage("error.customField.required", new Object[]{fieldKey}))
                    .build());
            return;
        }

        if (fieldValue == null) {
            return; // Optional field with null value is OK
        }

        // Validate based on field type
        CustomFieldType fieldType = definition.getFieldType();
        Map<String, Object> validationRules = definition.getValidationRules();

        switch (fieldType) {
            case TEXT:
                validateTextField(fieldKey, fieldValue, validationRules, errors);
                break;
            case NUMBER:
                validateNumberField(fieldKey, fieldValue, validationRules, errors);
                break;
            case DATE:
                validateDateField(fieldKey, fieldValue, validationRules, errors);
                break;
            case DROPDOWN_SINGLE:
            case DROPDOWN_MULTI:
                validateDropdownField(fieldKey, fieldValue, definition, errors);
                break;
            case BOOLEAN:
                validateBooleanField(fieldKey, fieldValue, errors);
                break;
            case MEDIA:
                // Media validation can be added later
                break;
        }
    }

    /**
     * Validate text field.
     */
    private void validateTextField(String fieldKey, Object fieldValue, Map<String, Object> validationRules,
                                   List<ErrorResponse.ValidationError> errors) {
        if (!(fieldValue instanceof String)) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("customData." + fieldKey)
                    .code("error.customField.type.mismatch")
                    .message(messageResolver.getMessage("error.customField.type.mismatch", new Object[]{fieldKey, "TEXT"}))
                    .build());
            return;
        }

        String value = (String) fieldValue;
        if (validationRules != null) {
            if (validationRules.containsKey("minLength")) {
                int minLength = ((Number) validationRules.get("minLength")).intValue();
                if (value.length() < minLength) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("customData." + fieldKey)
                            .code("error.customField.minLength")
                            .message(messageResolver.getMessage("error.customField.minLength", new Object[]{fieldKey, minLength}))
                            .build());
                }
            }
            if (validationRules.containsKey("maxLength")) {
                int maxLength = ((Number) validationRules.get("maxLength")).intValue();
                if (value.length() > maxLength) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("customData." + fieldKey)
                            .code("error.customField.maxLength")
                            .message(messageResolver.getMessage("error.customField.maxLength", new Object[]{fieldKey, maxLength}))
                            .build());
                }
            }
            if (validationRules.containsKey("pattern")) {
                String pattern = (String) validationRules.get("pattern");
                if (!value.matches(pattern)) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("customData." + fieldKey)
                            .code("error.customField.pattern")
                            .message(messageResolver.getMessage("error.customField.pattern", new Object[]{fieldKey}))
                            .build());
                }
            }
        }
    }

    /**
     * Validate number field.
     */
    private void validateNumberField(String fieldKey, Object fieldValue, Map<String, Object> validationRules,
                                     List<ErrorResponse.ValidationError> errors) {
        if (!(fieldValue instanceof Number)) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("customData." + fieldKey)
                    .code("error.customField.type.mismatch")
                    .message(messageResolver.getMessage("error.customField.type.mismatch", new Object[]{fieldKey, "NUMBER"}))
                    .build());
            return;
        }

        double value = ((Number) fieldValue).doubleValue();
        if (validationRules != null) {
            if (validationRules.containsKey("min")) {
                double min = ((Number) validationRules.get("min")).doubleValue();
                if (value < min) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("customData." + fieldKey)
                            .code("error.customField.min")
                            .message(messageResolver.getMessage("error.customField.min", new Object[]{fieldKey, min}))
                            .build());
                }
            }
            if (validationRules.containsKey("max")) {
                double max = ((Number) validationRules.get("max")).doubleValue();
                if (value > max) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("customData." + fieldKey)
                            .code("error.customField.max")
                            .message(messageResolver.getMessage("error.customField.max", new Object[]{fieldKey, max}))
                            .build());
                }
            }
        }
    }

    /**
     * Validate date field.
     */
    private void validateDateField(String fieldKey, Object fieldValue, Map<String, Object> validationRules,
                                    List<ErrorResponse.ValidationError> errors) {
        // Date validation can be enhanced later
        if (!(fieldValue instanceof String)) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("customData." + fieldKey)
                    .code("error.customField.type.mismatch")
                    .message(messageResolver.getMessage("error.customField.type.mismatch", new Object[]{fieldKey, "DATE"}))
                    .build());
        }
    }

    /**
     * Validate dropdown field.
     */
    private void validateDropdownField(String fieldKey, Object fieldValue, CustomFieldDefinition definition,
                                       List<ErrorResponse.ValidationError> errors) {
        // TODO: Fetch options from CustomFieldOption and validate
        // For now, just check if value is a string
        if (!(fieldValue instanceof String)) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("customData." + fieldKey)
                    .code("error.customField.type.mismatch")
                    .message(messageResolver.getMessage("error.customField.type.mismatch", new Object[]{fieldKey, "DROPDOWN"}))
                    .build());
        }
    }

    /**
     * Validate boolean field.
     */
    private void validateBooleanField(String fieldKey, Object fieldValue,
                                       List<ErrorResponse.ValidationError> errors) {
        if (!(fieldValue instanceof Boolean)) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("customData." + fieldKey)
                    .code("error.customField.type.mismatch")
                    .message(messageResolver.getMessage("error.customField.type.mismatch", new Object[]{fieldKey, "BOOLEAN"}))
                    .build());
        }
    }

    /**
     * Validate if required fields are missing.
     */
    private void validateRequiredFieldsMissing(EntityType entityType) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return;
        }

        List<CustomFieldDefinition> definitions = customFieldDefinitionCrudPort.findByTenantIdAndEntityType(tenantId, entityType);
        List<CustomFieldDefinition> globalDefinitions = customFieldDefinitionCrudPort.findGlobalByEntityType(entityType);
        
        List<CustomFieldDefinition> requiredFields = new ArrayList<>();
        requiredFields.addAll(definitions);
        requiredFields.addAll(globalDefinitions);
        
        requiredFields = requiredFields.stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsRequired()))
                .collect(Collectors.toList());

        if (!requiredFields.isEmpty()) {
            log.debug("Found {} required custom fields for entity type {}", requiredFields.size(), entityType);
            // Note: This is informational - actual validation happens in validate() method
        }
    }
}


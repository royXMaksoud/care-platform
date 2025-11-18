package com.care.warehouse.application.customfielddefinition.mapper;

import com.care.warehouse.application.customfielddefinition.command.CreateCustomFieldDefinitionCommand;
import com.care.warehouse.application.customfielddefinition.command.UpdateCustomFieldDefinitionCommand;
import com.care.warehouse.domain.enums.CustomFieldDataType;
import com.care.warehouse.domain.enums.CustomFieldType;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.sharedlib.core.application.mapper.BaseMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Mapper interface for converting between CustomFieldDefinition domain model and commands/queries.
 * Uses MapStruct for automatic mapping generation.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface CustomFieldDefinitionAppMapper extends BaseMapper<CustomFieldDefinition, CreateCustomFieldDefinitionCommand, UpdateCustomFieldDefinitionCommand, CustomFieldDefinition> {

    @Override
    default CustomFieldDefinition fromCreate(CreateCustomFieldDefinitionCommand cmd) {
        CustomFieldDefinition.CustomFieldDefinitionBuilder builder = CustomFieldDefinition.builder()
                .id(null) // New definition, no ID yet
                .entityType(cmd.getEntityType())
                .fieldKey(cmd.getFieldKey())
                .labelTranslations(cmd.getLabelTranslations())
                .dataType(mapFieldTypeToDataType(cmd.getFieldType()))
                .isRequired(cmd.getIsRequired() != null ? cmd.getIsRequired() : false)
                .isGlobal(cmd.getIsGlobal() != null ? cmd.getIsGlobal() : false)
                .isActive(cmd.getIsActive() != null ? cmd.getIsActive() : Boolean.TRUE)
                .isDeleted(Boolean.FALSE)
                .createdAt(Instant.now())
                .rowVersion(0L);
        
        // Extract validation rules and set individual fields
        if (cmd.getValidationRules() != null) {
            Map<String, Object> rules = cmd.getValidationRules();
            if (rules.containsKey("minValue") && rules.get("minValue") instanceof Number) {
                builder.minValue(BigDecimal.valueOf(((Number) rules.get("minValue")).doubleValue()));
            }
            if (rules.containsKey("maxValue") && rules.get("maxValue") instanceof Number) {
                builder.maxValue(BigDecimal.valueOf(((Number) rules.get("maxValue")).doubleValue()));
            }
            if (rules.containsKey("allowedValues")) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> allowedValues = (java.util.List<Map<String, Object>>) rules.get("allowedValues");
                builder.allowedValues(allowedValues);
            }
        }
        
        return builder.build();
    }
    
    /**
     * Map CustomFieldType to CustomFieldDataType.
     */
    default CustomFieldDataType mapFieldTypeToDataType(CustomFieldType fieldType) {
        if (fieldType == null) {
            return null;
        }
        return switch (fieldType) {
            case TEXT -> CustomFieldDataType.STRING;
            case NUMBER -> CustomFieldDataType.NUMBER;
            case BOOLEAN -> CustomFieldDataType.BOOLEAN;
            case DATE -> CustomFieldDataType.DATE;
            case DROPDOWN_SINGLE -> CustomFieldDataType.ENUM;
            case DROPDOWN_MULTI -> CustomFieldDataType.LIST;
            case MEDIA -> CustomFieldDataType.MEDIA;
        };
    }

    @Override
    default void updateDomain(@MappingTarget CustomFieldDefinition target, UpdateCustomFieldDefinitionCommand cmd) {
        if (cmd.getLabelTranslations() != null) target.setLabelTranslations(cmd.getLabelTranslations());
        if (cmd.getFieldType() != null) target.setDataType(mapFieldTypeToDataType(cmd.getFieldType()));
        if (cmd.getIsRequired() != null) target.setIsRequired(cmd.getIsRequired());
        if (cmd.getValidationRules() != null) {
            Map<String, Object> rules = cmd.getValidationRules();
            if (rules.containsKey("minValue") && rules.get("minValue") instanceof Number) {
                target.setMinValue(BigDecimal.valueOf(((Number) rules.get("minValue")).doubleValue()));
            }
            if (rules.containsKey("maxValue") && rules.get("maxValue") instanceof Number) {
                target.setMaxValue(BigDecimal.valueOf(((Number) rules.get("maxValue")).doubleValue()));
            }
            if (rules.containsKey("allowedValues")) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> allowedValues = (java.util.List<Map<String, Object>>) rules.get("allowedValues");
                target.setAllowedValues(allowedValues);
            }
        }
        if (cmd.getIsActive() != null) target.setIsActive(cmd.getIsActive());
    }

    @Override
    default CustomFieldDefinition toResponse(CustomFieldDefinition domain) {
        return domain; // Domain model is the response
    }
}


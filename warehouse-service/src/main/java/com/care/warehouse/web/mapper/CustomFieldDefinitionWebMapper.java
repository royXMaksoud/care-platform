package com.care.warehouse.web.mapper;

import com.care.warehouse.application.customfielddefinition.command.CreateCustomFieldDefinitionCommand;
import com.care.warehouse.application.customfielddefinition.command.UpdateCustomFieldDefinitionCommand;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.care.warehouse.web.dto.customfielddefinition.CreateCustomFieldDefinitionRequest;
import com.care.warehouse.web.dto.customfielddefinition.CustomFieldDefinitionResponse;
import com.care.warehouse.web.dto.customfielddefinition.UpdateCustomFieldDefinitionRequest;
import com.sharedlib.core.context.CurrentUserContext;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Mapper to convert between Web layer DTOs and Domain models/Commands related to CustomFieldDefinition.
 */
@Component
public class CustomFieldDefinitionWebMapper {

    /**
     * Converts CreateCustomFieldDefinitionRequest to CreateCustomFieldDefinitionCommand.
     */
    public CreateCustomFieldDefinitionCommand toCreateCommand(CreateCustomFieldDefinitionRequest request) {
        return CreateCustomFieldDefinitionCommand.builder()
                .entityType(request.getEntityType())
                .fieldKey(request.getFieldKey())
                .labelTranslations(request.getLabelTranslations())
                .fieldType(request.getFieldType())
                .isRequired(request.getIsRequired())
                .isGlobal(request.getIsGlobal())
                .validationRules(request.getValidationRules())
                .isActive(request.getIsActive())
                .build();
    }

    /**
     * Converts UpdateCustomFieldDefinitionRequest to UpdateCustomFieldDefinitionCommand.
     */
    public UpdateCustomFieldDefinitionCommand toUpdateCommand(java.util.UUID definitionId, UpdateCustomFieldDefinitionRequest request) {
        return UpdateCustomFieldDefinitionCommand.builder()
                .id(definitionId)
                .labelTranslations(request.getLabelTranslations())
                .fieldType(request.getFieldType())
                .isRequired(request.getIsRequired())
                .validationRules(request.getValidationRules())
                .isActive(request.getIsActive())
                .build();
    }

    /**
     * Converts domain model CustomFieldDefinition to API response DTO.
     */
    public CustomFieldDefinitionResponse toResponse(CustomFieldDefinition definition) {
        // Resolve display label based on current user language
        String userLanguage = CurrentUserContext.getUserLanguage();
        String displayLabel = resolveTranslation(definition.getLabelTranslations(), userLanguage);
        
        return CustomFieldDefinitionResponse.builder()
                .id(definition.getId())
                .tenantId(definition.getTenantId())
                .entityType(definition.getEntityType())
                .fieldKey(definition.getFieldKey())
                .labelTranslations(definition.getLabelTranslations())
                .displayLabel(displayLabel)
                .fieldType(definition.getFieldType())
                .isRequired(definition.getIsRequired())
                .isGlobal(definition.getIsGlobal())
                .validationRules(definition.getValidationRules())
                .isActive(definition.getIsActive())
                .isDeleted(definition.getIsDeleted())
                .createdById(definition.getCreatedById())
                .createdAt(definition.getCreatedAt())
                .updatedById(definition.getUpdatedById())
                .updatedAt(definition.getUpdatedAt())
                .rowVersion(definition.getRowVersion())
                .build();
    }

    /**
     * Resolves translation from a translations map based on language code.
     */
    private String resolveTranslation(Map<String, String> translations, String userLanguage) {
        if (translations == null || translations.isEmpty()) {
            return null;
        }

        if (userLanguage != null && translations.containsKey(userLanguage)) {
            return translations.get(userLanguage);
        }

        if (translations.containsKey("en")) {
            return translations.get("en");
        }

        return translations.values().iterator().next();
    }
}


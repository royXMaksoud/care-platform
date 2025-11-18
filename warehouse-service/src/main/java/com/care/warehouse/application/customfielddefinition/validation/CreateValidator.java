package com.care.warehouse.application.customfielddefinition.validation;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.care.warehouse.domain.ports.out.customfielddefinition.CustomFieldDefinitionCrudPort;
import com.sharedlib.core.dto.ErrorResponse;
import com.sharedlib.core.exception.ValidationException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Validator for custom field definition creation.
 * Validates required fields, field key uniqueness, and validation rules.
 */
@Component
@RequiredArgsConstructor
public class CreateValidator {

    private final CustomFieldDefinitionCrudPort customFieldDefinitionCrudPort;
    private final MessageResolver messageResolver;

    public void validate(CustomFieldDefinition definition) {
        if (definition == null) {
            throw new ValidationException("error.validation", List.of(
                    ErrorResponse.ValidationError.builder()
                            .field(null)
                            .code("error.validation")
                            .message(messageResolver.getMessage("error.validation"))
                            .build()
            ));
        }

        List<ErrorResponse.ValidationError> errors = new ArrayList<>();

        // Validate tenantId presence (from TenantContext, not from client)
        UUID tenantId = TenantContext.get();
        if (tenantId == null && !Boolean.TRUE.equals(definition.getIsGlobal())) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("tenantId")
                    .code("error.customFieldDefinition.tenant.required")
                    .message(messageResolver.getMessage("error.customFieldDefinition.tenant.required"))
                    .build());
        } else if (tenantId != null) {
            definition.setTenantId(tenantId);
        }

        // Validate entityType
        if (definition.getEntityType() == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("entityType")
                    .code("error.customFieldDefinition.entityType.required")
                    .message(messageResolver.getMessage("error.customFieldDefinition.entityType.required"))
                    .build());
        }

        // Validate fieldKey
        String fieldKey = definition.getFieldKey();
        if (StringUtils.isBlank(fieldKey)) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("fieldKey")
                    .code("error.customFieldDefinition.fieldKey.required")
                    .message(messageResolver.getMessage("error.customFieldDefinition.fieldKey.required"))
                    .build());
        } else if (fieldKey.length() > 100) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("fieldKey")
                    .code("error.customFieldDefinition.fieldKey.size.exceeded")
                    .message(messageResolver.getMessage("error.customFieldDefinition.fieldKey.size.exceeded"))
                    .build());
        }

        // Validate labelTranslations
        Map<String, String> labelTranslations = definition.getLabelTranslations();
        if (labelTranslations == null || labelTranslations.isEmpty()) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("labelTranslations")
                    .code("error.customFieldDefinition.labelTranslations.required")
                    .message(messageResolver.getMessage("error.customFieldDefinition.labelTranslations.required"))
                    .build());
        } else {
            // Validate language codes
            for (String langCode : labelTranslations.keySet()) {
                if (langCode == null || langCode.length() < 2 || langCode.length() > 10) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("labelTranslations")
                            .code("error.customFieldDefinition.languageCode.invalid")
                            .message(messageResolver.getMessage("error.customFieldDefinition.languageCode.invalid", new Object[]{langCode}))
                            .build());
                }
            }
        }

        // Validate fieldType
        if (definition.getFieldType() == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("fieldType")
                    .code("error.customFieldDefinition.fieldType.required")
                    .message(messageResolver.getMessage("error.customFieldDefinition.fieldType.required"))
                    .build());
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }

        // Validate uniqueness (fieldKey must be unique per tenant and entity type)
        if (tenantId != null && StringUtils.isNotBlank(fieldKey) && definition.getEntityType() != null) {
            var existing = customFieldDefinitionCrudPort.findByTenantIdAndEntityTypeAndFieldKey(
                    tenantId, definition.getEntityType(), fieldKey);
            if (existing.isPresent()) {
                throw new ValidationException("error.validation", List.of(
                        ErrorResponse.ValidationError.builder()
                                .field("fieldKey")
                                .code("error.customFieldDefinition.fieldKey.duplicate")
                                .message(messageResolver.getMessage("error.customFieldDefinition.fieldKey.duplicate"))
                                .build()
                ));
            }
        }
    }
}


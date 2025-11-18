package com.care.warehouse.application.customfielddefinition.validation;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.sharedlib.core.dto.ErrorResponse;
import com.sharedlib.core.exception.ValidationException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Validator for custom field definition updates.
 * Validates required fields and prevents modification of global fields by non-admin users.
 */
@Component
@RequiredArgsConstructor
public class UpdateValidator {

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
        if (tenantId == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("tenantId")
                    .code("error.customFieldDefinition.tenant.required")
                    .message(messageResolver.getMessage("error.customFieldDefinition.tenant.required"))
                    .build());
        }

        // Validate definition ID
        UUID definitionId = definition.getId();
        if (definitionId == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("id")
                    .code("error.customFieldDefinition.id.required")
                    .message(messageResolver.getMessage("error.customFieldDefinition.id.required"))
                    .build());
        }

        // Validate labelTranslations language codes if provided
        Map<String, String> labelTranslations = definition.getLabelTranslations();
        if (labelTranslations != null && !labelTranslations.isEmpty()) {
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

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }
    }
}


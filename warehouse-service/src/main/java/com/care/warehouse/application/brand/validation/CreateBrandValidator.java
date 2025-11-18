package com.care.warehouse.application.brand.validation;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.warehouse.validation.CustomFieldsValidator;
import com.care.warehouse.domain.model.Brand;
import com.care.warehouse.domain.ports.out.BrandRepositoryPort;
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
 * Validator for brand creation.
 * 
 * This validator performs comprehensive validation before creating a new brand:
 * 
 * 1. **Tenant Validation**: Ensures tenantId is present (from TenantContext, never from client)
 * 
 * 2. **Name Translations Validation**: 
 *    - Requires at least one translation in nameTranslations JSONB field
 *    - Validates language codes (2-10 characters, standard ISO format)
 *    - Example: {"en": "Apple Inc.", "ar": "شركة آبل"}
 * 
 * 3. **Country Origin Validation** (optional):
 *    - If provided, must be either:
 *      - 2-letter ISO country code (e.g., "US", "DE", "FR")
 *      - UUID reference to country entity (36 characters)
 * 
 * 4. **Custom Attributes Validation**:
 *    - Validates customAttributes JSONB against metadata definitions
 *    - Checks required fields, field types, validation rules
 *    - Uses EntityType.BRAND to fetch relevant custom field definitions
 * 
 * All validation errors are collected and thrown as ValidationException with
 * i18n-friendly error messages.
 * 
 * @author CARE Team
 */
@Component
@RequiredArgsConstructor
public class CreateBrandValidator {

    private final BrandRepositoryPort brandRepositoryPort;
    private final MessageResolver messageResolver;
    private final CustomFieldsValidator customFieldsValidator;

    public void validate(Brand brand) {
        if (brand == null) {
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
                    .code("error.brand.tenant.required")
                    .message(messageResolver.getMessage("error.brand.tenant.required"))
                    .build());
        } else {
            brand.setTenantId(tenantId);
        }

        // Validate nameTranslations (required, at least one translation)
        Map<String, String> nameTranslations = brand.getNameTranslations();
        if (nameTranslations == null || nameTranslations.isEmpty()) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("nameTranslations")
                    .code("error.brand.nameTranslations.required")
                    .message(messageResolver.getMessage("error.brand.nameTranslations.required"))
                    .build());
        } else {
            // Validate language codes
            for (String langCode : nameTranslations.keySet()) {
                if (langCode == null || langCode.length() < 2 || langCode.length() > 10) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("nameTranslations")
                            .code("error.brand.languageCode.invalid")
                            .message(messageResolver.getMessage("error.brand.languageCode.invalid", new Object[]{langCode}))
                            .build());
                }
            }
        }

        // Validate countryOrigin format (optional, but if provided should be valid)
        String countryOrigin = brand.getCountryOrigin();
        if (countryOrigin != null && !countryOrigin.isBlank()) {
            // Can be 2-letter ISO code or UUID format
            if (countryOrigin.length() != 2 && countryOrigin.length() != 36) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("countryOrigin")
                        .code("error.brand.countryOrigin.invalid")
                        .message(messageResolver.getMessage("error.brand.countryOrigin.invalid"))
                        .build());
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }

        // Validate custom attributes against metadata definitions
        // Uses EntityType.BRAND to fetch relevant custom field definitions
        customFieldsValidator.validate(brand.getCustomAttributes(), com.care.warehouse.domain.enums.EntityType.BRAND);
    }
}


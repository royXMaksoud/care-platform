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
 * Validator for brand updates.
 * 
 * This validator performs comprehensive validation before updating a brand:
 * 
 * 1. **Tenant Validation**: Ensures tenantId is present (from TenantContext, never from client)
 * 
 * 2. **Brand ID Validation**: Ensures brand ID is present
 * 
 * 3. **Name Translations Validation** (if provided):
 *    - Validates language codes (2-10 characters, standard ISO format)
 * 
 * 4. **Country Origin Validation** (if provided):
 *    - Must be either 2-letter ISO code or UUID (36 characters)
 * 
 * 5. **Custom Attributes Validation** (if provided):
 *    - Validates customAttributes JSONB against metadata definitions
 *    - Uses EntityType.BRAND to fetch relevant custom field definitions
 * 
 * Note: All fields are optional for updates (partial updates supported).
 * Only provided fields are validated.
 * 
 * @author CARE Team
 */
@Component
@RequiredArgsConstructor
public class UpdateBrandValidator {

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
        }

        // Validate brand ID
        UUID brandId = brand.getId();
        if (brandId == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("id")
                    .code("error.brand.id.required")
                    .message(messageResolver.getMessage("error.brand.id.required"))
                    .build());
        }

        // Validate nameTranslations language codes if provided
        Map<String, String> nameTranslations = brand.getNameTranslations();
        if (nameTranslations != null && !nameTranslations.isEmpty()) {
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

        // Validate countryOrigin format if provided
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


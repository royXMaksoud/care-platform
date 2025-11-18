package com.care.warehouse.application.category.validation;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.Category;
import com.care.warehouse.domain.ports.out.CategoryRepositoryPort;
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
 * Validator for category creation.
 * 
 * This validator performs comprehensive validation before creating a new category:
 * 
 * 1. **Tenant Validation**: Ensures tenantId is present (from TenantContext, never from client)
 * 
 * 2. **Name Translations Validation**: 
 *    - Requires at least one translation in nameTranslations JSONB field
 *    - Validates language codes (2-10 characters, standard ISO format)
 * 
 * 3. **Parent Validation** (if parentId is provided):
 *    - Verifies parent category exists
 *    - Ensures parent belongs to same tenant (tenant isolation)
 *    - Ensures parent is not deleted (soft-delete check)
 *    - Note: Circular reference prevention is handled in UpdateCategoryValidator
 *      since new categories don't have descendants yet
 * 
 * All validation errors are collected and thrown as ValidationException with
 * i18n-friendly error messages.
 * 
 * @author CARE Team
 */
@Component
@RequiredArgsConstructor
public class CreateCategoryValidator {

    private final CategoryRepositoryPort categoryRepositoryPort;
    private final MessageResolver messageResolver;

    /**
     * Validates a category before creation.
     * 
     * Validation steps:
     * 1. Check category is not null
     * 2. Validate tenantId from TenantContext (never trust client input)
     * 3. Validate nameTranslations (required, valid language codes)
     * 4. Validate parent exists and belongs to same tenant (if parentId provided)
     * 
     * @param category Category domain model to validate
     * @throws ValidationException if validation fails with detailed error messages
     */
    public void validate(Category category) {
        if (category == null) {
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
                    .code("error.category.tenant.required")
                    .message(messageResolver.getMessage("error.category.tenant.required"))
                    .build());
        } else {
            category.setTenantId(tenantId);
        }

        // Validate nameTranslations (required, at least one translation)
        Map<String, String> nameTranslations = category.getNameTranslations();
        if (nameTranslations == null || nameTranslations.isEmpty()) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("nameTranslations")
                    .code("error.category.nameTranslations.required")
                    .message(messageResolver.getMessage("error.category.nameTranslations.required"))
                    .build());
        } else {
            // Validate language codes
            for (String langCode : nameTranslations.keySet()) {
                if (langCode == null || langCode.length() < 2 || langCode.length() > 10) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("nameTranslations")
                            .code("error.category.languageCode.invalid")
                            .message(messageResolver.getMessage("error.category.languageCode.invalid", new Object[]{langCode}))
                            .build());
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }

        // Validate parent exists (if provided)
        UUID parentId = category.getParentId();
        if (parentId != null && tenantId != null) {
            var parentOpt = categoryRepositoryPort.load(parentId);
            if (parentOpt.isEmpty()) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("parentId")
                        .code("error.category.parent.notFound")
                        .message(messageResolver.getMessage("error.category.parent.notFound"))
                        .build());
            } else {
                Category parent = parentOpt.get();
                // Ensure parent belongs to same tenant
                if (!parent.getTenantId().equals(tenantId)) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("parentId")
                            .code("error.category.parent.tenantMismatch")
                            .message(messageResolver.getMessage("error.category.parent.tenantMismatch"))
                            .build());
                }
                // Ensure parent is not deleted
                if (Boolean.TRUE.equals(parent.getIsDeleted())) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("parentId")
                            .code("error.category.parent.deleted")
                            .message(messageResolver.getMessage("error.category.parent.deleted"))
                            .build());
                }
                
                // Validate 3-level hierarchy constraint: level must be <= 2 (0, 1, 2 = 3 levels)
                // Level 0 = root category (category)
                // Level 1 = subcategory
                // Level 2 = itemCategory
                // Level 3+ = not allowed
                Integer parentLevel = parent.getLevel();
                if (parentLevel != null && parentLevel >= 2) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("parentId")
                            .code("error.category.maxLevelExceeded")
                            .message(messageResolver.getMessage("error.category.maxLevelExceeded"))
                            .build());
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }
    }
}


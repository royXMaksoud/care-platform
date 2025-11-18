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
 * Validator for category updates.
 * 
 * This validator performs comprehensive validation before updating a category:
 * 
 * 1. **Tenant Validation**: Ensures tenantId is present (from TenantContext, never from client)
 * 
 * 2. **Category ID Validation**: Ensures category ID is present
 * 
 * 3. **Name Translations Validation**: 
 *    - Validates language codes if provided (2-10 characters)
 * 
 * 4. **Parent Validation** (if parentId is provided or changed):
 *    - Prevents self-parenting (category cannot be its own parent)
 *    - Verifies parent category exists
 *    - Ensures parent belongs to same tenant (tenant isolation)
 *    - Ensures parent is not deleted (soft-delete check)
 *    - **Circular Reference Prevention**: Uses path-based query to check if
 *      the new parent is a descendant of the current category
 * 
 * **Circular Reference Prevention Logic**:
 * A circular reference occurs when:
 * - Category A has parent B
 * - Category B has parent C
 * - Category C has parent A (circular!)
 * 
 * To prevent this, we check if the new parent is a descendant of the current category.
 * If it is, setting it as parent would create a cycle.
 * 
 * Example:
 * - Current category: A (path: "/A")
 * - Potential parent: B (path: "/A/B")
 * - Since B's path contains A's path, B is a descendant of A
 * - Therefore, A cannot have B as parent (would create cycle: A -> B -> ... -> A)
 * 
 * The check uses the `path` field which stores the full path from root:
 * - Root category: "/root-id"
 * - Child: "/root-id/child-id"
 * - Grandchild: "/root-id/child-id/grandchild-id"
 * 
 * We check if potentialParent.path starts with currentCategory.path + "/"
 * to detect if potential parent is a descendant.
 * 
 * @author CARE Team
 */
@Component
@RequiredArgsConstructor
public class UpdateCategoryValidator {

    private final CategoryRepositoryPort categoryRepositoryPort;
    private final MessageResolver messageResolver;

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
        }

        // Validate category ID
        UUID categoryId = category.getId();
        if (categoryId == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("id")
                    .code("error.category.id.required")
                    .message(messageResolver.getMessage("error.category.id.required"))
                    .build());
        }

        // Validate nameTranslations language codes if provided
        Map<String, String> nameTranslations = category.getNameTranslations();
        if (nameTranslations != null && !nameTranslations.isEmpty()) {
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

        // Validate parent exists and prevent circular references
        UUID parentId = category.getParentId();
        if (parentId != null && tenantId != null && categoryId != null) {
            // Prevent self-parenting
            if (parentId.equals(categoryId)) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("parentId")
                        .code("error.category.parent.self")
                        .message(messageResolver.getMessage("error.category.parent.self"))
                        .build());
            } else {
                // Check if parent exists
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
                    
                    // Prevent circular reference: check if new parent is a descendant of current category
                    // 
                    // Circular reference scenario:
                    // If we have: A -> B -> C (A is parent of B, B is parent of C)
                    // And we try to set C as parent of A, we get: A -> C -> ... -> A (cycle!)
                    // 
                    // To prevent this, we check if the potential parent (parentId) is a descendant
                    // of the current category (categoryId). If it is, setting it as parent would
                    // create a cycle.
                    // 
                    // The isDescendantOf method uses path-based queries:
                    // - Gets the potential parent's path (e.g., "/A/B/C")
                    // - Checks if current category's path is a prefix of parent's path
                    // - If yes, parent is a descendant, so we cannot set it as parent
                    if (categoryRepositoryPort.isDescendantOf(tenantId, parentId, categoryId)) {
                        errors.add(ErrorResponse.ValidationError.builder()
                                .field("parentId")
                                .code("error.category.parent.circular")
                                .message(messageResolver.getMessage("error.category.parent.circular"))
                                .build());
                    }
                    
                    // Validate 3-level hierarchy constraint: level must be <= 2 (0, 1, 2 = 3 levels)
                    // Level 0 = root category (category)
                    // Level 1 = subcategory
                    // Level 2 = itemCategory
                    // Level 3+ = not allowed
                    // 
                    // Calculate what the new level would be if we set this parent
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
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }
    }
}


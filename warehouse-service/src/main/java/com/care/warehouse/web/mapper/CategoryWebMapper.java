package com.care.warehouse.web.mapper;

import com.care.warehouse.application.category.command.CreateCategoryCommand;
import com.care.warehouse.application.category.command.UpdateCategoryCommand;
import com.care.warehouse.domain.model.Category;
import com.care.warehouse.web.dto.category.CategoryResponse;
import com.care.warehouse.web.dto.category.CreateCategoryRequest;
import com.care.warehouse.web.dto.category.UpdateCategoryRequest;
import com.sharedlib.core.context.CurrentUserContext;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Mapper to convert between Web layer DTOs and Domain models/Commands related to Category.
 */
@Component
public class CategoryWebMapper {

    /**
     * Converts CreateCategoryRequest to CreateCategoryCommand.
     */
    public CreateCategoryCommand toCreateCommand(CreateCategoryRequest request) {
        return CreateCategoryCommand.builder()
                .nameTranslations(request.getNameTranslations())
                .parentId(request.getParentId())
                .isActive(request.getIsActive())
                .build();
    }

    /**
     * Converts UpdateCategoryRequest to UpdateCategoryCommand.
     */
    public UpdateCategoryCommand toUpdateCommand(java.util.UUID categoryId, UpdateCategoryRequest request) {
        return UpdateCategoryCommand.builder()
                .id(categoryId)
                .nameTranslations(request.getNameTranslations())
                .parentId(request.getParentId())
                .isActive(request.getIsActive())
                .build();
    }

    /**
     * Converts domain model Category to API response DTO.
     */
    public CategoryResponse toResponse(Category category) {
        // Resolve display name based on current user language
        String userLanguage = CurrentUserContext.getUserLanguage();
        String displayName = resolveTranslation(category.getNameTranslations(), userLanguage);
        
        return CategoryResponse.builder()
                .id(category.getId())
                .tenantId(category.getTenantId())
                .nameTranslations(category.getNameTranslations())
                .displayName(displayName)
                .parentId(category.getParentId())
                .level(category.getLevel())
                .path(category.getPath())
                .isActive(category.getIsActive())
                .isDeleted(category.getIsDeleted())
                .createdById(category.getCreatedById())
                .createdAt(category.getCreatedAt())
                .updatedById(category.getUpdatedById())
                .updatedAt(category.getUpdatedAt())
                .rowVersion(category.getRowVersion())
                .build();
    }

    /**
     * Resolves translation from a translations map based on language code.
     * Falls back to "en" if user language not available, then to first available translation.
     */
    private String resolveTranslation(Map<String, String> translations, String userLanguage) {
        if (translations == null || translations.isEmpty()) {
            return null;
        }

        // Try user's language first
        if (userLanguage != null && translations.containsKey(userLanguage)) {
            return translations.get(userLanguage);
        }

        // Fall back to English
        if (translations.containsKey("en")) {
            return translations.get("en");
        }

        // Fall back to first available translation
        return translations.values().iterator().next();
    }
}


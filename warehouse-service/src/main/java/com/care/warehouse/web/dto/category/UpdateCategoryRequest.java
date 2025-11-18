package com.care.warehouse.web.dto.category;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

/**
 * Request DTO used to update an existing Category.
 * All fields are optional - only provided fields will be updated.
 */
@Getter
@Setter
public class UpdateCategoryRequest {

    /**
     * Multilingual category names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    @NotEmpty(message = "{category.nameTranslations.notEmpty}")
    private Map<String, String> nameTranslations;

    /**
     * Parent category ID (nullable for root categories).
     * Changing parent will recalculate level and path.
     */
    private UUID parentId;

    private Boolean isActive;
}


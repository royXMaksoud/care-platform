package com.care.warehouse.web.dto.category;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

/**
 * Request DTO used to create a new Category.
 * All required fields must be provided by the client.
 */
@Getter
@Setter
public class CreateCategoryRequest {

    /**
     * Multilingual category names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    @NotNull(message = "{category.nameTranslations.required}")
    @NotEmpty(message = "{category.nameTranslations.notEmpty}")
    private Map<String, String> nameTranslations;

    /**
     * Parent category ID (nullable for root categories).
     */
    private UUID parentId;

    private Boolean isActive;
}


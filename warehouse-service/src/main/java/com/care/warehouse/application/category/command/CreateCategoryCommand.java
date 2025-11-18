package com.care.warehouse.application.category.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * Command object used to create a new Category.
 * This is part of the application layer (Command side) in Clean Architecture.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryCommand {
    
    /**
     * Multilingual category names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    private Map<String, String> nameTranslations;
    
    /**
     * Parent category ID (nullable for root categories).
     */
    private UUID parentId;
    
    private Boolean isActive;
}


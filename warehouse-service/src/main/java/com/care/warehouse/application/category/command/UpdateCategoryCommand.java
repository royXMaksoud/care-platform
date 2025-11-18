package com.care.warehouse.application.category.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * Command object used to update an existing Category.
 * This belongs to the application layer (Command side) in Clean Architecture.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCategoryCommand {
    
    /** The unique identifier of the category to be updated */
    private UUID id;
    
    /**
     * Multilingual category names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    private Map<String, String> nameTranslations;
    
    /**
     * Parent category ID (nullable for root categories).
     * Changing parent will recalculate level and path.
     */
    private UUID parentId;
    
    private Boolean isActive;
}


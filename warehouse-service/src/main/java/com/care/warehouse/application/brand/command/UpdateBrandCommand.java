package com.care.warehouse.application.brand.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * Command object used to update an existing Brand.
 * This belongs to the application layer (Command side) in Clean Architecture.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBrandCommand {
    
    /** The unique identifier of the brand to be updated */
    private UUID id;
    
    /**
     * Multilingual brand names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    private Map<String, String> nameTranslations;
    
    /**
     * Country of origin (ISO country code or UUID reference).
     */
    private String countryOrigin;
    
    /**
     * Custom attributes (tenant-specific fields).
     */
    private Map<String, Object> customAttributes;
    
    private Boolean isActive;
}


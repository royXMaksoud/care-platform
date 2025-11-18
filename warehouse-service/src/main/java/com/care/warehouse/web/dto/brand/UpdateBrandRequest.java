package com.care.warehouse.web.dto.brand;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

/**
 * Request DTO used to update an existing Brand.
 * All fields are optional - only provided fields will be updated.
 */
@Getter
@Setter
public class UpdateBrandRequest {

    /**
     * Multilingual brand names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    @NotEmpty(message = "{brand.nameTranslations.notEmpty}")
    private Map<String, String> nameTranslations;

    /**
     * Country of origin (ISO country code or UUID reference).
     */
    @Size(max = 50, message = "{brand.countryOrigin.max}")
    private String countryOrigin;

    /**
     * Custom attributes (tenant-specific fields).
     */
    private Map<String, Object> customAttributes;

    private Boolean isActive;
}


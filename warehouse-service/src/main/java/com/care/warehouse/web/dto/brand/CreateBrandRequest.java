package com.care.warehouse.web.dto.brand;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

/**
 * Request DTO used to create a new Brand.
 * All required fields must be provided by the client.
 */
@Getter
@Setter
public class CreateBrandRequest {

    /**
     * Multilingual brand names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    @NotNull(message = "{brand.nameTranslations.required}")
    @NotEmpty(message = "{brand.nameTranslations.notEmpty}")
    private Map<String, String> nameTranslations;

    /**
     * Country of origin (ISO country code or UUID reference).
     * Can be 2-letter ISO code (e.g., "US", "DE") or UUID.
     */
    @Size(max = 50, message = "{brand.countryOrigin.max}")
    private String countryOrigin;

    /**
     * Custom attributes (tenant-specific fields).
     * Example: {"foundedYear": 1990, "headquarters": "New York"}
     */
    private Map<String, Object> customAttributes;

    private Boolean isActive;
}


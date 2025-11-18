package com.care.warehouse.web.dto.brand;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO returned from API when a Brand is retrieved.
 * This includes both basic info and audit fields.
 */
@Getter
@Builder
public class BrandResponse {

    private UUID id;
    private UUID tenantId;
    
    /**
     * Multilingual brand names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    private Map<String, String> nameTranslations;
    
    /**
     * Resolved display name based on current user language.
     * Falls back to "en" if user language not available.
     */
    private String displayName;
    
    private String countryOrigin;
    
    /**
     * Custom attributes (tenant-specific fields).
     */
    private Map<String, Object> customAttributes;
    
    // Audit fields
    private Boolean isActive;
    private Boolean isDeleted;
    private UUID createdById;
    private Instant createdAt;
    private UUID updatedById;
    private Instant updatedAt;
    private Long rowVersion;
}


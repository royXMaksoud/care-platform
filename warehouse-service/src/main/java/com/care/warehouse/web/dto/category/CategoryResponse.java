package com.care.warehouse.web.dto.category;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO returned from API when a Category is retrieved.
 * This includes both basic info and audit fields.
 */
@Getter
@Builder
public class CategoryResponse {

    private UUID id;
    private UUID tenantId;
    
    /**
     * Multilingual category names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    private Map<String, String> nameTranslations;
    
    /**
     * Resolved display name based on current user language.
     * Falls back to "en" if user language not available.
     */
    private String displayName;
    
    private UUID parentId;
    private Integer level;
    private String path;
    
    // Audit fields
    private Boolean isActive;
    private Boolean isDeleted;
    private UUID createdById;
    private Instant createdAt;
    private UUID updatedById;
    private Instant updatedAt;
    private Long rowVersion;
}


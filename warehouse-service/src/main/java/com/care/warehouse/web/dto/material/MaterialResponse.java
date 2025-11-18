package com.care.warehouse.web.dto.material;

import com.care.warehouse.domain.enums.DeterminerType;
import com.care.warehouse.domain.enums.MaterialStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO returned from API when a Material is retrieved.
 * This includes both basic info and audit fields.
 */
@Getter
@Builder
public class MaterialResponse {

    private UUID id;
    private UUID tenantId;
    private String code;
    
    /**
     * Multilingual material names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    private Map<String, String> nameTranslations;
    
    /**
     * Resolved display name based on current user language.
     * Falls back to "en" if user language not available.
     */
    private String displayName;
    
    /**
     * Multilingual material descriptions.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated description
     */
    private Map<String, String> descriptionTranslations;
    
    /**
     * Resolved display description based on current user language.
     * Falls back to "en" if user language not available.
     */
    private String displayDescription;
    
    private UUID categoryId;
    private UUID brandId;
    
    /**
     * Material determiners (unique identifiers).
     */
    private List<MaterialDeterminerDto> determiners;
    
    private Boolean isTrackable;
    private MaterialStatus status;
    
    /**
     * Custom attributes (tenant-specific fields).
     */
    private Map<String, Object> customAttributes;

    /**
     * Minimum stock level threshold for reorder.
     * When stock falls below this level, reorder should be triggered.
     */
    private Integer reorderLevel;

    /**
     * Unit of measurement for the material.
     * Examples: "KG", "PCS", "L", "M", "BOX", "PACK", etc.
     */
    private String unit;

    // Audit fields
    private Boolean isActive;
    private Boolean isDeleted;
    private UUID createdById;
    private Instant createdAt;
    private UUID updatedById;
    private Instant updatedAt;
    private Long rowVersion;
    
    /**
     * DTO for material determiner in response.
     */
    @Getter
    @Builder
    public static class MaterialDeterminerDto {
        private DeterminerType type;
        private String value;
        private Map<String, Object> metadata;
    }
}


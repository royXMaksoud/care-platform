package com.care.warehouse.web.dto.warehouse;

import com.care.warehouse.domain.enums.WarehouseType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO returned from API when a Warehouse is retrieved.
 * This includes both basic info and audit fields.
 */
@Getter
@Builder
public class WarehouseResponse {

    private UUID id;
    private UUID tenantId;
    private String code;
    
    /**
     * Multilingual warehouse names.
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
     * Multilingual warehouse descriptions.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated description
     */
    private Map<String, String> descriptionTranslations;
    
    /**
     * Resolved display description based on current user language.
     * Falls back to "en" if user language not available.
     */
    private String displayDescription;
    
    private WarehouseType warehouseType;
    private UUID parentWarehouseId;
    private UUID countryId;
    private UUID locationId;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String countryCode;
    private Double latitude;
    private Double longitude;
    private String timeZone;
    private Map<String, Object> customData;
    
    // Audit fields
    private Boolean isActive;
    private Boolean isDeleted;
    private UUID createdById;
    private Instant createdAt;
    private UUID updatedById;
    private Instant updatedAt;
    private Long rowVersion;
}


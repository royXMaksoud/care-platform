package com.care.warehouse.domain.model;

import lombok.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Domain model for Brand aggregate.
 * 
 * This represents a brand/manufacturer.
 * 
 * Features:
 * - Multi-tenant support (tenantId)
 * - Multilingual names (JSONB)
 * - Country of origin
 * - Custom attributes (JSONB)
 * - Soft delete and audit fields
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Brand {
    
    /** Unique identifier for the brand */
    private UUID id;
    
    /** Tenant ID for multi-tenant isolation */
    private UUID tenantId;
    
    /**
     * Multilingual brand names.
     * Structure: {"en": "Brand Name", "ar": "اسم العلامة التجارية", "fr": "Nom de la marque"}
     */
    private Map<String, String> nameTranslations;
    
    /**
     * Country of origin (ISO country code or UUID reference to country).
     * Can be a 2-letter ISO code (e.g., "US", "DE") or UUID reference.
     */
    private String countryOrigin;
    
    /**
     * JSONB field for custom attributes per tenant.
     * Example: {"foundedYear": 1990, "headquarters": "New York", "website": "https://example.com"}
     */
    private Map<String, Object> customAttributes;
    
    /** Active/Deleted flags */
    @Builder.Default
    private Boolean isActive = Boolean.TRUE;
    
    @Builder.Default
    private Boolean isDeleted = Boolean.FALSE;
    
    /** Audit fields */
    private UUID createdById;
    private Instant createdAt;
    
    private UUID updatedById;
    private Instant updatedAt;
    
    /** Optimistic locking */
    private Long rowVersion;
}


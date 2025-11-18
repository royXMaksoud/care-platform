package com.care.warehouse.domain.model;

import lombok.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Domain model for CustomFieldOption aggregate.
 * 
 * This represents options for dropdown fields (DROPDOWN_SINGLE, DROPDOWN_MULTI).
 * Each option belongs to a CustomFieldDefinition.
 * 
 * Features:
 * - Multi-tenant support (via definition's tenantId)
 * - Multilingual option values (JSONB)
 * - Sort order for display
 * - Soft delete and audit fields
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomFieldOption {
    
    /** Unique identifier for the option */
    private UUID id;
    
    /**
     * Reference to the custom field definition this option belongs to
     */
    private UUID definitionId;
    
    /**
     * Unique key for the option within the definition.
     * Used as the value in custom_attributes JSONB.
     */
    private String valueKey;
    
    /**
     * Multilingual option values.
     * Structure: {"en": "Option Value", "ar": "قيمة الخيار", "fr": "Valeur de l'option"}
     */
    private Map<String, String> valueTranslations;
    
    /**
     * Sort order for display (lower numbers appear first)
     */
    private Integer sortOrder;
    
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


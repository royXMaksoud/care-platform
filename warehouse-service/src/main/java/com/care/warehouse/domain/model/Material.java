package com.care.warehouse.domain.model;

import com.care.warehouse.domain.enums.MaterialStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Domain model for Material aggregate.
 * 
 * This is a pure domain model without JPA annotations.
 * It represents materials/items that can be stored in warehouses.
 * 
 * Features:
 * - Multi-tenant support (tenantId)
 * - Multilingual names and descriptions (JSONB)
 * - Multiple determiners (barcode, serial number, IMEI, QR, SKU)
 * - Category and brand references
 * - Trackable flag (for unique identification)
 * - Custom attributes (JSONB)
 * - Soft delete and audit fields
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Material {
    
    /** Unique identifier for the material */
    private UUID id;
    
    /** Tenant ID for multi-tenant isolation */
    private UUID tenantId;
    
    /** Material code (unique per tenant) */
    private String code;
    
    /**
     * Multilingual material names.
     * Structure: {"en": "Material Name", "ar": "اسم المادة", "fr": "Nom du matériel"}
     */
    private Map<String, String> nameTranslations;
    
    /**
     * Multilingual material descriptions.
     * Structure: {"en": "Description", "ar": "الوصف"}
     */
    private Map<String, String> descriptionTranslations;
    
    /** Reference to category (from code_table_value or category entity) */
    private UUID categoryId;
    
    /** Reference to brand (from code_table_value or brand entity) */
    private UUID brandId;
    
    /**
     * Material determiners (unique identifiers).
     * Structure: [
     *   {"type": "BARCODE", "value": "1234567890"},
     *   {"type": "SERIAL_NUMBER", "value": "SN-001"},
     *   {"type": "IMEI", "value": "123456789012345"}
     * ]
     */
    private List<MaterialDeterminer> determiners;
    
    /**
     * Whether this material requires unique identification (tracking).
     * If true, each unit must have a unique identifier (serial number, IMEI, etc.)
     */
    private Boolean isTrackable;
    
    /**
     * Material status (ACTIVE, INACTIVE, DISCONTINUED, PENDING_APPROVAL)
     */
    private MaterialStatus status;
    
    /**
     * JSONB field for custom attributes per tenant.
     * Example: {"weight": 1.5, "dimensions": {"length": 10, "width": 5, "height": 3}, "color": "red"}
     */
    private Map<String, Object> customAttributes;
    
    /**
     * Minimum stock level threshold for reorder.
     * When stock falls below this level, reorder should be triggered.
     * Optional field for inventory management.
     */
    private Integer reorderLevel;
    
    /**
     * Unit of measurement for the material.
     * Examples: "KG", "PCS", "L", "M", "BOX", "PACK", etc.
     * Optional field for inventory tracking.
     */
    private String unit;
    
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
    
    /**
     * Inner class representing a material determiner (unique identifier).
     */
    @Getter
    @Setter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MaterialDeterminer {
        /** Type of determiner (BARCODE, SERIAL_NUMBER, IMEI, etc.) */
        private com.care.warehouse.domain.enums.DeterminerType type;
        
        /** The determiner value (e.g., barcode number, serial number) */
        private String value;
        
        /** Optional: Additional metadata for the determiner */
        private Map<String, Object> metadata;
    }
}


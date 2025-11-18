package com.care.warehouse.infrastructure.db.entities;

import com.care.warehouse.domain.enums.MaterialStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Entity representing a material/item.
 * 
 * Features:
 * - Multi-tenant support (tenant_id)
 * - Multilingual names and descriptions (JSONB)
 * - Multiple determiners (barcode, serial number, IMEI, QR, SKU) stored as JSONB
 * - Category and brand references
 * - Trackable flag
 * - Custom attributes (JSONB)
 * - Soft delete and audit fields
 */
@Entity
@Table(
    name = "materials",
    schema = "public",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_materials_tenant_code",
            columnNames = {"tenant_id", "code"}
        )
    },
    indexes = {
        @Index(name = "ix_materials_tenant_deleted", columnList = "tenant_id, is_deleted"),
        @Index(name = "ix_materials_tenant_code", columnList = "tenant_id, code"),
        @Index(name = "ix_materials_category", columnList = "category_id"),
        @Index(name = "ix_materials_brand", columnList = "brand_id"),
        @Index(name = "ix_materials_status", columnList = "status"),
        @Index(name = "ix_materials_trackable", columnList = "is_trackable"),
        @Index(name = "ix_materials_reorder_level", columnList = "reorder_level"),
        @Index(name = "ix_materials_unit", columnList = "unit")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialEntity extends BaseEntity {

    /**
     * Unique material code within tenant (e.g., "MAT-001", "PROD-123")
     */
    @Column(name = "code", nullable = false, length = 100)
    private String code;

    /**
     * Multilingual material names stored as JSONB.
     * Structure: {"en": "Material Name", "ar": "اسم المادة", "fr": "Nom du matériel"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "name_translations", columnDefinition = "jsonb")
    private Map<String, String> nameTranslations;

    /**
     * Multilingual material descriptions stored as JSONB.
     * Structure: {"en": "Description", "ar": "الوصف"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "description_translations", columnDefinition = "jsonb")
    private Map<String, String> descriptionTranslations;

    /**
     * Reference to category (from code_table_value or category entity).
     * UUID reference only, no foreign key constraint (cross-database).
     */
    @Column(name = "category_id")
    private UUID categoryId;

    /**
     * Reference to brand (from code_table_value or brand entity).
     * UUID reference only, no foreign key constraint (cross-database).
     */
    @Column(name = "brand_id")
    private UUID brandId;

    /**
     * Material determiners stored as JSONB array.
     * Structure: [
     *   {"type": "BARCODE", "value": "1234567890", "metadata": {}},
     *   {"type": "SERIAL_NUMBER", "value": "SN-001", "metadata": {}}
     * ]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "determiners", columnDefinition = "jsonb")
    private List<Map<String, Object>> determiners;

    /**
     * Whether this material requires unique identification (tracking).
     * If true, each unit must have a unique identifier (serial number, IMEI, etc.)
     */
    @Column(name = "is_trackable", nullable = false)
    @Builder.Default
    private Boolean isTrackable = false;

    /**
     * Material status (ACTIVE, INACTIVE, DISCONTINUED, PENDING_APPROVAL)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private MaterialStatus status = MaterialStatus.ACTIVE;

    /**
     * JSONB field for tenant-specific custom attributes.
     * Example: {"weight": 1.5, "dimensions": {"length": 10, "width": 5, "height": 3}, "color": "red"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_attributes", columnDefinition = "jsonb")
    private Map<String, Object> customAttributes;

    /**
     * Minimum stock level threshold for reorder.
     * When stock falls below this level, reorder should be triggered.
     * Optional field for inventory management.
     */
    @Column(name = "reorder_level")
    private Integer reorderLevel;

    /**
     * Unit of measurement for the material.
     * Examples: "KG", "PCS", "L", "M", "BOX", "PACK", etc.
     * Optional field for inventory tracking.
     */
    @Column(name = "unit", length = 50)
    private String unit;

    /**
     * Pre-persist callback to set defaults
     */
    @PrePersist
    @Override
    protected void prePersist() {
        super.prePersist();
        if (isTrackable == null) {
            isTrackable = false;
        }
        if (status == null) {
            status = MaterialStatus.ACTIVE;
        }
    }

    /**
     * Pre-update callback
     */
    @PreUpdate
    @Override
    protected void preUpdate() {
        super.preUpdate();
    }
}


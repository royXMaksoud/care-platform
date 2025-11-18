package com.care.warehouse.infrastructure.db.entities;

import com.care.warehouse.domain.enums.WarehouseType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Entity representing a warehouse.
 * 
 * Features:
 * - Multi-tenant support (tenant_id)
 * - Warehouse hierarchy (parent_warehouse_id)
 * - Geospatial data (latitude, longitude)
 * - Location references (country_id, location_id from access-management-service)
 * - Multilingual support via WarehouseLanguageEntity
 * - Custom fields per tenant (custom_data JSONB)
 * - Soft delete and audit fields
 * 
 * Future enhancements:
 * - warehouse_type will be replaced with code_table_value_id for multilingual types
 * - PostGIS support for advanced geospatial queries
 * - IoT sensor integration
 * - Blockchain movement logs
 */
@Entity
@Table(
    name = "warehouses",
    schema = "public",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_warehouses_tenant_code",
            columnNames = {"tenant_id", "code"}
        )
    },
    indexes = {
        @Index(name = "ix_warehouses_tenant_deleted", columnList = "tenant_id, is_deleted"),
        @Index(name = "ix_warehouses_tenant_type", columnList = "tenant_id, warehouse_type"),
        @Index(name = "ix_warehouses_parent", columnList = "parent_warehouse_id"),
        @Index(name = "ix_warehouses_country", columnList = "country_id"),
        @Index(name = "ix_warehouses_location", columnList = "location_id"),
        @Index(name = "ix_warehouses_coordinates", columnList = "latitude, longitude"),
        @Index(name = "ix_warehouses_tenant_code", columnList = "tenant_id, code")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseEntity extends BaseEntity {

    /**
     * Unique warehouse code within tenant (e.g., "WH-001", "HQ-WH")
     */
    @Column(name = "code", nullable = false, length = 100)
    private String code;

    /**
     * Multilingual warehouse names stored as JSONB.
     * Structure: {"en": "Main Warehouse", "ar": "المستودع الرئيسي", "fr": "Entrepôt Principal"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "name_translations", columnDefinition = "jsonb")
    private Map<String, String> nameTranslations;

    /**
     * Multilingual warehouse descriptions stored as JSONB.
     * Structure: {"en": "Primary distribution center", "ar": "مركز التوزيع الرئيسي"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "description_translations", columnDefinition = "jsonb")
    private Map<String, String> descriptionTranslations;

    /**
     * Warehouse type (enum).
     * TODO: Replace with code_table_value_id for multilingual support
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "warehouse_type", nullable = false, length = 50)
    private WarehouseType warehouseType;

    /**
     * Self-reference for warehouse hierarchy.
     * NULL for root warehouses (MAIN type typically).
     * Example: BRANCH -> MAIN, STORE -> BRANCH
     */
    @Column(name = "parent_warehouse_id")
    private UUID parentWarehouseId;

    /**
     * Reference to country (from access-management-service code_countries table).
     * UUID reference only, no foreign key constraint (cross-database).
     */
    @Column(name = "country_id")
    private UUID countryId;

    /**
     * Reference to location (from access-management-service locations table).
     * UUID reference only, no foreign key constraint (cross-database).
     */
    @Column(name = "location_id")
    private UUID locationId;

    /**
     * Address line 1
     */
    @Column(name = "address_line1", length = 255)
    private String addressLine1;

    /**
     * Address line 2
     */
    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    /**
     * City
     */
    @Column(name = "city", length = 100)
    private String city;

    /**
     * State/Province
     */
    @Column(name = "state", length = 100)
    private String state;

    /**
     * Postal/ZIP code
     */
    @Column(name = "postal_code", length = 20)
    private String postalCode;

    /**
     * ISO 2-letter country code (e.g., "SY", "US")
     */
    @Column(name = "country_code", length = 2)
    private String countryCode;

    /**
     * GPS latitude (-90 to 90)
     */
    @Column(name = "latitude")
    private Double latitude;

    /**
     * GPS longitude (-180 to 180)
     */
    @Column(name = "longitude")
    private Double longitude;

    /**
     * IANA timezone (e.g., "Europe/Berlin", "Asia/Damascus")
     */
    @Column(name = "time_zone", length = 50)
    private String timeZone;

    /**
     * JSONB field for tenant-specific custom fields.
     * Example: {"capacity": 1000, "manager": "John Doe", "operatingHours": "9-17"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_data", columnDefinition = "jsonb")
    private Map<String, Object> customData;

    /**
     * One-to-many relationship with warehouse language translations.
     * Lazy loading to avoid loading all translations unless needed.
     */
    @OneToMany(mappedBy = "warehouse", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<WarehouseLanguageEntity> translations;

    /**
     * Pre-persist callback to set defaults
     */
    @PrePersist
    @Override
    protected void prePersist() {
        super.prePersist();
        // Additional warehouse-specific defaults can be set here
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


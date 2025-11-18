package com.care.warehouse.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

/**
 * Entity representing a brand/manufacturer.
 * 
 * Features:
 * - Multi-tenant support (tenant_id)
 * - Multilingual names (JSONB)
 * - Country of origin
 * - Custom attributes (JSONB)
 * - Soft delete and audit fields
 */
@Entity
@Table(
    name = "brands",
    schema = "public",
    indexes = {
        @Index(name = "ix_brands_tenant_deleted", columnList = "tenant_id, is_deleted"),
        @Index(name = "ix_brands_country_origin", columnList = "country_origin"),
        @Index(name = "ix_brands_tenant_country", columnList = "tenant_id, country_origin")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandEntity extends BaseEntity {

    /**
     * Multilingual brand names stored as JSONB.
     * Structure: {"en": "Brand Name", "ar": "اسم العلامة التجارية", "fr": "Nom de la marque"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "name_translations", nullable = false, columnDefinition = "jsonb")
    private Map<String, String> nameTranslations;

    /**
     * Country of origin.
     * Can be 2-letter ISO country code (e.g., "US", "DE") or UUID reference to country entity.
     */
    @Column(name = "country_origin", length = 50)
    private String countryOrigin;

    /**
     * JSONB field for tenant-specific custom attributes.
     * Example: {"foundedYear": 1990, "headquarters": "New York", "website": "https://example.com"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_attributes", columnDefinition = "jsonb")
    private Map<String, Object> customAttributes;

    /**
     * Pre-persist callback to set defaults
     */
    @PrePersist
    @Override
    protected void prePersist() {
        super.prePersist();
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


package com.care.warehouse.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * Entity for multilingual warehouse names and descriptions.
 * 
 * This entity stores translations for warehouse information in different languages.
 * Pattern follows the same structure as CodeTableLanguageEntity and CodeTableValueLanguageEntity
 * from access-management-service.
 * 
 * Each warehouse can have multiple language entries (one per language).
 * The combination of warehouse_id + language_code must be unique.
 */
@Entity
@Table(
    name = "warehouse_language",
    schema = "public",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_warehouse_language_warehouse_lang",
            columnNames = {"warehouse_id", "language_code"}
        )
    },
    indexes = {
        @Index(name = "ix_warehouse_language_tenant", columnList = "tenant_id, is_deleted"),
        @Index(name = "ix_warehouse_language_warehouse", columnList = "warehouse_id"),
        @Index(name = "ix_warehouse_language_lang", columnList = "language_code")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseLanguageEntity extends BaseEntity {

    /**
     * Foreign key to warehouse.
     * Cascade delete: if warehouse is deleted, all translations are deleted.
     */
    @Column(name = "warehouse_id", nullable = false, updatable = false)
    private UUID warehouseId;

    /**
     * Reference to warehouse entity (read-only, for JPA relationship).
     * insertable = false, updatable = false to avoid circular dependency.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", insertable = false, updatable = false)
    private WarehouseEntity warehouse;

    /**
     * ISO 639-1 language code (e.g., "en", "ar", "fr").
     * Must be at least 2 characters.
     */
    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode;

    /**
     * Translated warehouse name.
     */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /**
     * Translated warehouse description.
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Pre-persist callback to set defaults
     */
    @PrePersist
    @Override
    protected void prePersist() {
        super.prePersist();
        // Additional language-specific defaults can be set here
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


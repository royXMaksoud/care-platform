package com.care.warehouse.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

/**
 * Entity representing a category in a hierarchical tree structure.
 * 
 * Features:
 * - Multi-tenant support (tenant_id)
 * - Multilingual names (JSONB)
 * - Recursive parent-child structure
 * - Level tracking (depth in tree)
 * - Path tracking (full path from root)
 * - Soft delete and audit fields
 */
@Entity
@Table(
    name = "categories",
    schema = "public",
    indexes = {
        @Index(name = "ix_categories_tenant_deleted", columnList = "tenant_id, is_deleted"),
        @Index(name = "ix_categories_parent", columnList = "parent_id"),
        @Index(name = "ix_categories_root", columnList = "tenant_id, parent_id"),
        @Index(name = "ix_categories_level", columnList = "level"),
        @Index(name = "ix_categories_path", columnList = "path"),
        @Index(name = "ix_categories_tenant_parent", columnList = "tenant_id, parent_id")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryEntity extends BaseEntity {

    /**
     * Multilingual category names stored as JSONB.
     * Structure: {"en": "Category Name", "ar": "اسم الفئة", "fr": "Nom de la catégorie"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "name_translations", nullable = false, columnDefinition = "jsonb")
    private Map<String, String> nameTranslations;

    /**
     * Parent category ID (nullable for root categories).
     * Root categories have parentId = null.
     */
    @Column(name = "parent_id")
    private UUID parentId;

    /**
     * Level in the tree hierarchy (0 = root, 1 = first level, etc.).
     * Automatically calculated based on parent's level.
     */
    @Column(name = "level", nullable = false)
    @Builder.Default
    private Integer level = 0;

    /**
     * Full path from root to this category.
     * Format: "/root-id/child-id/grandchild-id" or "/root-id" for root categories.
     * Used for efficient tree queries and preventing circular references.
     */
    @Column(name = "path", length = 2000)
    private String path;

    /**
     * Pre-persist callback to set defaults
     */
    @PrePersist
    @Override
    protected void prePersist() {
        super.prePersist();
        if (level == null) {
            level = 0;
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


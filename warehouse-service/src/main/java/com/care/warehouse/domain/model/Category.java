package com.care.warehouse.domain.model;

import lombok.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Domain model for Category aggregate.
 * 
 * This represents a category in a hierarchical tree structure.
 * Categories can have parent categories, forming a tree.
 * 
 * Features:
 * - Multi-tenant support (tenantId)
 * - Multilingual names (JSONB)
 * - Recursive parent-child structure
 * - Level tracking (depth in tree)
 * - Path tracking (full path from root)
 * - Soft delete and audit fields
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Category {
    
    /** Unique identifier for the category */
    private UUID id;
    
    /** Tenant ID for multi-tenant isolation */
    private UUID tenantId;
    
    /**
     * Multilingual category names.
     * Structure: {"en": "Category Name", "ar": "اسم الفئة", "fr": "Nom de la catégorie"}
     */
    private Map<String, String> nameTranslations;
    
    /**
     * Parent category ID (nullable for root categories).
     * Root categories have parentId = null.
     */
    private UUID parentId;
    
    /**
     * Level in the tree hierarchy (0 = root, 1 = first level, etc.).
     * Automatically calculated based on parent's level.
     */
    private Integer level;
    
    /**
     * Full path from root to this category.
     * Format: "/root-id/child-id/grandchild-id" or "/root-id" for root categories.
     * Used for efficient tree queries and preventing circular references.
     */
    private String path;
    
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


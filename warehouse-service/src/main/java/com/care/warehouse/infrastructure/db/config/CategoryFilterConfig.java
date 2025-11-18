package com.care.warehouse.infrastructure.db.config;

import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * Configuration for category filtering and sorting.
 * 
 * Defines:
 * - ALLOWED_FIELDS: Fields that can be used in filter criteria
 * - SORTABLE: Fields that can be used for sorting
 * - DEFAULT_PAGE_SIZE: Default page size for pagination
 * 
 * This configuration is used by GenericSpecificationBuilder to build
 * dynamic JPA Specifications for filtering categories.
 */
@NoArgsConstructor
public final class CategoryFilterConfig {

    /**
     * Allowed fields for filtering.
     * 
     * These fields can be used in FilterRequest criteria:
     * - id: Category ID
     * - tenantId: Tenant ID (automatically added, but listed for completeness)
     * - parentId: Parent category ID (for filtering children)
     * - level: Tree level/depth
     * - isActive: Active status
     * - isDeleted: Deleted status (automatically filtered, but listed for completeness)
     * - createdAt: Creation timestamp
     * - createdById: Creator user ID
     * 
     * Note: nameTranslations is not in this list because it's a JSONB field
     * and requires special handling via native queries.
     */
    public static final Set<String> ALLOWED_FIELDS = Set.of(
            "id",
            "tenantId",
            "parentId",
            "level",
            "isActive",
            "isDeleted",
            "createdAt",
            "createdById"
    );

    /**
     * Sortable fields.
     * 
     * These fields can be used for sorting in Pageable:
     * - level: Sort by tree depth
     * - createdAt: Sort by creation date
     * - isActive: Sort by active status
     */
    public static final List<String> SORTABLE = List.of(
            "level",
            "createdAt",
            "isActive"
    );

    /**
     * Default page size for pagination.
     * Used when no page size is specified in the request.
     */
    public static final int DEFAULT_PAGE_SIZE = 20;
}


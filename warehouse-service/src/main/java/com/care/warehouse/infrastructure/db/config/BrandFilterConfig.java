package com.care.warehouse.infrastructure.db.config;

import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * Configuration for brand filtering.
 * Defines allowed fields for filtering and sorting.
 */
@NoArgsConstructor
public final class BrandFilterConfig {

    /**
     * Allowed fields for filtering.
     */
    public static final Set<String> ALLOWED_FIELDS = Set.of(
            "id",
            "tenantId",
            "countryOrigin",
            "isActive",
            "isDeleted",
            "createdAt",
            "createdById",
            "nameTranslations",
            "customAttributes"
    );

    /**
     * Sortable fields.
     */
    public static final List<String> SORTABLE = List.of(
            "countryOrigin",
            "createdAt",
            "isActive"
    );

    /**
     * Default page size for pagination.
     */
    public static final int DEFAULT_PAGE_SIZE = 10;
}


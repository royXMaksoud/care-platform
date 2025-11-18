package com.care.warehouse.infrastructure.db.config;

import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * Configuration for material filtering.
 * Defines allowed fields for filtering and sorting.
 */
@NoArgsConstructor
public final class MaterialFilterConfig {

    /**
     * Allowed fields for filtering.
     */
    public static final Set<String> ALLOWED_FIELDS = Set.of(
            "id",
            "tenantId",
            "code",
            "categoryId",
            "brandId",
            "isTrackable",
            "status",
            "isActive",
            "isDeleted",
            "createdAt",
            "createdById",
            "nameTranslations",
            "descriptionTranslations",
            "determiners",
            "customAttributes"
    );

    /**
     * Sortable fields.
     */
    public static final List<String> SORTABLE = List.of(
            "code",
            "categoryId",
            "brandId",
            "status",
            "isTrackable",
            "createdAt",
            "isActive"
    );

    /**
     * Default page size for pagination.
     */
    public static final int DEFAULT_PAGE_SIZE = 10;
}


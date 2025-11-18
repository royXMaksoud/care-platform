package com.care.warehouse.infrastructure.db.config;

import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * Configuration for warehouse filtering.
 * Defines allowed fields for filtering and sorting.
 */
@NoArgsConstructor
public final class WarehouseFilterConfig {

    /**
     * Allowed fields for filtering.
     */
    public static final Set<String> ALLOWED_FIELDS = Set.of(
            "id",
            "tenantId",
            "code",
            "warehouseType",
            "parentWarehouseId",
            "countryId",
            "locationId",
            "city",
            "state",
            "postalCode",
            "countryCode",
            "latitude",
            "longitude",
            "isActive",
            "isDeleted",
            "createdAt",
            "createdById",
            "nameTranslations",
            "descriptionTranslations"
    );

    /**
     * Sortable fields.
     */
    public static final List<String> SORTABLE = List.of(
            "code",
            "warehouseType",
            "city",
            "createdAt",
            "isActive"
    );

    /**
     * Default page size for pagination.
     */
    public static final int DEFAULT_PAGE_SIZE = 10;
}


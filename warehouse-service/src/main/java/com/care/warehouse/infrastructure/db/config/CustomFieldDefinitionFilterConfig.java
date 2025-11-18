package com.care.warehouse.infrastructure.db.config;

import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * Configuration for custom field definition filtering.
 */
@NoArgsConstructor
public final class CustomFieldDefinitionFilterConfig {

    public static final Set<String> ALLOWED_FIELDS = Set.of(
            "id",
            "tenantId",
            "entityType",
            "fieldKey",
            "fieldType",
            "isRequired",
            "isGlobal",
            "isActive",
            "isDeleted",
            "createdAt",
            "createdById",
            "labelTranslations",
            "validationRules"
    );

    public static final List<String> SORTABLE = List.of(
            "entityType",
            "fieldKey",
            "fieldType",
            "createdAt",
            "isActive"
    );

    public static final int DEFAULT_PAGE_SIZE = 10;
}


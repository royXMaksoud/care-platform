package com.care.warehouse.web.dto.customfielddefinition;

import com.care.warehouse.domain.enums.CustomFieldType;
import com.care.warehouse.domain.enums.EntityType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO returned from API when a CustomFieldDefinition is retrieved.
 */
@Getter
@Builder
public class CustomFieldDefinitionResponse {

    private UUID id;
    private UUID tenantId;
    private EntityType entityType;
    private String fieldKey;
    
    /**
     * Multilingual field labels.
     */
    private Map<String, String> labelTranslations;
    
    /**
     * Resolved display label based on current user language.
     */
    private String displayLabel;
    
    private CustomFieldType fieldType;
    private Boolean isRequired;
    private Boolean isGlobal;
    private Map<String, Object> validationRules;
    
    // Audit fields
    private Boolean isActive;
    private Boolean isDeleted;
    private UUID createdById;
    private Instant createdAt;
    private UUID updatedById;
    private Instant updatedAt;
    private Long rowVersion;
}


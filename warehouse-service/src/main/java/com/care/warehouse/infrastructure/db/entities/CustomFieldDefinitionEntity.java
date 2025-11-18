package com.care.warehouse.infrastructure.db.entities;

import com.care.warehouse.domain.enums.CustomFieldDataType;
import com.care.warehouse.domain.enums.EntityType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * JPA Entity representing a custom field definition.
 * 
 * Maps to the `custom_field_definition` table in PostgreSQL.
 * 
 * This entity stores metadata for custom fields that can be attached to
 * different entity types. It defines the schema, validation rules, and
 * multilingual labels for dynamic fields.
 * 
 * **Key Features**:
 * - Multi-tenant support via tenant_id
 * - Entity-type specific definitions
 * - JSONB fields for multilingual labels and allowed values
 * - Flexible data types with validation constraints
 * 
 * @author CARE Team
 */
@Entity
@Table(
    name = "custom_field_definition",
    schema = "public",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_custom_field_definition_tenant_entity_key",
            columnNames = {"tenant_id", "entity_type", "field_key"}
        )
    },
    indexes = {
        @Index(name = "ix_custom_field_definition_tenant_deleted", 
               columnList = "tenant_id, is_deleted"),
        @Index(name = "ix_custom_field_definition_entity_type", 
               columnList = "entity_type"),
        @Index(name = "ix_custom_field_definition_tenant_entity", 
               columnList = "tenant_id, entity_type"),
        @Index(name = "ix_custom_field_definition_active", 
               columnList = "tenant_id, entity_type, is_active")
    }
)
@AttributeOverrides({
    @AttributeOverride(name = "id", column = @Column(name = "field_id", nullable = false, updatable = false))
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldDefinitionEntity extends BaseEntity {

    /**
     * Entity type this field applies to.
     * Examples: MATERIAL, WAREHOUSE, ORDER, CUSTOMER
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 50)
    private EntityType entityType;

    /**
     * Unique key for the field within entity type and tenant.
     * Example: "warranty_period", "manufacturing_date"
     */
    @Column(name = "field_key", nullable = false, length = 100)
    private String fieldKey;

    /**
     * Multilingual field labels stored as JSONB.
     * Structure: {"en": "Warranty Period", "ar": "فترة الضمان"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "label_translations", nullable = false, columnDefinition = "jsonb")
    private Map<String, String> labelTranslations;

    /**
     * Data type of the field value.
     * Determines validation rules and UI input type.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, length = 50)
    private CustomFieldDataType dataType;

    /**
     * Whether this field is required.
     */
    @Column(name = "is_required", nullable = false)
    @Builder.Default
    private Boolean isRequired = false;

    /**
     * Allowed values for ENUM and LIST fields.
     * Structure: [
     *   {"code": "Samsung", "label": {"en": "Samsung", "ar": "سامسونغ"}},
     *   {"code": "Apple", "label": {"en": "Apple", "ar": "أبل"}}
     * ]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allowed_values", columnDefinition = "jsonb")
    private List<Map<String, Object>> allowedValues;

    /**
     * Minimum value for NUMBER/DECIMAL, or min_length for TEXT, or min_date for DATE/DATETIME.
     */
    @Column(name = "min_value", precision = 20, scale = 6)
    private BigDecimal minValue;

    /**
     * Maximum value for NUMBER/DECIMAL, or max_length for TEXT, or max_date for DATE/DATETIME.
     */
    @Column(name = "max_value", precision = 20, scale = 6)
    private BigDecimal maxValue;

    /**
     * Regular expression pattern for STRING field validation.
     * If provided, string values must match this pattern.
     * Example: "^[A-Z0-9]+$" for alphanumeric uppercase
     */
    @Column(name = "regex_pattern", length = 500)
    private String regexPattern;

    /**
     * Sort order for UI display.
     * Lower numbers appear first.
     */
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    /**
     * Whether this field definition is active.
     * Inactive fields are not shown in UI.
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @PrePersist
    @Override
    protected void prePersist() {
        super.prePersist();
        if (sortOrder == null) {
            sortOrder = 0;
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    @Override
    protected void preUpdate() {
        super.preUpdate();
    }
}

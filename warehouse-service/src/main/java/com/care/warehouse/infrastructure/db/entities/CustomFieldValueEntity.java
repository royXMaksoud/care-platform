package com.care.warehouse.infrastructure.db.entities;

import com.care.warehouse.domain.enums.EntityType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * JPA Entity representing a custom field value.
 * 
 * Maps to the `custom_field_value` table in PostgreSQL.
 * 
 * This entity stores the actual values for custom fields on entity records.
 * Each row represents one custom field value for one entity record.
 * 
 * **Key Features**:
 * - Multi-tenant support via tenant_id
 * - Entity-type and record reference
 * - Field definition reference (foreign key)
 * - Flexible value storage (JSONB)
 * - Unique constraint: (tenant_id, entity_type, entity_record_id, field_id)
 * 
 * **Value Storage**:
 * The `value` field is stored as JSONB to support different data types:
 * - TEXT: "string value"
 * - NUMBER: 123
 * - DECIMAL: 123.45
 * - DATE: "2024-01-15"
 * - DATETIME: "2024-01-15T10:30:00Z"
 * - BOOLEAN: true
 * - DROPDOWN_SINGLE: "option_key"
 * - DROPDOWN_MULTI: ["option1", "option2"]
 * - FILE: "file://path/to/file" or UUID
 * - JSON: {"key": "value"}
 * 
 * @author CARE Team
 */
@Entity
@Table(
    name = "custom_field_value",
    schema = "public",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_custom_field_value_unique",
            columnNames = {"tenant_id", "entity_type", "entity_record_id", "field_id"}
        )
    },
    indexes = {
        @Index(name = "ix_custom_field_value_tenant", columnList = "tenant_id"),
        @Index(name = "ix_custom_field_value_entity_record", 
               columnList = "tenant_id, entity_type, entity_record_id"),
        @Index(name = "ix_custom_field_value_field", columnList = "field_id"),
        @Index(name = "ix_custom_field_value_entity_field", 
               columnList = "tenant_id, entity_type, field_id"),
        @Index(name = "ix_custom_field_value_record_lookup", 
               columnList = "entity_type, entity_record_id")
    }
)
@AttributeOverrides({
    @AttributeOverride(name = "id", column = @Column(name = "value_id", nullable = false, updatable = false))
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldValueEntity extends BaseEntity {

    /**
     * Entity type this value belongs to.
     * Examples: MATERIAL, WAREHOUSE, ORDER, CUSTOMER
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 50)
    private EntityType entityType;

    /**
     * ID of the entity record this value belongs to.
     * Example: If entityType is MATERIAL, this is the Material's ID.
     */
    @Column(name = "entity_record_id", nullable = false)
    private UUID entityRecordId;

    /**
     * Reference to CustomFieldDefinition.
     * Foreign key to custom_field_definition.id
     * Cascade delete: if definition is deleted, values are also deleted
     */
    @Column(name = "field_id", nullable = false)
    private UUID fieldId;

    /**
     * The actual field value stored as JSONB.
     * 
     * Structure depends on the field's dataType:
     * - TEXT: String
     * - NUMBER: Number (Integer or Long)
     * - DECIMAL: Number (Double or BigDecimal)
     * - DATE: String (ISO date format)
     * - DATETIME: String (ISO datetime format)
     * - BOOLEAN: Boolean
     * - DROPDOWN_SINGLE: String (option key)
     * - DROPDOWN_MULTI: List<String> (option keys)
     * - FILE: String (file reference)
     * - JSON: Map<String, Object> or any JSON structure
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "value", nullable = false, columnDefinition = "jsonb")
    private Object value;

    @PrePersist
    @Override
    protected void prePersist() {
        super.prePersist();
    }

    @PreUpdate
    @Override
    protected void preUpdate() {
        super.preUpdate();
    }
}


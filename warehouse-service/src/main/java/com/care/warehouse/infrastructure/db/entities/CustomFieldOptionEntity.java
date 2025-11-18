package com.care.warehouse.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

/**
 * Entity representing a custom field option for dropdown fields.
 */
@Entity
@Table(
    name = "custom_field_options",
    schema = "public",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_custom_field_options_definition_key",
            columnNames = {"definition_id", "value_key"}
        )
    },
    indexes = {
        @Index(name = "ix_custom_field_options_definition", columnList = "definition_id"),
        @Index(name = "ix_custom_field_options_sort", columnList = "definition_id, sort_order")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldOptionEntity extends BaseEntity {

    @Column(name = "definition_id", nullable = false)
    private UUID definitionId;

    @Column(name = "value_key", nullable = false, length = 100)
    private String valueKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "value_translations", nullable = false, columnDefinition = "jsonb")
    private Map<String, String> valueTranslations;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

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


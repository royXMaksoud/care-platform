package com.care.warehouse.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

/**
 * Entity representing an order item.
 */
@Entity
@Table(
    name = "order_items",
    schema = "public",
    indexes = {
        @Index(name = "ix_order_items_order", columnList = "order_id"),
        @Index(name = "ix_order_items_material", columnList = "material_id"),
        @Index(name = "ix_order_items_order_material", columnList = "order_id, material_id")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemEntity {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "qty_requested", nullable = false)
    @Builder.Default
    private Double qtyRequested = 0.0;

    @Column(name = "qty_approved")
    private Double qtyApproved;

    @Column(name = "qty_fulfilled")
    @Builder.Default
    private Double qtyFulfilled = 0.0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_data", columnDefinition = "jsonb")
    private Map<String, Object> customData;
}


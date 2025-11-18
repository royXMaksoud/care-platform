package com.care.warehouse.infrastructure.db.entities;

import com.care.warehouse.domain.enums.OrderStatus;
import com.care.warehouse.domain.enums.OrderType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Entity representing an order (consumption or replenishment).
 */
@Entity
@Table(
    name = "orders_master",
    schema = "public",
    indexes = {
        @Index(name = "ix_orders_master_tenant_deleted", columnList = "tenant_id, is_deleted"),
        @Index(name = "ix_orders_master_warehouse", columnList = "warehouse_id"),
        @Index(name = "ix_orders_master_status", columnList = "status"),
        @Index(name = "ix_orders_master_tenant_type_status", columnList = "tenant_id, type, status"),
        @Index(name = "ix_orders_master_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderEntity extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private OrderType type;

    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_data", columnDefinition = "jsonb")
    private Map<String, Object> customData;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "fulfilled_by_id")
    private UUID fulfilledById;

    @Column(name = "fulfilled_at")
    private Instant fulfilledAt;

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


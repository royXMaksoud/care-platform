package com.care.warehouse.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing stock levels for a material in a specific warehouse.
 */
@Entity
@Table(
    name = "warehouse_material_stock",
    schema = "public",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_warehouse_material_stock_unique",
            columnNames = {"tenant_id", "material_id", "warehouse_id", "lot_number"}
        )
    },
    indexes = {
        @Index(name = "ix_warehouse_material_stock_tenant_deleted", columnList = "tenant_id, is_deleted"),
        @Index(name = "ix_warehouse_material_stock_material", columnList = "material_id"),
        @Index(name = "ix_warehouse_material_stock_warehouse", columnList = "warehouse_id"),
        @Index(name = "ix_warehouse_material_stock_material_warehouse", columnList = "material_id, warehouse_id"),
        @Index(name = "ix_warehouse_material_stock_tenant_material", columnList = "tenant_id, material_id"),
        @Index(name = "ix_warehouse_material_stock_reorder", columnList = "tenant_id, reorder_level"),
        @Index(name = "ix_warehouse_material_stock_expiry", columnList = "expiry_date"),
        @Index(name = "ix_warehouse_material_stock_lot", columnList = "lot_number")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseMaterialStockEntity extends BaseEntity {

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;

    @Column(name = "stock_current", nullable = false)
    @Builder.Default
    private Double stockCurrent = 0.0;

    @Column(name = "stock_reserved", nullable = false)
    @Builder.Default
    private Double stockReserved = 0.0;

    @Column(name = "reorder_level")
    private Double reorderLevel;

    @Column(name = "expiry_date")
    private Instant expiryDate;

    @Column(name = "lot_number", length = 100)
    private String lotNumber;

    @Column(name = "bin_location_code", length = 50)
    private String binLocationCode;

    @PrePersist
    @Override
    protected void prePersist() {
        super.prePersist();
        if (stockCurrent == null) stockCurrent = 0.0;
        if (stockReserved == null) stockReserved = 0.0;
    }

    @PreUpdate
    @Override
    protected void preUpdate() {
        super.preUpdate();
    }
}


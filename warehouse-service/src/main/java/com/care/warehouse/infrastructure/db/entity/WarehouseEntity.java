package com.care.warehouse.infrastructure.db.entity;

import com.care.warehouse.domain.model.Warehouse;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * JPA Entity for Warehouse
 */
@Entity
@Table(name = "warehouses", indexes = {
    @Index(name = "idx_warehouse_tenant_code", columnList = "tenant_id, code", unique = false),
    @Index(name = "idx_warehouse_tenant_status", columnList = "tenant_id, status"),
    @Index(name = "idx_warehouse_is_primary", columnList = "tenant_id, is_primary")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", nullable = false, length = 20)
    private String status;  // ACTIVE, INACTIVE, MAINTENANCE

    @Column(name = "capacity_cubic_meters", nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityCubicMeters;

    @Column(name = "current_occupancy_cubic_meters", precision = 10, scale = 2)
    private BigDecimal currentOccupancyCubicMeters;

    @Column(name = "is_primary")
    private Boolean isPrimary;

    @Type(JsonBinaryType.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Version
    @Column(name = "row_version")
    private Integer rowVersion;

    // ==================== Lifecycle Hooks ====================

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isDeleted = false;
        this.isPrimary = this.isPrimary != null ? this.isPrimary : false;
        this.currentOccupancyCubicMeters = this.currentOccupancyCubicMeters != null ? 
            this.currentOccupancyCubicMeters : BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

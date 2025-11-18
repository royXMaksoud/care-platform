package com.care.warehouse.infrastructure.db.entity;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;
import org.hibernate.type.BasicType;
import org.hibernate.annotations.TypeDef;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "zones", indexes = {
    @Index(name = "idx_zone_warehouse_code", columnList = "warehouse_id, code", unique = false),
    @Index(name = "idx_zone_warehouse_type", columnList = "warehouse_id, zone_type"),
    @Index(name = "idx_zone_warehouse_status", columnList = "warehouse_id, status")
})
@TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false)
    private UUID warehouseId;
    
    @Column(nullable = false, length = 50)
    private String code;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Column(nullable = false, length = 20)
    private String zoneType; // RECEIVING, STORAGE, PICKING, PACKING, SHIPPING
    
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, MAINTENANCE
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityCubicMeters;
    
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal currentOccupancyCubicMeters = BigDecimal.ZERO;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean temperatureControlled = false;
    
    @Column(nullable = true, precision = 5, scale = 2)
    private BigDecimal temperatureMin;
    
    @Column(nullable = true, precision = 5, scale = 2)
    private BigDecimal temperatureMax;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
    
    @Version
    @Builder.Default
    private Integer rowVersion = 0;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        isDeleted = false;
        status = status != null ? status : "ACTIVE";
        temperatureControlled = temperatureControlled != null ? temperatureControlled : false;
        currentOccupancyCubicMeters = currentOccupancyCubicMeters != null ? currentOccupancyCubicMeters : BigDecimal.ZERO;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

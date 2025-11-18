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
@Table(name = "bins", indexes = {
    @Index(name = "idx_bin_zone_code", columnList = "zone_id, code", unique = false),
    @Index(name = "idx_bin_zone_status", columnList = "zone_id, status"),
    @Index(name = "idx_bin_barcode", columnList = "barcode", unique = false),
    @Index(name = "idx_bin_location", columnList = "aisle_number, shelf_number, level_number")
})
@TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BinEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false)
    private UUID zoneId;
    
    @Column(nullable = false, length = 50)
    private String code;
    
    @Column(nullable = true, length = 255)
    private String name;
    
    @Column(nullable = false, length = 20)
    private String binType; // PALLET, SHELF, RACK, CAGE, DRAWER
    
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
    
    @Column(nullable = true, precision = 10, scale = 2)
    private BigDecimal maxWeightKg;
    
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal currentWeightKg = BigDecimal.ZERO;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityCubicMeters;
    
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal currentOccupancyCubicMeters = BigDecimal.ZERO;
    
    @Column(nullable = true)
    private Integer aisleNumber;
    
    @Column(nullable = true)
    private Integer shelfNumber;
    
    @Column(nullable = true)
    private Integer levelNumber;
    
    @Column(nullable = true, length = 100)
    private String barcode;
    
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
        status = status != null ? status : "AVAILABLE";
        currentWeightKg = currentWeightKg != null ? currentWeightKg : BigDecimal.ZERO;
        currentOccupancyCubicMeters = currentOccupancyCubicMeters != null ? currentOccupancyCubicMeters : BigDecimal.ZERO;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

package com.care.warehouse.web.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneResponse {
    
    private UUID id;
    private UUID tenantId;
    private UUID warehouseId;
    private String code;
    private String name;
    private String zoneType;
    private String status;
    private BigDecimal capacityCubicMeters;
    private BigDecimal currentOccupancyCubicMeters;
    private BigDecimal availableCapacityCubicMeters;
    private Double utilizationPercentage;
    private Boolean temperatureControlled;
    private BigDecimal temperatureMin;
    private BigDecimal temperatureMax;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
    
    private Integer rowVersion;
}

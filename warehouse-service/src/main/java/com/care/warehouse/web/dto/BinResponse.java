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
public class BinResponse {
    
    private UUID id;
    private UUID tenantId;
    private UUID zoneId;
    private String code;
    private String name;
    private String binType;
    private String status;
    private BigDecimal maxWeightKg;
    private BigDecimal currentWeightKg;
    private BigDecimal capacityCubicMeters;
    private BigDecimal currentOccupancyCubicMeters;
    private BigDecimal availableCapacityCubicMeters;
    private Double utilizationPercentage;
    private Integer aisleNumber;
    private Integer shelfNumber;
    private Integer levelNumber;
    private String barcode;
    private String locationString;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
    
    private Integer rowVersion;
}

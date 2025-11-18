package com.care.warehouse.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneRequest {
    
    @NotNull(message = "Warehouse ID is required")
    private UUID warehouseId;
    
    @NotBlank(message = "Code is required")
    @Size(min = 2, max = 50, message = "Code must be between 2 and 50 characters")
    private String code;
    
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 255, message = "Name must be between 2 and 255 characters")
    private String name;
    
    @NotBlank(message = "Zone type is required")
    @Pattern(regexp = "RECEIVING|STORAGE|PICKING|PACKING|SHIPPING", message = "Zone type must be RECEIVING, STORAGE, PICKING, PACKING, or SHIPPING")
    private String zoneType;
    
    @Pattern(regexp = "ACTIVE|INACTIVE|MAINTENANCE", message = "Status must be ACTIVE, INACTIVE, or MAINTENANCE")
    @Builder.Default
    private String status = "ACTIVE";
    
    @NotNull(message = "Capacity is required")
    @DecimalMin(value = "0.01", message = "Capacity must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Capacity must be a valid decimal number")
    private BigDecimal capacityCubicMeters;
    
    @Builder.Default
    private Boolean temperatureControlled = false;
    
    @DecimalMin(value = "-50.00", message = "Temperature minimum must be valid")
    private BigDecimal temperatureMin;
    
    @DecimalMax(value = "60.00", message = "Temperature maximum must be valid")
    private BigDecimal temperatureMax;
}

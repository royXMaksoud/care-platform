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
public class BinRequest {
    
    @NotNull(message = "Zone ID is required")
    private UUID zoneId;
    
    @NotBlank(message = "Code is required")
    @Size(min = 2, max = 50, message = "Code must be between 2 and 50 characters")
    private String code;
    
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;
    
    @NotBlank(message = "Bin type is required")
    @Pattern(regexp = "PALLET|SHELF|RACK|CAGE|DRAWER", message = "Bin type must be PALLET, SHELF, RACK, CAGE, or DRAWER")
    private String binType;
    
    @Pattern(regexp = "AVAILABLE|OCCUPIED|RESERVED|MAINTENANCE", message = "Status must be AVAILABLE, OCCUPIED, RESERVED, or MAINTENANCE")
    @Builder.Default
    private String status = "AVAILABLE";
    
    @DecimalMin(value = "0.01", message = "Max weight must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Max weight must be a valid decimal number")
    private BigDecimal maxWeightKg;
    
    @NotNull(message = "Capacity is required")
    @DecimalMin(value = "0.01", message = "Capacity must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Capacity must be a valid decimal number")
    private BigDecimal capacityCubicMeters;
    
    @Min(value = 0, message = "Aisle number must be positive")
    private Integer aisleNumber;
    
    @Min(value = 0, message = "Shelf number must be positive")
    private Integer shelfNumber;
    
    @Min(value = 0, message = "Level number must be positive")
    private Integer levelNumber;
    
    @Size(max = 100, message = "Barcode must not exceed 100 characters")
    private String barcode;
}

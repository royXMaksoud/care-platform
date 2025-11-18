package com.care.warehouse.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseRequest {
    
    @NotBlank(message = "Code is required")
    @Size(min = 2, max = 50, message = "Code must be between 2 and 50 characters")
    private String code;
    
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 255, message = "Name must be between 2 and 255 characters")
    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    @Pattern(regexp = "ACTIVE|INACTIVE|MAINTENANCE", message = "Status must be ACTIVE, INACTIVE, or MAINTENANCE")
    @Builder.Default
    private String status = "ACTIVE";
    
    @NotNull(message = "Capacity is required")
    @DecimalMin(value = "0.01", message = "Capacity must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Capacity must be a valid decimal number")
    private BigDecimal capacityCubicMeters;
    
    @Builder.Default
    private Boolean isPrimary = false;
    
    private String metadata;
}

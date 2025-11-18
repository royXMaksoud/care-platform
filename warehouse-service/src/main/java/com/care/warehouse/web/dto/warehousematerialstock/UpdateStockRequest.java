package com.care.warehouse.web.dto.warehousematerialstock;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Request DTO used to update stock levels.
 */
@Getter
@Setter
public class UpdateStockRequest {

    @NotNull(message = "{stock.materialId.required}")
    private UUID materialId;

    @NotNull(message = "{stock.warehouseId.required}")
    private UUID warehouseId;

    @Min(value = 0, message = "{stock.current.min}")
    private Double stockCurrent;

    @Min(value = 0, message = "{stock.reserved.min}")
    private Double stockReserved;

    @Min(value = 0, message = "{stock.reorderLevel.min}")
    private Double reorderLevel;

    private Instant expiryDate;

    @Size(max = 100, message = "{stock.lotNumber.max}")
    private String lotNumber;

    @Size(max = 50, message = "{stock.binLocationCode.max}")
    private String binLocationCode;
}


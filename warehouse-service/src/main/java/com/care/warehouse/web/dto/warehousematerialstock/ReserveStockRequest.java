package com.care.warehouse.web.dto.warehousematerialstock;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Request DTO used to reserve stock.
 */
@Getter
@Setter
public class ReserveStockRequest {

    @NotNull(message = "{stock.materialId.required}")
    private UUID materialId;

    @NotNull(message = "{stock.warehouseId.required}")
    private UUID warehouseId;

    @NotNull(message = "{stock.quantity.required}")
    @Min(value = 0, message = "{stock.quantity.min}")
    private Double quantity;

    @Size(max = 100, message = "{stock.lotNumber.max}")
    private String lotNumber;

    @Size(max = 255, message = "{stock.reservationReference.max}")
    private String reservationReference;
}


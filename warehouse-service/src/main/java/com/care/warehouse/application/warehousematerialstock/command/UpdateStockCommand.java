package com.care.warehouse.application.warehousematerialstock.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Command object used to update stock levels.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStockCommand {
    
    private UUID materialId;
    private UUID warehouseId;
    private Double stockCurrent;
    private Double stockReserved;
    private Double reorderLevel;
    private Instant expiryDate;
    private String lotNumber;
    private String binLocationCode;
}


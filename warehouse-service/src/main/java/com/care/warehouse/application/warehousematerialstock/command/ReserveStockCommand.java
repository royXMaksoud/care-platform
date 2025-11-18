package com.care.warehouse.application.warehousematerialstock.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Command object used to reserve stock.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReserveStockCommand {
    
    private UUID materialId;
    private UUID warehouseId;
    private Double quantity;
    private String lotNumber; // Optional: reserve from specific lot
    private String reservationReference; // Order ID, etc.
}


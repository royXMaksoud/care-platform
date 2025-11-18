package com.care.warehouse.web.dto.stock;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for stock balance.
 * 
 * Contains current stock quantity for a material in a warehouse.
 * 
 * @author CARE Team
 */
@Getter
@Builder
public class StockBalanceResponse {
    
    private UUID warehouseId;
    private UUID materialId;
    private UUID tenantId;
    private BigDecimal quantity;
    private UUID lastTransactionId;
    private Instant updatedAt;
    private UUID updatedById;
}


package com.care.warehouse.web.dto.stock;

import com.care.warehouse.domain.enums.StockTransactionReason;
import com.care.warehouse.domain.enums.StockTransactionType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for stock transaction.
 * 
 * Contains all information about a stock transaction.
 * 
 * @author CARE Team
 */
@Getter
@Builder
public class StockTransactionResponse {
    
    private UUID transactionId;
    private UUID tenantId;
    private UUID materialId;
    private StockTransactionType transactionType;
    private UUID sourceWarehouseId;
    private UUID targetWarehouseId;
    private BigDecimal quantity;
    private StockTransactionReason reason;
    private String referenceDocument;
    private String notes;
    private UUID createdById;
    private Instant createdAt;
}


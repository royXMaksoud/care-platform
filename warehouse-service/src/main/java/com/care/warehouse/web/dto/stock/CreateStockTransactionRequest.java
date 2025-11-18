package com.care.warehouse.web.dto.stock;

import com.care.warehouse.domain.enums.StockTransactionReason;
import com.care.warehouse.domain.enums.StockTransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO for creating a stock transaction.
 * 
 * Contains all fields needed to create a stock transaction and update balances.
 * 
 * @author CARE Team
 */
@Getter
@Setter
public class CreateStockTransactionRequest {
    
    @NotNull(message = "{stock.materialId.required}")
    private UUID materialId;
    
    @NotNull(message = "{stock.transactionType.required}")
    private StockTransactionType transactionType;
    
    private UUID sourceWarehouseId;
    
    private UUID targetWarehouseId;
    
    @NotNull(message = "{stock.quantity.required}")
    @DecimalMin(value = "0.0001", message = "{stock.quantity.invalid}")
    private BigDecimal quantity;
    
    private StockTransactionReason reason;
    
    private String referenceDocument;
    
    private String notes;
}


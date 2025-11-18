package com.care.warehouse.application.stock.command;

import com.care.warehouse.domain.enums.StockTransactionReason;
import com.care.warehouse.domain.enums.StockTransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command object for creating a stock transaction.
 * 
 * This command contains all information needed to create a stock transaction
 * and update stock balances atomically.
 * 
 * **Validation Rules**:
 * - quantity must be > 0
 * - materialId must exist
 * - For IN: targetWarehouseId required
 * - For OUT: sourceWarehouseId required
 * - For TRANSFER: both required, source != target
 * - For ADJUSTMENT: at least one required
 * - For OUT/TRANSFER: sufficient stock must be available
 * 
 * @author CARE Team
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStockTransactionCommand {
    
    /**
     * Material involved in the transaction.
     * Reference to materials.id
     */
    private UUID materialId;
    
    /**
     * Type of transaction: IN, OUT, TRANSFER, or ADJUSTMENT.
     */
    private StockTransactionType transactionType;
    
    /**
     * Source warehouse (for OUT, TRANSFER, or ADJUSTMENT decrease).
     * Required for OUT and TRANSFER.
     * Optional for ADJUSTMENT (if decreasing stock).
     */
    private UUID sourceWarehouseId;
    
    /**
     * Target warehouse (for IN, TRANSFER, or ADJUSTMENT increase).
     * Required for IN and TRANSFER.
     * Optional for ADJUSTMENT (if increasing stock).
     */
    private UUID targetWarehouseId;
    
    /**
     * Quantity involved in the transaction.
     * Must be > 0.
     */
    private BigDecimal quantity;
    
    /**
     * Reason/classification for the transaction.
     * Examples: PURCHASE, SALE, CONSUMPTION, DONATION, etc.
     */
    private StockTransactionReason reason;
    
    /**
     * Optional reference to external document.
     * Examples: PO number, invoice number, order ID, etc.
     */
    private String referenceDocument;
    
    /**
     * Optional additional notes about the transaction.
     */
    private String notes;
}


package com.care.warehouse.domain.model;

import com.care.warehouse.domain.enums.StockTransactionReason;
import com.care.warehouse.domain.enums.StockTransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain model for Stock Transaction.
 * 
 * Represents a single stock movement event in the inventory ledger.
 * Every stock change (IN, OUT, TRANSFER, ADJUSTMENT) is recorded as a transaction.
 * 
 * **Key Features**:
 * - Complete audit trail of all stock movements
 * - Immutable once created (transactions are never modified, only created)
 * - Supports all transaction types: IN, OUT, TRANSFER, ADJUSTMENT
 * - Links to source/target warehouses based on transaction type
 * - Includes reason classification for reporting and analytics
 * - Optional reference document for traceability
 * 
 * **Transaction Type Logic**:
 * - IN: target_warehouse_id required, source_warehouse_id = null
 * - OUT: source_warehouse_id required, target_warehouse_id = null
 * - TRANSFER: both required, source != target
 * - ADJUSTMENT: at least one required (can be increase or decrease)
 * 
 * @author CARE Team
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StockTransaction {
    
    /**
     * Unique identifier for the transaction.
     * Generated automatically when transaction is created.
     */
    private UUID transactionId;
    
    /**
     * Tenant ID for multi-tenant isolation.
     * Automatically set from TenantContext, never from client.
     */
    private UUID tenantId;
    
    /**
     * Material involved in the transaction.
     * Reference to materials.id
     */
    private UUID materialId;
    
    /**
     * Type of transaction: IN, OUT, TRANSFER, or ADJUSTMENT.
     * Determines which warehouses are required and how balance is updated.
     */
    private StockTransactionType transactionType;
    
    /**
     * Source warehouse (for OUT, TRANSFER, or ADJUSTMENT decrease).
     * 
     * Required for:
     * - OUT: Warehouse from which stock is removed
     * - TRANSFER: Source warehouse
     * - ADJUSTMENT: Warehouse where stock is decreased (if decrease)
     * 
     * Null for:
     * - IN: Stock is added, no source needed
     */
    private UUID sourceWarehouseId;
    
    /**
     * Target warehouse (for IN, TRANSFER, or ADJUSTMENT increase).
     * 
     * Required for:
     * - IN: Warehouse where stock is added
     * - TRANSFER: Target warehouse
     * - ADJUSTMENT: Warehouse where stock is increased (if increase)
     * 
     * Null for:
     * - OUT: Stock is removed, no target needed
     */
    private UUID targetWarehouseId;
    
    /**
     * Quantity involved in the transaction.
     * Always positive (validated: quantity > 0).
     * 
     * For TRANSFER: This is the quantity moved from source to target.
     * For ADJUSTMENT: This is the absolute adjustment amount.
     */
    private BigDecimal quantity;
    
    /**
     * Reason/classification for the transaction.
     * Examples: PURCHASE, SALE, CONSUMPTION, DONATION, RETURN, etc.
     * Used for reporting and analytics.
     */
    private StockTransactionReason reason;
    
    /**
     * Optional reference to external document.
     * Examples: PO number, invoice number, order ID, etc.
     * Used for traceability and linking to external systems.
     */
    private String referenceDocument;
    
    /**
     * Optional additional notes about the transaction.
     * Free-form text for additional context.
     */
    private String notes;
    
    /**
     * User ID who created the transaction.
     * Automatically set from CurrentUserContext.
     */
    private UUID createdById;
    
    /**
     * Timestamp when the transaction was created.
     * Automatically set to current timestamp.
     */
    private Instant createdAt;
}


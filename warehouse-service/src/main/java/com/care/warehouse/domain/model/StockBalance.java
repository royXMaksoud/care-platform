package com.care.warehouse.domain.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain model for Stock Balance.
 * 
 * Represents the current stock quantity for a material in a warehouse.
 * This is a materialized view-like structure that is updated atomically
 * with stock transactions to provide fast balance queries.
 * 
 * **Key Features**:
 * - Composite primary key: (warehouseId, materialId)
 * - Maintained atomically with stock transactions
 * - Always reflects current available stock
 * - Links to last transaction for audit trail
 * 
 * **Balance Maintenance**:
 * The balance is updated by StockService when transactions are created:
 * - IN: Increment target warehouse balance
 * - OUT: Decrement source warehouse balance (with validation)
 * - TRANSFER: Decrement source + increment target (atomic)
 * - ADJUSTMENT: Adjust balance based on source/target
 * 
 * **Performance**:
 * This table enables fast balance queries without aggregating all transactions.
 * For audit trail, use stock_transaction table.
 * 
 * @author CARE Team
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StockBalance {
    
    /**
     * Warehouse ID (part of composite primary key).
     * Reference to warehouses.id
     */
    private UUID warehouseId;
    
    /**
     * Material ID (part of composite primary key).
     * Reference to materials.id
     */
    private UUID materialId;
    
    /**
     * Tenant ID for multi-tenant isolation.
     * Automatically set from TenantContext.
     */
    private UUID tenantId;
    
    /**
     * Current available stock quantity.
     * Always >= 0 (validated by database constraint).
     * 
     * This is the actual available stock, not including reserved stock.
     * For reserved stock, see warehouse_material_stock.stock_reserved.
     */
    private BigDecimal quantity;
    
    /**
     * Reference to the last stock transaction that updated this balance.
     * Used for audit trail and debugging.
     * Reference to stock_transaction.transaction_id
     */
    private UUID lastTransactionId;
    
    /**
     * Timestamp when the balance was last updated.
     * Automatically updated when balance changes.
     */
    private Instant updatedAt;
    
    /**
     * User ID who last updated the balance.
     * Automatically set from CurrentUserContext.
     */
    private UUID updatedById;
}


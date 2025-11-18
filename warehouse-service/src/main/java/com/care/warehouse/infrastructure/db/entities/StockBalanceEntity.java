package com.care.warehouse.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for stock_balance table.
 * 
 * Represents the current stock quantity for a material in a warehouse.
 * This is a materialized view-like structure that is updated atomically
 * with stock transactions to provide fast balance queries.
 * 
 * **Table**: stock_balance
 * **Primary Key**: Composite (warehouse_id, material_id)
 * 
 * **Important**: This entity does NOT extend BaseEntity because:
 * - It has a composite primary key (not single UUID id)
 * - It does not have isDeleted/isActive flags (balance is always current)
 * - It has different audit fields (updatedAt, updatedById only)
 * 
 * @author CARE Team
 */
@Entity
@Table(
    name = "stock_balance",
    schema = "public",
    indexes = {
        @Index(name = "ix_stock_balance_tenant", columnList = "tenant_id"),
        @Index(name = "ix_stock_balance_material", columnList = "material_id"),
        @Index(name = "ix_stock_balance_warehouse", columnList = "warehouse_id"),
        @Index(name = "ix_stock_balance_tenant_material", columnList = "tenant_id, material_id"),
        @Index(name = "ix_stock_balance_tenant_warehouse", columnList = "tenant_id, warehouse_id"),
        @Index(name = "ix_stock_balance_quantity", columnList = "quantity")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(StockBalanceEntity.StockBalanceId.class)
public class StockBalanceEntity {
    
    /**
     * Composite primary key class for stock_balance.
     * Required by JPA for composite primary keys.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class StockBalanceId implements java.io.Serializable {
        private UUID warehouseId;
        private UUID materialId;
    }
    
    /**
     * Warehouse ID (part of composite primary key).
     * Reference to warehouses.id (no FK constraint - cross-database reference)
     */
    @Id
    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;
    
    /**
     * Material ID (part of composite primary key).
     * Reference to materials.id (no FK constraint - cross-database reference)
     */
    @Id
    @Column(name = "material_id", nullable = false)
    private UUID materialId;
    
    /**
     * Tenant ID for multi-tenant isolation.
     * Automatically set from TenantContext.
     */
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    /**
     * Current available stock quantity.
     * Always >= 0 (validated by database constraint).
     * 
     * Stored as DECIMAL(18, 4) for precision.
     */
    @Column(name = "quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantity;
    
    /**
     * Reference to the last stock transaction that updated this balance.
     * Used for audit trail and debugging.
     * Reference to stock_transaction.transaction_id
     */
    @Column(name = "last_transaction_id")
    private UUID lastTransactionId;
    
    /**
     * Timestamp when the balance was last updated.
     * Automatically updated when balance changes.
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    
    /**
     * User ID who last updated the balance.
     * Automatically set from CurrentUserContext.
     */
    @Column(name = "updated_by_id")
    private UUID updatedById;
    
    /**
     * Pre-persist callback to set tenant ID and audit fields.
     */
    @PrePersist
    protected void prePersist() {
        // Set tenant ID from TenantContext if not already set
        if (tenantId == null) {
            tenantId = com.care.warehouse.application.common.context.TenantContext.get();
        }
        
        // Set updated by from CurrentUserContext if not already set
        if (updatedById == null) {
            com.sharedlib.core.context.CurrentUser currentUser = 
                com.sharedlib.core.context.CurrentUserContext.get();
            if (currentUser != null) {
                updatedById = currentUser.userId();
            }
        }
        
        // Set updated timestamp if not already set
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
        
        // Initialize quantity to 0 if null
        if (quantity == null) {
            quantity = BigDecimal.ZERO;
        }
    }
    
    /**
     * Pre-update callback to set audit fields.
     */
    @PreUpdate
    protected void preUpdate() {
        // Set updated by from CurrentUserContext
        com.sharedlib.core.context.CurrentUser currentUser = 
            com.sharedlib.core.context.CurrentUserContext.get();
        if (currentUser != null) {
            updatedById = currentUser.userId();
        }
    }
}


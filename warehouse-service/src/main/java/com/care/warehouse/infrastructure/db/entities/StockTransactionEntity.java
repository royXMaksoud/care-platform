package com.care.warehouse.infrastructure.db.entities;

import com.care.warehouse.domain.enums.StockTransactionReason;
import com.care.warehouse.domain.enums.StockTransactionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for stock_transaction table.
 * 
 * Represents a single stock movement event in the inventory ledger.
 * This entity is immutable once persisted - transactions are never modified,
 * only created for complete audit trail.
 * 
 * **Table**: stock_transaction
 * **Primary Key**: transaction_id (UUID)
 * 
 * @author CARE Team
 */
@Entity
@Table(
    name = "stock_transaction",
    schema = "public",
    indexes = {
        @Index(name = "ix_stock_transaction_tenant", columnList = "tenant_id"),
        @Index(name = "ix_stock_transaction_material", columnList = "material_id"),
        @Index(name = "ix_stock_transaction_type", columnList = "transaction_type"),
        @Index(name = "ix_stock_transaction_source_warehouse", columnList = "source_warehouse_id"),
        @Index(name = "ix_stock_transaction_target_warehouse", columnList = "target_warehouse_id"),
        @Index(name = "ix_stock_transaction_material_source", columnList = "material_id, source_warehouse_id"),
        @Index(name = "ix_stock_transaction_material_target", columnList = "material_id, target_warehouse_id"),
        @Index(name = "ix_stock_transaction_created_at", columnList = "created_at"),
        @Index(name = "ix_stock_transaction_tenant_date", columnList = "tenant_id, created_at"),
        @Index(name = "ix_stock_transaction_reference", columnList = "reference_document")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransactionEntity {
    
    /**
     * Primary key: Unique identifier for the transaction.
     * Generated automatically using UUID.
     */
    @Id
    @UuidGenerator
    @Column(name = "transaction_id", nullable = false, updatable = false)
    private UUID transactionId;
    
    /**
     * Tenant ID for multi-tenant isolation.
     * Automatically set from TenantContext, never from client.
     */
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;
    
    /**
     * Material involved in the transaction.
     * Reference to materials.id (no FK constraint - cross-database reference)
     */
    @Column(name = "material_id", nullable = false)
    private UUID materialId;
    
    /**
     * Type of transaction: IN, OUT, TRANSFER, or ADJUSTMENT.
     * Stored as VARCHAR(20) in database, mapped to enum.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private StockTransactionType transactionType;
    
    /**
     * Source warehouse (for OUT, TRANSFER, or ADJUSTMENT decrease).
     * Reference to warehouses.id (no FK constraint - cross-database reference)
     * 
     * Nullable: Required for OUT, TRANSFER, and ADJUSTMENT (decrease).
     * Null for IN transactions.
     */
    @Column(name = "source_warehouse_id")
    private UUID sourceWarehouseId;
    
    /**
     * Target warehouse (for IN, TRANSFER, or ADJUSTMENT increase).
     * Reference to warehouses.id (no FK constraint - cross-database reference)
     * 
     * Nullable: Required for IN, TRANSFER, and ADJUSTMENT (increase).
     * Null for OUT transactions.
     */
    @Column(name = "target_warehouse_id")
    private UUID targetWarehouseId;
    
    /**
     * Quantity involved in the transaction.
     * Always positive (validated: quantity > 0).
     * 
     * Stored as DECIMAL(18, 4) for precision.
     */
    @Column(name = "quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantity;
    
    /**
     * Reason/classification for the transaction.
     * Stored as VARCHAR(50) in database, mapped to enum.
     * 
     * Examples: PURCHASE, SALE, CONSUMPTION, DONATION, RETURN, etc.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "reason", length = 50)
    private StockTransactionReason reason;
    
    /**
     * Optional reference to external document.
     * Examples: PO number, invoice number, order ID, etc.
     * 
     * Stored as VARCHAR(255).
     */
    @Column(name = "reference_document", length = 255)
    private String referenceDocument;
    
    /**
     * Optional additional notes about the transaction.
     * Free-form text for additional context.
     * 
     * Stored as TEXT.
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    /**
     * User ID who created the transaction.
     * Automatically set from CurrentUserContext.
     */
    @Column(name = "created_by_id", nullable = false)
    private UUID createdById;
    
    /**
     * Timestamp when the transaction was created.
     * Automatically set to current timestamp.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    /**
     * Pre-persist callback to set tenant ID and audit fields.
     */
    @PrePersist
    protected void prePersist() {
        // Set tenant ID from TenantContext if not already set
        if (tenantId == null) {
            tenantId = com.care.warehouse.application.common.context.TenantContext.get();
        }
        
        // Set created by from CurrentUserContext if not already set
        if (createdById == null) {
            com.sharedlib.core.context.CurrentUser currentUser = 
                com.sharedlib.core.context.CurrentUserContext.get();
            if (currentUser != null) {
                createdById = currentUser.userId();
            }
        }
        
        // Set created timestamp if not already set
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}


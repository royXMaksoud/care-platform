package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entities.StockBalanceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository for StockBalanceEntity.
 * 
 * Provides standard JPA operations and custom queries for stock balances.
 * Uses composite primary key (warehouseId, materialId).
 * 
 * @author CARE Team
 */
@Repository
public interface StockBalanceJpaRepository extends JpaRepository<StockBalanceEntity, StockBalanceEntity.StockBalanceId> {
    
    /**
     * Find stock balance by warehouse and material.
     * 
     * @param warehouseId Warehouse ID
     * @param materialId Material ID
     * @return Optional stock balance if found
     */
    Optional<StockBalanceEntity> findByWarehouseIdAndMaterialId(UUID warehouseId, UUID materialId);
    
    /**
     * Find all stock balances for a warehouse.
     * 
     * @param tenantId Tenant ID
     * @param warehouseId Warehouse ID
     * @return List of stock balances
     */
    List<StockBalanceEntity> findByTenantIdAndWarehouseId(UUID tenantId, UUID warehouseId);
    
    /**
     * Find all stock balances for a material (across all warehouses).
     * 
     * @param tenantId Tenant ID
     * @param materialId Material ID
     * @return List of stock balances
     */
    List<StockBalanceEntity> findByTenantIdAndMaterialId(UUID tenantId, UUID materialId);
    
    /**
     * Get aggregated stock balance for a material across all warehouses.
     * 
     * Sums up quantities from all warehouses for the given material.
     * 
     * @param tenantId Tenant ID
     * @param materialId Material ID
     * @return Total quantity across all warehouses, or 0 if no balances found
     */
    @Query("SELECT COALESCE(SUM(sb.quantity), 0) FROM StockBalanceEntity sb " +
           "WHERE sb.tenantId = :tenantId AND sb.materialId = :materialId")
    BigDecimal getAggregatedBalance(@Param("tenantId") UUID tenantId, @Param("materialId") UUID materialId);
    
    /**
     * Atomically increment stock balance quantity.
     * 
     * Uses database-level atomic operation to ensure thread-safety.
     * If balance doesn't exist, this will fail - use save() first.
     * 
     * @param warehouseId Warehouse ID
     * @param materialId Material ID
     * @param quantity Quantity to increment (must be positive)
     * @param transactionId Transaction ID
     * @return Number of rows updated (should be 1)
     */
    @Modifying
    @Query("UPDATE StockBalanceEntity sb SET " +
           "sb.quantity = sb.quantity + :quantity, " +
           "sb.lastTransactionId = :transactionId, " +
           "sb.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE sb.warehouseId = :warehouseId AND sb.materialId = :materialId")
    int incrementBalance(@Param("warehouseId") UUID warehouseId, 
                         @Param("materialId") UUID materialId, 
                         @Param("quantity") BigDecimal quantity,
                         @Param("transactionId") UUID transactionId);
    
    /**
     * Atomically decrement stock balance quantity.
     * 
     * Uses database-level atomic operation to ensure thread-safety.
     * Validates that sufficient stock is available (quantity >= decrement).
     * 
     * @param warehouseId Warehouse ID
     * @param materialId Material ID
     * @param quantity Quantity to decrement (must be positive)
     * @param transactionId Transaction ID
     * @return Number of rows updated (should be 1, or 0 if insufficient stock)
     */
    @Modifying
    @Query("UPDATE StockBalanceEntity sb SET " +
           "sb.quantity = sb.quantity - :quantity, " +
           "sb.lastTransactionId = :transactionId, " +
           "sb.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE sb.warehouseId = :warehouseId AND sb.materialId = :materialId " +
           "AND sb.quantity >= :quantity")
    int decrementBalance(@Param("warehouseId") UUID warehouseId, 
                         @Param("materialId") UUID materialId, 
                         @Param("quantity") BigDecimal quantity,
                         @Param("transactionId") UUID transactionId);
}


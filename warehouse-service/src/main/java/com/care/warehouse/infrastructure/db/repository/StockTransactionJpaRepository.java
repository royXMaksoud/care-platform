package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.domain.enums.StockTransactionType;
import com.care.warehouse.infrastructure.db.entities.StockTransactionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Repository for StockTransactionEntity.
 * 
 * Provides standard JPA operations and custom queries for stock transactions.
 * 
 * @author CARE Team
 */
@Repository
public interface StockTransactionJpaRepository extends JpaRepository<StockTransactionEntity, UUID>,
        JpaSpecificationExecutor<StockTransactionEntity> {
    
    /**
     * Find all transactions for a tenant with pagination.
     * 
     * @param tenantId Tenant ID
     * @param pageable Pagination information
     * @return Page of transactions
     */
    Page<StockTransactionEntity> findByTenantId(UUID tenantId, Pageable pageable);
    
    /**
     * Find all transactions for a material with pagination.
     * 
     * @param materialId Material ID
     * @param pageable Pagination information
     * @return Page of transactions
     */
    Page<StockTransactionEntity> findByMaterialId(UUID materialId, Pageable pageable);
    
    /**
     * Find all transactions for a warehouse (as source or target) with pagination.
     * 
     * @param warehouseId Warehouse ID
     * @param pageable Pagination information
     * @return Page of transactions
     */
    @Query("SELECT t FROM StockTransactionEntity t WHERE t.tenantId = :tenantId " +
           "AND (t.sourceWarehouseId = :warehouseId OR t.targetWarehouseId = :warehouseId)")
    Page<StockTransactionEntity> findByWarehouse(@Param("tenantId") UUID tenantId, 
                                                  @Param("warehouseId") UUID warehouseId, 
                                                  Pageable pageable);
    
    /**
     * Find transactions by type with pagination.
     * 
     * @param tenantId Tenant ID
     * @param transactionType Transaction type
     * @param pageable Pagination information
     * @return Page of transactions
     */
    Page<StockTransactionEntity> findByTenantIdAndTransactionType(UUID tenantId, 
                                                                    StockTransactionType transactionType, 
                                                                    Pageable pageable);
    
    /**
     * Find transactions by date range with pagination.
     * 
     * @param tenantId Tenant ID
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @param pageable Pagination information
     * @return Page of transactions
     */
    Page<StockTransactionEntity> findByTenantIdAndCreatedAtBetween(UUID tenantId, 
                                                                     Instant startDate, 
                                                                     Instant endDate, 
                                                                     Pageable pageable);
    
    /**
     * Find transactions by reference document.
     * 
     * @param tenantId Tenant ID
     * @param referenceDocument Reference document (e.g., PO number, invoice)
     * @param pageable Pagination information
     * @return Page of transactions
     */
    Page<StockTransactionEntity> findByTenantIdAndReferenceDocument(UUID tenantId, 
                                                                      String referenceDocument, 
                                                                      Pageable pageable);
}


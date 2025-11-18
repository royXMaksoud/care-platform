package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entities.WarehouseMaterialStockEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository for WarehouseMaterialStockEntity.
 */
public interface WarehouseMaterialStockJpaRepository extends JpaRepository<WarehouseMaterialStockEntity, UUID>, JpaSpecificationExecutor<WarehouseMaterialStockEntity> {
    
    /**
     * Find stock by material, warehouse, and lot number.
     */
    @Query("""
        SELECT s FROM WarehouseMaterialStockEntity s
        WHERE s.tenantId = :tenantId
          AND s.materialId = :materialId
          AND s.warehouseId = :warehouseId
          AND (:lotNumber IS NULL OR s.lotNumber = :lotNumber)
          AND s.isDeleted = false
        """)
    Optional<WarehouseMaterialStockEntity> findByMaterialAndWarehouseAndLot(
            @Param("tenantId") UUID tenantId,
            @Param("materialId") UUID materialId,
            @Param("warehouseId") UUID warehouseId,
            @Param("lotNumber") String lotNumber);
    
    /**
     * Find all stock records for a material across all warehouses.
     */
    @Query("""
        SELECT s FROM WarehouseMaterialStockEntity s
        WHERE s.tenantId = :tenantId
          AND s.materialId = :materialId
          AND s.isDeleted = false
        ORDER BY s.warehouseId, s.createdAt
        """)
    List<WarehouseMaterialStockEntity> findByMaterialId(
            @Param("tenantId") UUID tenantId,
            @Param("materialId") UUID materialId);
    
    /**
     * Find all stock records for a warehouse.
     */
    @Query("""
        SELECT s FROM WarehouseMaterialStockEntity s
        WHERE s.tenantId = :tenantId
          AND s.warehouseId = :warehouseId
          AND s.isDeleted = false
        ORDER BY s.materialId, s.createdAt
        """)
    List<WarehouseMaterialStockEntity> findByWarehouseId(
            @Param("tenantId") UUID tenantId,
            @Param("warehouseId") UUID warehouseId);
    
    /**
     * Find all stock records below reorder level for a tenant.
     */
    @Query("""
        SELECT s FROM WarehouseMaterialStockEntity s
        WHERE s.tenantId = :tenantId
          AND s.isDeleted = false
          AND s.reorderLevel IS NOT NULL
          AND s.stockCurrent < s.reorderLevel
        ORDER BY s.stockCurrent ASC
        """)
    List<WarehouseMaterialStockEntity> findBelowReorderLevel(@Param("tenantId") UUID tenantId);
    
    /**
     * Find stock by ID and tenant ID (excluding deleted).
     */
    @Query("""
        SELECT s FROM WarehouseMaterialStockEntity s
        WHERE s.id = :id
          AND s.tenantId = :tenantId
          AND s.isDeleted = false
        """)
    Optional<WarehouseMaterialStockEntity> findByIdAndTenantId(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId);
}


package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entities.WarehouseLanguageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for WarehouseLanguageEntity.
 * 
 * All queries MUST include tenant_id filter for tenant isolation.
 */
@Repository
public interface WarehouseLanguageRepository extends JpaRepository<WarehouseLanguageEntity, UUID> {

    /**
     * Find language entry by warehouse ID and language code.
     */
    @Query("SELECT wl FROM WarehouseLanguageEntity wl WHERE wl.warehouseId = :warehouseId AND wl.languageCode = :languageCode AND wl.tenantId = :tenantId AND wl.isDeleted = false")
    Optional<WarehouseLanguageEntity> findByWarehouseIdAndLanguageCode(
        @Param("warehouseId") UUID warehouseId,
        @Param("languageCode") String languageCode,
        @Param("tenantId") UUID tenantId
    );

    /**
     * Find all language entries for a warehouse.
     */
    @Query("SELECT wl FROM WarehouseLanguageEntity wl WHERE wl.warehouseId = :warehouseId AND wl.tenantId = :tenantId AND wl.isDeleted = false ORDER BY wl.languageCode")
    List<WarehouseLanguageEntity> findAllByWarehouseId(@Param("warehouseId") UUID warehouseId, @Param("tenantId") UUID tenantId);

    /**
     * Find all language entries for a tenant.
     */
    @Query("SELECT wl FROM WarehouseLanguageEntity wl WHERE wl.tenantId = :tenantId AND wl.isDeleted = false")
    List<WarehouseLanguageEntity> findAllByTenantId(@Param("tenantId") UUID tenantId);
}


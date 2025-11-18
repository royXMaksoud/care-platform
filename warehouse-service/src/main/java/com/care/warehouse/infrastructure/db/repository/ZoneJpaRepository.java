package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entity.ZoneEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ZoneJpaRepository extends JpaRepository<ZoneEntity, UUID> {
    
    /**
     * Find zone by warehouse and code
     */
    @Query("SELECT z FROM ZoneEntity z WHERE z.warehouseId = :warehouseId AND z.code = :code AND z.isDeleted = false")
    Optional<ZoneEntity> findByWarehouseIdAndCode(@Param("warehouseId") UUID warehouseId, @Param("code") String code);
    
    /**
     * Find all zones in a warehouse
     */
    @Query("SELECT z FROM ZoneEntity z WHERE z.warehouseId = :warehouseId AND z.isDeleted = false ORDER BY z.code ASC")
    Page<ZoneEntity> findByWarehouseId(@Param("warehouseId") UUID warehouseId, Pageable pageable);
    
    /**
     * Find all active zones in a warehouse
     */
    @Query("SELECT z FROM ZoneEntity z WHERE z.warehouseId = :warehouseId AND z.status = 'ACTIVE' AND z.isDeleted = false")
    Page<ZoneEntity> findActiveByWarehouseId(@Param("warehouseId") UUID warehouseId, Pageable pageable);
    
    /**
     * Find zones by type
     */
    @Query("SELECT z FROM ZoneEntity z WHERE z.warehouseId = :warehouseId AND z.zoneType = :zoneType AND z.isDeleted = false")
    Page<ZoneEntity> findByWarehouseIdAndZoneType(@Param("warehouseId") UUID warehouseId, @Param("zoneType") String zoneType, Pageable pageable);
    
    /**
     * Find zone by ID and tenant
     */
    @Query("SELECT z FROM ZoneEntity z WHERE z.id = :id AND z.tenantId = :tenantId AND z.isDeleted = false")
    Optional<ZoneEntity> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
    
    /**
     * Find temperature-controlled zones
     */
    @Query("SELECT z FROM ZoneEntity z WHERE z.warehouseId = :warehouseId AND z.temperatureControlled = true AND z.isDeleted = false")
    Page<ZoneEntity> findTemperatureControlledZones(@Param("warehouseId") UUID warehouseId, Pageable pageable);
}

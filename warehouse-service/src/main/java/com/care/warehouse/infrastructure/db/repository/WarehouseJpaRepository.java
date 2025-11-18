package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entity.WarehouseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseJpaRepository extends JpaRepository<WarehouseEntity, UUID> {
    
    /**
     * Find warehouse by tenant and code
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.tenantId = :tenantId AND w.code = :code AND w.isDeleted = false")
    Optional<WarehouseEntity> findByTenantIdAndCode(@Param("tenantId") UUID tenantId, @Param("code") String code);
    
    /**
     * Find all warehouses for a tenant
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.tenantId = :tenantId AND w.isDeleted = false ORDER BY w.code ASC")
    Page<WarehouseEntity> findByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);
    
    /**
     * Find all active warehouses for a tenant
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.tenantId = :tenantId AND w.status = 'ACTIVE' AND w.isDeleted = false")
    Page<WarehouseEntity> findActiveByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);
    
    /**
     * Find primary warehouse for a tenant
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.tenantId = :tenantId AND w.isPrimary = true AND w.isDeleted = false")
    Optional<WarehouseEntity> findPrimaryByTenantId(@Param("tenantId") UUID tenantId);
    
    /**
     * Find warehouse by ID and tenant
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.id = :id AND w.tenantId = :tenantId AND w.isDeleted = false")
    Optional<WarehouseEntity> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
}

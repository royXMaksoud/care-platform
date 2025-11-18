package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.domain.enums.WarehouseType;
import com.care.warehouse.infrastructure.db.entities.WarehouseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for WarehouseEntity.
 * 
 * All queries MUST include tenant_id filter for tenant isolation.
 * Never query without tenant filter to prevent cross-tenant data access.
 */
@Repository
public interface WarehouseRepository extends JpaRepository<WarehouseEntity, UUID> {

    /**
     * Find warehouse by ID and tenant ID.
     * Always use this method instead of findById() to ensure tenant isolation.
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.id = :id AND w.tenantId = :tenantId AND w.isDeleted = false")
    Optional<WarehouseEntity> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Find all warehouses for a tenant (excluding deleted).
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.tenantId = :tenantId AND w.isDeleted = false ORDER BY w.code")
    List<WarehouseEntity> findAllByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Find warehouses by tenant and type.
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.tenantId = :tenantId AND w.warehouseType = :type AND w.isDeleted = false ORDER BY w.code")
    List<WarehouseEntity> findByTenantIdAndType(@Param("tenantId") UUID tenantId, @Param("type") WarehouseType type);

    /**
     * Find warehouse by tenant and code.
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.tenantId = :tenantId AND w.code = :code AND w.isDeleted = false")
    Optional<WarehouseEntity> findByTenantIdAndCode(@Param("tenantId") UUID tenantId, @Param("code") String code);

    /**
     * Find child warehouses (warehouses with a specific parent).
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.parentWarehouseId = :parentId AND w.tenantId = :tenantId AND w.isDeleted = false ORDER BY w.code")
    List<WarehouseEntity> findChildrenByParentId(@Param("parentId") UUID parentId, @Param("tenantId") UUID tenantId);

    /**
     * Find root warehouses (warehouses without parent).
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.parentWarehouseId IS NULL AND w.tenantId = :tenantId AND w.isDeleted = false ORDER BY w.code")
    List<WarehouseEntity> findRootWarehouses(@Param("tenantId") UUID tenantId);

    /**
     * Find warehouses by country.
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.countryId = :countryId AND w.tenantId = :tenantId AND w.isDeleted = false ORDER BY w.code")
    List<WarehouseEntity> findByCountryId(@Param("countryId") UUID countryId, @Param("tenantId") UUID tenantId);

    /**
     * Find warehouses by location.
     */
    @Query("SELECT w FROM WarehouseEntity w WHERE w.locationId = :locationId AND w.tenantId = :tenantId AND w.isDeleted = false ORDER BY w.code")
    List<WarehouseEntity> findByLocationId(@Param("locationId") UUID locationId, @Param("tenantId") UUID tenantId);

    /**
     * Find warehouses within a geographic radius (using latitude/longitude).
     * Uses Haversine formula for distance calculation.
     * 
     * @param latitude Center point latitude
     * @param longitude Center point longitude
     * @param radiusKm Radius in kilometers
     * @param tenantId Tenant ID for isolation
     * @return List of warehouses within radius
     */
    @Query(value = """
        SELECT w.* FROM warehouses w
        WHERE w.tenant_id = :tenantId
          AND w.is_deleted = false
          AND w.latitude IS NOT NULL
          AND w.longitude IS NOT NULL
          AND (
            6371 * acos(
              cos(radians(:latitude)) *
              cos(radians(w.latitude)) *
              cos(radians(w.longitude) - radians(:longitude)) +
              sin(radians(:latitude)) *
              sin(radians(w.latitude))
            )
          ) <= :radiusKm
        ORDER BY (
          6371 * acos(
            cos(radians(:latitude)) *
            cos(radians(w.latitude)) *
            cos(radians(w.longitude) - radians(:longitude)) +
            sin(radians(:latitude)) *
            sin(radians(w.latitude))
          )
        )
        """, nativeQuery = true)
    List<WarehouseEntity> findNearbyWarehouses(
        @Param("latitude") Double latitude,
        @Param("longitude") Double longitude,
        @Param("radiusKm") Double radiusKm,
        @Param("tenantId") UUID tenantId
    );

    /**
     * Check if warehouse code exists for tenant.
     */
    @Query("SELECT COUNT(w) > 0 FROM WarehouseEntity w WHERE w.tenantId = :tenantId AND w.code = :code AND w.isDeleted = false")
    boolean existsByTenantIdAndCode(@Param("tenantId") UUID tenantId, @Param("code") String code);
}


package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.domain.enums.OrderStatus;
import com.care.warehouse.infrastructure.db.entities.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * JPA Repository for Order entity.
 * Provides database operations for Order persistence.
 */
@Repository
public interface OrderJpaRepository extends JpaRepository<OrderEntity, UUID>, JpaSpecificationExecutor<OrderEntity> {

    /**
     * Find all orders by warehouse ID and tenant ID.
     *
     * @param warehouseId Warehouse ID
     * @param tenantId Tenant ID
     * @return List of orders
     */
    @Query("SELECT o FROM OrderEntity o WHERE o.warehouseId = :warehouseId AND o.tenantId = :tenantId AND o.isDeleted = false")
    List<OrderEntity> findByWarehouseId(@Param("warehouseId") UUID warehouseId, @Param("tenantId") UUID tenantId);

    /**
     * Find all orders by status and tenant ID.
     *
     * @param status Order status
     * @param tenantId Tenant ID
     * @return List of orders
     */
    @Query("SELECT o FROM OrderEntity o WHERE o.status = :status AND o.tenantId = :tenantId AND o.isDeleted = false")
    List<OrderEntity> findByStatus(@Param("status") OrderStatus status, @Param("tenantId") UUID tenantId);

    /**
     * Find order by ID and tenant ID (for tenant isolation).
     *
     * @param id Order ID
     * @param tenantId Tenant ID
     * @return Optional order
     */
    @Query("SELECT o FROM OrderEntity o WHERE o.id = :id AND o.tenantId = :tenantId AND o.isDeleted = false")
    java.util.Optional<OrderEntity> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
}

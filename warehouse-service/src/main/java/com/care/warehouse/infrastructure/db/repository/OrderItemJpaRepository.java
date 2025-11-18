package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entities.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * JPA Repository for OrderItem entity.
 * Provides database operations for OrderItem persistence.
 */
@Repository
public interface OrderItemJpaRepository extends JpaRepository<OrderItemEntity, UUID> {

    /**
     * Find all order items for a specific order.
     *
     * @param orderId Order ID
     * @return List of order items
     */
    List<OrderItemEntity> findByOrderId(UUID orderId);

    /**
     * Delete all order items for a specific order.
     *
     * @param orderId Order ID
     */
    void deleteByOrderId(UUID orderId);

    /**
     * Find order items by material ID.
     *
     * @param materialId Material ID
     * @return List of order items
     */
    List<OrderItemEntity> findByMaterialId(UUID materialId);

    /**
     * Check if order has items.
     *
     * @param orderId Order ID
     * @return true if order has items, false otherwise
     */
    @Query("SELECT COUNT(oi) > 0 FROM OrderItemEntity oi WHERE oi.orderId = :orderId")
    boolean hasItems(@Param("orderId") UUID orderId);
}

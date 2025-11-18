package com.care.warehouse.infrastructure.db.mappers;

import com.care.warehouse.domain.model.Order;
import com.care.warehouse.domain.model.OrderItem;
import com.care.warehouse.infrastructure.db.entities.OrderEntity;
import com.care.warehouse.infrastructure.db.entities.OrderItemEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper interface for converting between Order domain model and OrderEntity.
 * Uses MapStruct for automatic mapping generation.
 *
 * Note: Order items are managed separately and not mapped here.
 * Items are loaded from OrderItemEntity separately in the repository adapter.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface OrderJpaMapper extends DomainEntityMapper<Order, OrderEntity> {

    OrderEntity toEntity(Order domain);

    Order toDomain(OrderEntity entity);

    @Override
    default void updateEntity(@MappingTarget OrderEntity target, Order source) {
        if (source == null) {
            return;
        }
        if (source.getType() != null) target.setType(source.getType());
        if (source.getWarehouseId() != null) target.setWarehouseId(source.getWarehouseId());
        if (source.getStatus() != null) target.setStatus(source.getStatus());
        if (source.getNotes() != null) target.setNotes(source.getNotes());
        if (source.getCustomData() != null) target.setCustomData(source.getCustomData());
        if (source.getApprovedById() != null) target.setApprovedById(source.getApprovedById());
        if (source.getApprovedAt() != null) target.setApprovedAt(source.getApprovedAt());
        if (source.getFulfilledById() != null) target.setFulfilledById(source.getFulfilledById());
        if (source.getFulfilledAt() != null) target.setFulfilledAt(source.getFulfilledAt());
        if (source.getIsActive() != null) target.setIsActive(source.getIsActive());
        if (source.getIsDeleted() != null) target.setIsDeleted(source.getIsDeleted());
        if (source.getCreatedById() != null) target.setCreatedById(source.getCreatedById());
        if (source.getCreatedAt() != null) target.setCreatedAt(source.getCreatedAt());
        if (source.getUpdatedById() != null) target.setUpdatedById(source.getUpdatedById());
        if (source.getUpdatedAt() != null) target.setUpdatedAt(source.getUpdatedAt());
        if (source.getTenantId() != null) target.setTenantId(source.getTenantId());
        if (source.getRowVersion() != null) target.setRowVersion(source.getRowVersion());
    }

    /**
     * Convert OrderItem domain to OrderItemEntity.
     */
    default OrderItemEntity itemDomainToEntity(OrderItem domain) {
        if (domain == null) {
            return null;
        }

        return OrderItemEntity.builder()
                .id(domain.getId())
                .orderId(domain.getOrderId())
                .materialId(domain.getMaterialId())
                .qtyRequested(domain.getQtyRequested())
                .qtyApproved(domain.getQtyApproved())
                .qtyFulfilled(domain.getQtyFulfilled())
                .customData(domain.getCustomData())
                .build();
    }

    /**
     * Convert OrderItemEntity to OrderItem domain.
     */
    default OrderItem itemEntityToDomain(OrderItemEntity entity) {
        if (entity == null) {
            return null;
        }

        return OrderItem.builder()
                .id(entity.getId())
                .orderId(entity.getOrderId())
                .materialId(entity.getMaterialId())
                .qtyRequested(entity.getQtyRequested())
                .qtyApproved(entity.getQtyApproved())
                .qtyFulfilled(entity.getQtyFulfilled())
                .customData(entity.getCustomData())
                .build();
    }
}

package com.care.warehouse.application.order.mapper;

import com.care.warehouse.application.order.command.CreateOrderCommand;
import com.care.warehouse.application.order.command.CreateOrderItemCommand;
import com.care.warehouse.domain.model.Order;
import com.care.warehouse.domain.model.OrderItem;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Mapper for converting between Order domain model and commands.
 */
@Component
public class OrderAppMapper {

    public Order fromCreate(CreateOrderCommand cmd) {
        Order.OrderBuilder builder = Order.builder()
                .id(null)
                .type(cmd.getType())
                .warehouseId(cmd.getWarehouseId())
                .status(com.care.warehouse.domain.enums.OrderStatus.PENDING)
                .notes(cmd.getNotes())
                .customData(cmd.getCustomData())
                .isActive(true)
                .isDeleted(false)
                .createdAt(Instant.now())
                .rowVersion(0L);

        // Map items
        if (cmd.getItems() != null) {
            List<OrderItem> items = cmd.getItems().stream()
                    .map(this::mapItem)
                    .collect(Collectors.toList());
            builder.items(items);
        }

        return builder.build();
    }

    private OrderItem mapItem(CreateOrderItemCommand itemCmd) {
        return OrderItem.builder()
                .id(UUID.randomUUID()) // Temporary ID, will be replaced by entity
                .materialId(itemCmd.getMaterialId())
                .qtyRequested(itemCmd.getQtyRequested())
                .qtyApproved(null) // Set during approval
                .qtyFulfilled(null) // Set during fulfillment
                .customData(itemCmd.getCustomData())
                .build();
    }
}


package com.care.warehouse.web.mapper;

import com.care.warehouse.application.order.command.CreateOrderCommand;
import com.care.warehouse.application.order.command.CreateOrderItemCommand;
import com.care.warehouse.application.order.command.FulfillOrderCommand;
import com.care.warehouse.application.order.command.FulfillOrderItemCommand;
import com.care.warehouse.domain.model.Order;
import com.care.warehouse.domain.model.OrderItem;
import com.care.warehouse.web.dto.order.*;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Mapper to convert between Web layer DTOs and Domain models/Commands related to Order.
 */
@Component
public class OrderWebMapper {

    public CreateOrderCommand toCreateCommand(CreateOrderRequest request) {
        List<CreateOrderItemCommand> itemCommands = request.getItems().stream()
                .map(item -> CreateOrderItemCommand.builder()
                        .materialId(item.getMaterialId())
                        .qtyRequested(item.getQtyRequested())
                        .customData(item.getCustomData())
                        .build())
                .collect(Collectors.toList());

        return CreateOrderCommand.builder()
                .type(request.getType())
                .warehouseId(request.getWarehouseId())
                .items(itemCommands)
                .notes(request.getNotes())
                .customData(request.getCustomData())
                .build();
    }

    public FulfillOrderCommand toFulfillCommand(UUID orderId, FulfillOrderRequest request) {
        List<FulfillOrderItemCommand> itemCommands = request.getItems().stream()
                .map(item -> FulfillOrderItemCommand.builder()
                        .itemId(item.getItemId())
                        .qtyFulfilled(item.getQtyFulfilled())
                        .build())
                .collect(Collectors.toList());

        return FulfillOrderCommand.builder()
                .orderId(orderId)
                .items(itemCommands)
                .fulfillmentData(request.getFulfillmentData())
                .build();
    }

    public OrderResponse toResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems() != null ?
                order.getItems().stream()
                        .map(this::toItemResponse)
                        .collect(Collectors.toList()) : null;

        return OrderResponse.builder()
                .id(order.getId())
                .tenantId(order.getTenantId())
                .type(order.getType())
                .warehouseId(order.getWarehouseId())
                .status(order.getStatus())
                .items(itemResponses)
                .notes(order.getNotes())
                .customData(order.getCustomData())
                .totalQtyRequested(order.getTotalQtyRequested())
                .totalQtyApproved(order.getTotalQtyApproved())
                .totalQtyFulfilled(order.getTotalQtyFulfilled())
                .isActive(order.getIsActive())
                .isDeleted(order.getIsDeleted())
                .createdById(order.getCreatedById())
                .createdAt(order.getCreatedAt())
                .updatedById(order.getUpdatedById())
                .updatedAt(order.getUpdatedAt())
                .approvedById(order.getApprovedById())
                .approvedAt(order.getApprovedAt())
                .fulfilledById(order.getFulfilledById())
                .fulfilledAt(order.getFulfilledAt())
                .rowVersion(order.getRowVersion())
                .build();
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .orderId(item.getOrderId())
                .materialId(item.getMaterialId())
                .qtyRequested(item.getQtyRequested())
                .qtyApproved(item.getQtyApproved())
                .qtyFulfilled(item.getQtyFulfilled())
                .remainingQty(item.getRemainingQty())
                .customData(item.getCustomData())
                .build();
    }
}


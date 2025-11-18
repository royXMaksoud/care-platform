package com.care.warehouse.web.controller;

import com.care.warehouse.application.order.command.CreateOrderCommand;
import com.care.warehouse.application.order.command.FulfillOrderCommand;
import com.care.warehouse.domain.model.Order;
import com.care.warehouse.domain.ports.in.order.*;
import com.care.warehouse.web.dto.order.CreateOrderRequest;
import com.care.warehouse.web.dto.order.FulfillOrderRequest;
import com.care.warehouse.web.dto.order.OrderResponse;
import com.care.warehouse.web.mapper.OrderWebMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

/**
 * REST Controller for Order management.
 * 
 * All endpoints are under /api/warehouse/v1/orders
 * Tenant isolation is enforced automatically via TenantContext.
 */
@RestController
@RequestMapping("/api/warehouse/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Management", description = "APIs for managing consumption and replenishment orders")
public class OrderController {

    private final CreateOrderUseCase createOrderUseCase;
    private final ApproveOrderUseCase approveOrderUseCase;
    private final FulfillOrderUseCase fulfillOrderUseCase;
    private final CancelOrderUseCase cancelOrderUseCase;
    private final OrderWebMapper mapper;

    @PostMapping
    @Operation(summary = "Create a new order", description = "Creates a consumption or replenishment order")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        CreateOrderCommand command = mapper.toCreateCommand(request);
        Order created = createOrderUseCase.createOrder(command);
        OrderResponse body = mapper.toResponse(created);
        return ResponseEntity
                .created(URI.create("/api/warehouse/v1/orders/" + body.getId()))
                .body(body);
    }

    @PostMapping("/{id:[0-9a-fA-F\\-]{36}}/approve")
    @Operation(summary = "Approve an order", description = "Approves a pending order")
    public ResponseEntity<OrderResponse> approveOrder(@PathVariable UUID id) {
        Order approved = approveOrderUseCase.approveOrder(id);
        return ResponseEntity.ok(mapper.toResponse(approved));
    }

    @PostMapping("/{id:[0-9a-fA-F\\-]{36}}/fulfill")
    @Operation(summary = "Fulfill an order", description = "Fulfills an approved order (partially or fully)")
    public ResponseEntity<OrderResponse> fulfillOrder(
            @PathVariable UUID id,
            @Valid @RequestBody FulfillOrderRequest request) {
        FulfillOrderCommand command = mapper.toFulfillCommand(id, request);
        Order fulfilled = fulfillOrderUseCase.fulfillOrder(command);
        return ResponseEntity.ok(mapper.toResponse(fulfilled));
    }

    @PostMapping("/{id:[0-9a-fA-F\\-]{36}}/cancel")
    @Operation(summary = "Cancel an order", description = "Cancels a pending or approved order")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable UUID id) {
        Order cancelled = cancelOrderUseCase.cancelOrder(id);
        return ResponseEntity.ok(mapper.toResponse(cancelled));
    }
}


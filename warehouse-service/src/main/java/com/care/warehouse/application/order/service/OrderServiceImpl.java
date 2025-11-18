package com.care.warehouse.application.order.service;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.order.command.CreateOrderCommand;
import com.care.warehouse.application.order.command.FulfillOrderCommand;
import com.care.warehouse.application.order.mapper.OrderAppMapper;
import com.care.warehouse.application.order.validation.CreateOrderValidator;
import com.care.warehouse.domain.enums.OrderStatus;
import com.care.warehouse.domain.enums.OrderType;
import com.care.warehouse.domain.model.Order;
import com.care.warehouse.domain.model.OrderItem;
import com.care.warehouse.domain.ports.in.order.*;
import com.care.warehouse.domain.ports.out.order.OrderCrudPort;
import com.care.warehouse.domain.ports.out.warehousematerialstock.WarehouseMaterialStockCrudPort;
import com.care.warehouse.domain.ports.iot.IoTEventGateway;
import com.care.warehouse.infrastructure.client.ProcurementIntegrationClient;
import com.sharedlib.core.context.CurrentUserContext;
import com.care.warehouse.application.common.exception.WarehouseBusinessException;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * OrderServiceImpl implements use cases for Order aggregate.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl
        implements CreateOrderUseCase, ApproveOrderUseCase, FulfillOrderUseCase, CancelOrderUseCase {

    private final OrderCrudPort orderCrudPort;
    private final WarehouseMaterialStockCrudPort stockCrudPort;
    private final OrderAppMapper mapper;
    private final CreateOrderValidator createOrderValidator;
    private final MessageResolver messageResolver;
    private final IoTEventGateway iotEventGateway;
    private final ProcurementIntegrationClient procurementIntegrationClient;

    @Override
    @Transactional
    public Order createOrder(CreateOrderCommand command) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.order.tenant.required"));
        }

        // Map command to domain model
        Order order = mapper.fromCreate(command);
        order.setTenantId(tenantId);
        order.setStatus(OrderStatus.PENDING);

        // Set audit fields
        if (CurrentUserContext.get() != null) {
            order.setCreatedById(CurrentUserContext.get().userId());
        }
        order.setCreatedAt(Instant.now());

        // Validate
        createOrderValidator.validate(command, order);

        // Save order
        Order saved = orderCrudPort.save(order);

        // Emit event for replenishment orders (send to procurement)
        if (saved.getType() == OrderType.REPLENISHMENT) {
            emitReplenishmentEvent(saved);
        }

        return saved;
    }

    @Override
    @Transactional
    public Order approveOrder(UUID orderId) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.order.tenant.required"));
        }

        Order order = orderCrudPort.load(orderId)
                .orElseThrow(() -> new NotFoundException(
                        messageResolver.getMessage("error.order.not-found", new Object[]{orderId.toString()})));

        if (!order.getTenantId().equals(tenantId)) {
            throw new NotFoundException(messageResolver.getMessage("error.order.not-found", new Object[]{orderId.toString()}));
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.order.not.pending", new Object[]{order.getStatus().name()}));
        }

        // Approve all items (set qtyApproved = qtyRequested)
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getQtyApproved() == null) {
                    item.setQtyApproved(item.getQtyRequested());
                }
            }
        }

        order.setStatus(OrderStatus.APPROVED);
        if (CurrentUserContext.get() != null) {
            order.setApprovedById(CurrentUserContext.get().userId());
        }
        order.setApprovedAt(Instant.now());

        return orderCrudPort.save(order);
    }

    @Override
    @Transactional
    public Order fulfillOrder(FulfillOrderCommand command) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.order.tenant.required"));
        }

        Order order = orderCrudPort.load(command.getOrderId())
                .orElseThrow(() -> new NotFoundException(
                        messageResolver.getMessage("error.order.not-found", new Object[]{command.getOrderId().toString()})));

        if (!order.getTenantId().equals(tenantId)) {
            throw new NotFoundException(messageResolver.getMessage("error.order.not-found", new Object[]{command.getOrderId().toString()}));
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.order.cancelled", new Object[0]));
        }

        if (order.getStatus() == OrderStatus.FULFILLED) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.order.already.fulfilled", new Object[0]));
        }

        // Create map of item updates
        Map<UUID, Double> itemFulfillments = command.getItems().stream()
                .collect(Collectors.toMap(
                        com.care.warehouse.application.order.command.FulfillOrderItemCommand::getItemId,
                        com.care.warehouse.application.order.command.FulfillOrderItemCommand::getQtyFulfilled));

        // Update items
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Double qtyFulfilled = itemFulfillments.get(item.getId());
                if (qtyFulfilled != null) {
                    if (qtyFulfilled > item.getQtyApproved()) {
                        throw new WarehouseBusinessException(messageResolver.getMessage("error.order.fulfillment.exceeds.approved",
                                new Object[]{item.getId(), qtyFulfilled, item.getQtyApproved()}));
                    }
                    item.setQtyFulfilled(qtyFulfilled);
                }
            }
        }

        // Adjust stock based on order type
        adjustStock(order);

        // Update status
        if (order.isFullyFulfilled()) {
            order.setStatus(OrderStatus.FULFILLED);
        } else if (order.isPartiallyFulfilled()) {
            order.setStatus(OrderStatus.PARTIALLY_FULFILLED);
        }

        if (CurrentUserContext.get() != null) {
            order.setFulfilledById(CurrentUserContext.get().userId());
        }
        order.setFulfilledAt(Instant.now());

        Order saved = orderCrudPort.save(order);

        // Emit stock adjustment events
        emitStockAdjustmentEvents(saved);

        return saved;
    }

    @Override
    @Transactional
    public Order cancelOrder(UUID orderId) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.order.tenant.required"));
        }

        Order order = orderCrudPort.load(orderId)
                .orElseThrow(() -> new NotFoundException(
                        messageResolver.getMessage("error.order.not-found", new Object[]{orderId.toString()})));

        if (!order.getTenantId().equals(tenantId)) {
            throw new NotFoundException(messageResolver.getMessage("error.order.not-found", new Object[]{orderId.toString()}));
        }

        if (order.getStatus() == OrderStatus.FULFILLED) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.order.cannot.cancel.fulfilled"));
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            return order; // Already cancelled
        }

        order.setStatus(OrderStatus.CANCELLED);
        if (CurrentUserContext.get() != null) {
            order.setUpdatedById(CurrentUserContext.get().userId());
        }
        order.setUpdatedAt(Instant.now());

        return orderCrudPort.save(order);
    }

    /**
     * Adjust stock levels based on order type and fulfillment.
     */
    private void adjustStock(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return;
        }

        UUID tenantId = order.getTenantId();
        UUID warehouseId = order.getWarehouseId();

        for (OrderItem item : order.getItems()) {
            if (item.getQtyFulfilled() == null || item.getQtyFulfilled() == 0) {
                continue; // Skip unfulfilled items
            }

            var stockOpt = stockCrudPort.findByMaterialAndWarehouseAndLot(
                    tenantId, item.getMaterialId(), warehouseId, null);

            if (stockOpt.isEmpty()) {
                log.warn("Stock not found for material {} in warehouse {}", item.getMaterialId(), warehouseId);
                continue;
            }

            var stock = stockOpt.get();
            double qtyFulfilled = item.getQtyFulfilled();

            if (order.getType() == OrderType.CONSUMPTION) {
                // Reduce stock (consumption)
                stock.setStockCurrent(stock.getStockCurrent() - qtyFulfilled);
                if (stock.getStockCurrent() < 0) {
                    stock.setStockCurrent(0.0);
                }
            } else if (order.getType() == OrderType.REPLENISHMENT) {
                // Increase stock (replenishment)
                stock.setStockCurrent(stock.getStockCurrent() + qtyFulfilled);
            }

            stockCrudPort.save(stock);
        }
    }

    /**
     * Emit replenishment event to procurement integration.
     */
    private void emitReplenishmentEvent(Order order) {
        try {
            log.info("Emitting replenishment event for order {}", order.getId());
            // TODO: Call procurement integration client
            // procurementIntegrationClient.createPurchaseRequest(order);
        } catch (Exception e) {
            log.error("Failed to emit replenishment event for order {}: {}", order.getId(), e.getMessage(), e);
            // Don't fail the transaction
        }
    }

    /**
     * Emit stock adjustment events for IoT integration.
     */
    private void emitStockAdjustmentEvents(Order order) {
        try {
            Map<String, Object> eventMetadata = new HashMap<>();
            eventMetadata.put("orderId", order.getId());
            eventMetadata.put("orderType", order.getType().name());
            eventMetadata.put("warehouseId", order.getWarehouseId());
            eventMetadata.put("timestamp", Instant.now().toString());

            if (CurrentUserContext.hasUser()) {
                var user = CurrentUserContext.get();
                eventMetadata.put("userId", user.userId());
            }

            // TODO: Load warehouse from warehouseId to pass to sendCustomEvent
            // For now, skip IoT event emission as it requires Warehouse object
            // iotEventGateway.sendCustomEvent("STOCK_ADJUSTMENT", warehouse, Map.of(
            //         "orderId", order.getId().toString(),
            //         "type", order.getType().name(),
            //         "warehouseId", order.getWarehouseId().toString()
            // ), eventMetadata);

        } catch (Exception e) {
            log.error("Failed to emit stock adjustment events for order {}: {}", order.getId(), e.getMessage(), e);
            // Don't fail the transaction
        }
    }
}


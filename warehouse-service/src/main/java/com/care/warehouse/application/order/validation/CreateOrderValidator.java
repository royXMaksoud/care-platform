package com.care.warehouse.application.order.validation;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.order.command.CreateOrderCommand;
import com.care.warehouse.domain.enums.OrderType;
import com.care.warehouse.domain.model.Order;
import com.care.warehouse.domain.ports.out.warehousematerialstock.WarehouseMaterialStockCrudPort;
import com.sharedlib.core.dto.ErrorResponse;
import com.sharedlib.core.exception.ValidationException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Validator for order creation.
 * Validates stock availability for consumption orders.
 */
@Component
@RequiredArgsConstructor
public class CreateOrderValidator {

    private final MessageResolver messageResolver;
    private final WarehouseMaterialStockCrudPort stockCrudPort;

    public void validate(CreateOrderCommand command, Order order) {
        List<ErrorResponse.ValidationError> errors = new ArrayList<>();

        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("tenantId")
                    .code("error.order.tenant.required")
                    .message(messageResolver.getMessage("error.order.tenant.required"))
                    .build());
        }

        if (command.getType() == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("type")
                    .code("error.order.type.required")
                    .message(messageResolver.getMessage("error.order.type.required"))
                    .build());
        }

        if (command.getWarehouseId() == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("warehouseId")
                    .code("error.order.warehouse.required")
                    .message(messageResolver.getMessage("error.order.warehouse.required"))
                    .build());
        }

        if (command.getItems() == null || command.getItems().isEmpty()) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("items")
                    .code("error.order.items.required")
                    .message(messageResolver.getMessage("error.order.items.required"))
                    .build());
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }

        // For consumption orders, validate stock availability
        if (command.getType() == OrderType.CONSUMPTION && tenantId != null && command.getWarehouseId() != null) {
            validateStockAvailability(command, tenantId, errors);
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }
    }

    private void validateStockAvailability(CreateOrderCommand command, UUID tenantId, 
                                          List<ErrorResponse.ValidationError> errors) {
        for (var itemCommand : command.getItems()) {
            var stockOpt = stockCrudPort.findByMaterialAndWarehouseAndLot(
                    tenantId, itemCommand.getMaterialId(), command.getWarehouseId(), null);
            
            if (stockOpt.isEmpty()) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("items")
                        .code("error.order.stock.not.found")
                        .message(messageResolver.getMessage("error.order.stock.not.found", 
                                new Object[]{itemCommand.getMaterialId(), command.getWarehouseId()}))
                        .build());
                continue;
            }

            var stock = stockOpt.get();
            double availableStock = stock.getAvailableStock();
            double requestedQty = itemCommand.getQtyRequested() != null ? itemCommand.getQtyRequested() : 0.0;

            if (availableStock < requestedQty) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("items")
                        .code("error.order.insufficient.stock")
                        .message(messageResolver.getMessage("error.order.insufficient.stock",
                                new Object[]{itemCommand.getMaterialId(), requestedQty, availableStock}))
                        .build());
            }
        }
    }
}


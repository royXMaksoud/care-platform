package com.care.warehouse.application.stock.validation;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.stock.command.CreateStockTransactionCommand;
import com.care.warehouse.domain.enums.StockTransactionType;
import com.care.warehouse.domain.model.Material;
import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.domain.ports.out.MaterialRepositoryPort;
import com.care.warehouse.domain.ports.out.WarehouseRepositoryPort;
import com.sharedlib.core.dto.ErrorResponse;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.exception.ValidationException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Validator for stock transaction creation.
 * 
 * Performs comprehensive validation before creating a stock transaction:
 * 
 * 1. **Tenant Validation**: Ensures tenantId is present (from TenantContext)
 * 
 * 2. **Material Validation**: 
 *    - Material must exist
 *    - Material must belong to current tenant
 *    - Material must be active and not deleted
 * 
 * 3. **Warehouse Validation**:
 *    - Source warehouse must exist (for OUT, TRANSFER, ADJUSTMENT decrease)
 *    - Target warehouse must exist (for IN, TRANSFER, ADJUSTMENT increase)
 *    - Warehouses must belong to current tenant
 *    - For TRANSFER: source != target
 * 
 * 4. **Quantity Validation**:
 *    - Quantity must be > 0
 *    - For OUT/TRANSFER: sufficient stock must be available
 * 
 * 5. **Transaction Type Logic Validation**:
 *    - IN: only targetWarehouseId required
 *    - OUT: only sourceWarehouseId required
 *    - TRANSFER: both required, source != target
 *    - ADJUSTMENT: at least one required
 * 
 * All validation errors are collected and thrown as ValidationException with
 * i18n-friendly error messages.
 * 
 * @author CARE Team
 */
@Component
@RequiredArgsConstructor
public class StockTransactionValidator {

    private final MaterialRepositoryPort materialRepositoryPort;
    private final WarehouseRepositoryPort warehouseRepositoryPort;
    private final MessageResolver messageResolver;

    /**
     * Validates a stock transaction command before creation.
     * 
     * @param command Create stock transaction command
     * @throws ValidationException if validation fails with detailed error messages
     * @throws NotFoundException if material or warehouse not found
     */
    public void validate(CreateStockTransactionCommand command) {
        if (command == null) {
            throw new ValidationException("error.validation", List.of(
                    ErrorResponse.ValidationError.builder()
                            .field(null)
                            .code("error.validation")
                            .message(messageResolver.getMessage("error.validation"))
                            .build()
            ));
        }

        List<ErrorResponse.ValidationError> errors = new ArrayList<>();

        // Validate tenantId presence (from TenantContext, not from client)
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("tenantId")
                    .code("error.stock.tenant.required")
                    .message(messageResolver.getMessage("error.stock.tenant.required"))
                    .build());
        }

        // Validate materialId
        UUID materialId = command.getMaterialId();
        if (materialId == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("materialId")
                    .code("error.stock.material.required")
                    .message(messageResolver.getMessage("error.stock.material.required"))
                    .build());
        } else if (tenantId != null) {
            // Validate material exists and belongs to tenant
            Material material = materialRepositoryPort.load(materialId)
                    .orElseThrow(() -> new NotFoundException(messageResolver.getMessage("error.material.not-found", 
                            new Object[]{materialId.toString()})));
            if (!material.getTenantId().equals(tenantId)) {
                throw new NotFoundException(messageResolver.getMessage("error.material.not-found", 
                        new Object[]{materialId.toString()}));
            }
            if (Boolean.TRUE.equals(material.getIsDeleted()) || !Boolean.TRUE.equals(material.getIsActive())) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("materialId")
                        .code("error.stock.material.inactive")
                        .message(messageResolver.getMessage("error.stock.material.inactive"))
                        .build());
            }
        }

        // Validate transactionType
        StockTransactionType transactionType = command.getTransactionType();
        if (transactionType == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("transactionType")
                    .code("error.stock.transactionType.required")
                    .message(messageResolver.getMessage("error.stock.transactionType.required"))
                    .build());
        }

        // Validate quantity
        BigDecimal quantity = command.getQuantity();
        if (quantity == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("quantity")
                    .code("error.stock.quantity.required")
                    .message(messageResolver.getMessage("error.stock.quantity.required"))
                    .build());
        } else if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("quantity")
                    .code("error.stock.quantity.invalid")
                    .message(messageResolver.getMessage("error.stock.quantity.invalid"))
                    .build());
        }

        // Validate warehouses based on transaction type
        if (transactionType != null && tenantId != null) {
            validateWarehouses(command, transactionType, tenantId, errors);
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }
    }

    /**
     * Validates warehouse requirements based on transaction type.
     * 
     * @param command Transaction command
     * @param transactionType Transaction type
     * @param tenantId Tenant ID
     * @param errors List to collect validation errors
     */
    private void validateWarehouses(CreateStockTransactionCommand command, 
                                     StockTransactionType transactionType, 
                                     UUID tenantId, 
                                     List<ErrorResponse.ValidationError> errors) {
        UUID sourceWarehouseId = command.getSourceWarehouseId();
        UUID targetWarehouseId = command.getTargetWarehouseId();

        switch (transactionType) {
            case IN:
                // IN: only targetWarehouseId required
                if (targetWarehouseId == null) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("targetWarehouseId")
                            .code("error.stock.targetWarehouse.required")
                            .message(messageResolver.getMessage("error.stock.targetWarehouse.required"))
                            .build());
                } else {
                    validateWarehouse(targetWarehouseId, tenantId, "targetWarehouseId", errors);
                }
                if (sourceWarehouseId != null) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("sourceWarehouseId")
                            .code("error.stock.sourceWarehouse.notAllowed")
                            .message(messageResolver.getMessage("error.stock.sourceWarehouse.notAllowed"))
                            .build());
                }
                break;

            case OUT:
                // OUT: only sourceWarehouseId required
                if (sourceWarehouseId == null) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("sourceWarehouseId")
                            .code("error.stock.sourceWarehouse.required")
                            .message(messageResolver.getMessage("error.stock.sourceWarehouse.required"))
                            .build());
                } else {
                    validateWarehouse(sourceWarehouseId, tenantId, "sourceWarehouseId", errors);
                }
                if (targetWarehouseId != null) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("targetWarehouseId")
                            .code("error.stock.targetWarehouse.notAllowed")
                            .message(messageResolver.getMessage("error.stock.targetWarehouse.notAllowed"))
                            .build());
                }
                break;

            case TRANSFER:
                // TRANSFER: both required, source != target
                if (sourceWarehouseId == null) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("sourceWarehouseId")
                            .code("error.stock.sourceWarehouse.required")
                            .message(messageResolver.getMessage("error.stock.sourceWarehouse.required"))
                            .build());
                } else {
                    validateWarehouse(sourceWarehouseId, tenantId, "sourceWarehouseId", errors);
                }
                if (targetWarehouseId == null) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("targetWarehouseId")
                            .code("error.stock.targetWarehouse.required")
                            .message(messageResolver.getMessage("error.stock.targetWarehouse.required"))
                            .build());
                } else {
                    validateWarehouse(targetWarehouseId, tenantId, "targetWarehouseId", errors);
                }
                if (sourceWarehouseId != null && targetWarehouseId != null && 
                    sourceWarehouseId.equals(targetWarehouseId)) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("targetWarehouseId")
                            .code("error.stock.transfer.sameWarehouse")
                            .message(messageResolver.getMessage("error.stock.transfer.sameWarehouse"))
                            .build());
                }
                break;

            case ADJUSTMENT:
                // ADJUSTMENT: at least one required
                if (sourceWarehouseId == null && targetWarehouseId == null) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("sourceWarehouseId")
                            .code("error.stock.adjustment.warehouse.required")
                            .message(messageResolver.getMessage("error.stock.adjustment.warehouse.required"))
                            .build());
                }
                if (sourceWarehouseId != null) {
                    validateWarehouse(sourceWarehouseId, tenantId, "sourceWarehouseId", errors);
                }
                if (targetWarehouseId != null) {
                    validateWarehouse(targetWarehouseId, tenantId, "targetWarehouseId", errors);
                }
                break;
        }
    }

    /**
     * Validates that a warehouse exists and belongs to the tenant.
     * 
     * @param warehouseId Warehouse ID
     * @param tenantId Tenant ID
     * @param fieldName Field name for error reporting
     * @param errors List to collect validation errors
     */
    private void validateWarehouse(UUID warehouseId, UUID tenantId, String fieldName, 
                                    List<ErrorResponse.ValidationError> errors) {
        Warehouse warehouse = warehouseRepositoryPort.load(warehouseId)
                .orElseThrow(() -> new NotFoundException(messageResolver.getMessage("error.warehouse.not-found", 
                        new Object[]{warehouseId.toString()})));
        if (!warehouse.getTenantId().equals(tenantId)) {
            throw new NotFoundException(messageResolver.getMessage("error.warehouse.not-found", 
                    new Object[]{warehouseId.toString()}));
        }
        if (Boolean.TRUE.equals(warehouse.getIsDeleted()) || !Boolean.TRUE.equals(warehouse.getIsActive())) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field(fieldName)
                    .code("error.stock.warehouse.inactive")
                    .message(messageResolver.getMessage("error.stock.warehouse.inactive"))
                    .build());
        }
    }
}


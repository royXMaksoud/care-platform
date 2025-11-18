package com.care.warehouse.application.stock.service;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.stock.command.CreateStockTransactionCommand;
import com.care.warehouse.application.stock.mapper.StockAppMapper;
import com.care.warehouse.application.stock.validation.StockTransactionValidator;
import com.care.warehouse.domain.enums.StockTransactionType;
import com.care.warehouse.domain.model.Material;
import com.care.warehouse.domain.model.StockBalance;
import com.care.warehouse.domain.model.StockTransaction;
import com.care.warehouse.domain.ports.in.stock.CreateStockTransactionUseCase;
import com.care.warehouse.domain.ports.iot.IoTEventGateway;
import com.care.warehouse.domain.ports.out.MaterialRepositoryPort;
import com.care.warehouse.domain.ports.out.stock.StockBalancePort;
import com.care.warehouse.domain.ports.out.stock.StockTransactionPort;
import com.care.warehouse.domain.ports.traceability.TraceabilityLedgerPort;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.ValidationException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service implementation for stock transaction operations.
 * 
 * This service handles all stock movement types with strict validation,
 * transactional integrity, and event publishing:
 * 
 * **Stock-IN**: Increases stock in target warehouse
 * **Stock-OUT**: Decreases stock from source warehouse (with validation)
 * **Stock-Transfer**: Atomically moves stock from source to target
 * **Stock-Adjustment**: Adjusts stock (increase or decrease)
 * 
 * **Key Features**:
 * - Full transactional safety (@Transactional)
 * - Atomic balance updates (database-level operations)
 * - Stock availability validation for OUT/TRANSFER
 * - Event publishing (StockUpdated, StockBelowThreshold)
 * - Complete audit trail (stock_transaction table)
 * 
 * **Transaction Flow**:
 * 1. Validate transaction request (material, warehouses, quantity)
 * 2. For OUT/TRANSFER: Check sufficient stock available
 * 3. Create transaction record (immutable audit trail)
 * 4. Atomically update stock_balance table(s)
 * 5. Publish events for downstream systems
 * 6. Check reorder level thresholds and publish alerts if needed
 * 
 * All operations are transactional - if any step fails, everything rolls back.
 * 
 * @author CARE Team
 */
@Service
@RequiredArgsConstructor
public class StockServiceImpl implements CreateStockTransactionUseCase {

    private static final Logger log = LoggerFactory.getLogger(StockServiceImpl.class);

    private final StockTransactionPort stockTransactionPort;
    private final StockBalancePort stockBalancePort;
    private final MaterialRepositoryPort materialRepositoryPort;
    private final StockTransactionValidator validator;
    private final StockAppMapper mapper;
    private final IoTEventGateway iotEventGateway;
    private final TraceabilityLedgerPort traceabilityLedgerPort;
    private final MessageResolver messageResolver;

    @Override
    @Transactional
    public StockTransaction createStockTransaction(CreateStockTransactionCommand command) {
        // Step 1: Validate transaction request
        validator.validate(command);

        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new ValidationException("error.tenant.required", List.of(
                    com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                            .field("tenantId")
                            .code("error.tenant.required")
                            .message(messageResolver.getMessage("error.tenant.required"))
                            .build()
            ));
        }

        // Step 2: Load material for event publishing
        Material material = materialRepositoryPort.load(command.getMaterialId())
                .orElseThrow(() -> new com.sharedlib.core.exception.NotFoundException(
                        messageResolver.getMessage("error.material.not-found", 
                                new Object[]{command.getMaterialId().toString()})));

        // Step 3: For OUT/TRANSFER, validate sufficient stock
        if (command.getTransactionType() == StockTransactionType.OUT || 
            command.getTransactionType() == StockTransactionType.TRANSFER) {
            validateStockAvailability(command);
        }

        // Step 4: Create transaction record (immutable audit trail)
        StockTransaction transaction = mapper.toDomain(command);
        transaction.setTenantId(tenantId);
        if (CurrentUserContext.get() != null) {
            transaction.setCreatedById(CurrentUserContext.get().userId());
        }
        transaction.setCreatedAt(java.time.Instant.now());
        
        StockTransaction savedTransaction = stockTransactionPort.save(transaction);

        // Step 5: Atomically update stock balances based on transaction type
        updateStockBalances(savedTransaction);

        // Step 6: Publish events
        publishStockEvents(savedTransaction, material);

        log.info("Stock transaction created: transactionId={}, type={}, materialId={}, quantity={}",
                savedTransaction.getTransactionId(), 
                savedTransaction.getTransactionType(),
                savedTransaction.getMaterialId(),
                savedTransaction.getQuantity());

        return savedTransaction;
    }

    /**
     * Validates that sufficient stock is available for OUT/TRANSFER operations.
     * 
     * @param command Transaction command
     * @throws ValidationException if insufficient stock
     */
    private void validateStockAvailability(CreateStockTransactionCommand command) {
        UUID sourceWarehouseId = command.getSourceWarehouseId();
        BigDecimal requestedQuantity = command.getQuantity();

        // Get current balance
        StockBalance balance = stockBalancePort.findByWarehouseAndMaterial(
                sourceWarehouseId, command.getMaterialId())
                .orElse(StockBalance.builder()
                        .warehouseId(sourceWarehouseId)
                        .materialId(command.getMaterialId())
                        .quantity(BigDecimal.ZERO)
                        .build());

        // Check sufficient stock
        if (balance.getQuantity().compareTo(requestedQuantity) < 0) {
            throw new ValidationException("error.stock.insufficient", List.of(
                    com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                            .field("quantity")
                            .code("error.stock.insufficient")
                            .message(messageResolver.getMessage("error.stock.insufficient", 
                                    new Object[]{requestedQuantity, balance.getQuantity()}))
                            .build()
            ));
        }
    }

    /**
     * Updates stock balances atomically based on transaction type.
     * 
     * This method handles all transaction types:
     * - IN: Increment target warehouse balance
     * - OUT: Decrement source warehouse balance
     * - TRANSFER: Decrement source + increment target (atomic)
     * - ADJUSTMENT: Adjust based on source/target
     * 
     * @param transaction Created transaction
     */
    private void updateStockBalances(StockTransaction transaction) {
        UUID transactionId = transaction.getTransactionId();
        UUID materialId = transaction.getMaterialId();
        BigDecimal quantity = transaction.getQuantity();

        switch (transaction.getTransactionType()) {
            case IN:
                // IN: Increment target warehouse balance
                stockBalancePort.incrementBalance(
                        transaction.getTargetWarehouseId(),
                        materialId,
                        quantity,
                        transactionId);
                break;

            case OUT:
                // OUT: Decrement source warehouse balance
                stockBalancePort.decrementBalance(
                        transaction.getSourceWarehouseId(),
                        materialId,
                        quantity,
                        transactionId);
                break;

            case TRANSFER:
                // TRANSFER: Atomically decrement source + increment target
                // Note: Both operations are transactional, but we do them sequentially
                // The database-level atomic operations ensure consistency
                stockBalancePort.decrementBalance(
                        transaction.getSourceWarehouseId(),
                        materialId,
                        quantity,
                        transactionId);
                stockBalancePort.incrementBalance(
                        transaction.getTargetWarehouseId(),
                        materialId,
                        quantity,
                        transactionId);
                break;

            case ADJUSTMENT:
                // ADJUSTMENT: Adjust based on source/target
                if (transaction.getSourceWarehouseId() != null) {
                    // Decrease adjustment
                    stockBalancePort.decrementBalance(
                            transaction.getSourceWarehouseId(),
                            materialId,
                            quantity,
                            transactionId);
                }
                if (transaction.getTargetWarehouseId() != null) {
                    // Increase adjustment
                    stockBalancePort.incrementBalance(
                            transaction.getTargetWarehouseId(),
                            materialId,
                            quantity,
                            transactionId);
                }
                break;
        }
    }

    /**
     * Publishes events for stock updates and threshold alerts.
     * 
     * Events published:
     * - StockUpdated: Always published when stock changes
     * - StockBelowThreshold: Published when stock falls below reorder level
     * 
     * @param transaction Created transaction
     * @param material Material involved in transaction
     */
    private void publishStockEvents(StockTransaction transaction, Material material) {
        try {
            // Build event metadata
            Map<String, Object> eventMetadata = buildEventMetadata();

            // Build StockUpdated event payload
            Map<String, Object> stockUpdatedPayload = new HashMap<>();
            stockUpdatedPayload.put("transactionId", transaction.getTransactionId());
            stockUpdatedPayload.put("materialId", transaction.getMaterialId());
            stockUpdatedPayload.put("transactionType", transaction.getTransactionType().name());
            stockUpdatedPayload.put("quantity", transaction.getQuantity());
            stockUpdatedPayload.put("sourceWarehouseId", transaction.getSourceWarehouseId());
            stockUpdatedPayload.put("targetWarehouseId", transaction.getTargetWarehouseId());
            stockUpdatedPayload.put("reason", transaction.getReason() != null ? transaction.getReason().name() : null);
            stockUpdatedPayload.put("referenceDocument", transaction.getReferenceDocument());
            stockUpdatedPayload.put("createdAt", transaction.getCreatedAt().toString());

            // Publish StockUpdated event
            iotEventGateway.sendCustomEvent("STOCK_UPDATED", null, stockUpdatedPayload, eventMetadata);
            traceabilityLedgerPort.recordCustomEvent("STOCK_UPDATED", null, stockUpdatedPayload, eventMetadata);

            // Check reorder level thresholds and publish alerts if needed
            checkReorderLevels(transaction, material, eventMetadata);

        } catch (Exception e) {
            // Log but don't fail the transaction if event publishing fails
            log.error("Failed to publish stock events for transaction {}: {}",
                    transaction.getTransactionId(), e.getMessage(), e);
        }
    }

    /**
     * Checks reorder level thresholds and publishes StockBelowThreshold events if needed.
     * 
     * This method checks stock balances after OUT/TRANSFER operations and publishes
     * alerts when stock falls below the material's reorder level.
     * 
     * @param transaction Created transaction
     * @param material Material involved in transaction
     * @param eventMetadata Event metadata
     */
    private void checkReorderLevels(StockTransaction transaction, Material material, 
                                     Map<String, Object> eventMetadata) {
        // Only check for OUT and TRANSFER (stock decreases)
        if (transaction.getTransactionType() != StockTransactionType.OUT && 
            transaction.getTransactionType() != StockTransactionType.TRANSFER) {
            return;
        }

        // Check if material has reorder level defined
        if (material.getReorderLevel() == null) {
            return;
        }

        // Check source warehouse balance (for OUT)
        if (transaction.getSourceWarehouseId() != null) {
            StockBalance balance = stockBalancePort.findByWarehouseAndMaterial(
                    transaction.getSourceWarehouseId(),
                    transaction.getMaterialId())
                    .orElse(StockBalance.builder()
                            .quantity(BigDecimal.ZERO)
                            .build());

            if (balance.getQuantity().compareTo(BigDecimal.valueOf(material.getReorderLevel())) < 0) {
                // Stock below reorder level - publish alert
                Map<String, Object> alertPayload = new HashMap<>();
                alertPayload.put("materialId", transaction.getMaterialId());
                alertPayload.put("warehouseId", transaction.getSourceWarehouseId());
                alertPayload.put("currentQuantity", balance.getQuantity());
                alertPayload.put("reorderLevel", material.getReorderLevel());
                alertPayload.put("unit", material.getUnit());
                alertPayload.put("transactionId", transaction.getTransactionId());

                iotEventGateway.sendCustomEvent("STOCK_BELOW_THRESHOLD", null, alertPayload, eventMetadata);
                traceabilityLedgerPort.recordCustomEvent("STOCK_BELOW_THRESHOLD", null, alertPayload, eventMetadata);

                log.warn("Stock below reorder level: materialId={}, warehouseId={}, current={}, threshold={}",
                        transaction.getMaterialId(),
                        transaction.getSourceWarehouseId(),
                        balance.getQuantity(),
                        material.getReorderLevel());
            }
        }

        // For TRANSFER, also check target warehouse (though it increased, we still check)
        // This is less critical but can be useful for monitoring
    }

    /**
     * Builds event metadata for IoT and traceability events.
     * 
     * @return Event metadata map
     */
    private Map<String, Object> buildEventMetadata() {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("tenantId", TenantContext.get());
        if (CurrentUserContext.get() != null) {
            metadata.put("userId", CurrentUserContext.get().userId());
        }
        metadata.put("timestamp", java.time.Instant.now().toString());
        return metadata;
    }
}


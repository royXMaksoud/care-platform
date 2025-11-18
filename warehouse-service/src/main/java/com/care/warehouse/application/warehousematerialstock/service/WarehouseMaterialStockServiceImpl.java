package com.care.warehouse.application.warehousematerialstock.service;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.warehousematerialstock.command.ReleaseStockCommand;
import com.care.warehouse.application.warehousematerialstock.command.ReserveStockCommand;
import com.care.warehouse.application.warehousematerialstock.command.UpdateStockCommand;
import com.care.warehouse.domain.model.WarehouseMaterialStock;
import com.care.warehouse.domain.ports.in.warehousematerialstock.*;
import com.care.warehouse.domain.ports.out.warehousematerialstock.WarehouseMaterialStockCrudPort;
import com.care.warehouse.infrastructure.client.NotificationClient;
import com.sharedlib.core.context.CurrentUserContext;
import com.care.warehouse.application.common.exception.WarehouseBusinessException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * WarehouseMaterialStockServiceImpl implements use cases for stock management.
 * Handles stock updates, reservations, releases, and threshold checking.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseMaterialStockServiceImpl
        implements UpdateStockUseCase, ReserveStockUseCase, ReleaseStockUseCase, CheckThresholdUseCase {

    private final WarehouseMaterialStockCrudPort stockCrudPort;
    private final MessageResolver messageResolver;
    private final NotificationClient notificationClient;

    @Override
    @Transactional
    public WarehouseMaterialStock updateStock(UpdateStockCommand command) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.stock.tenant.required"));
        }

        // Get or create stock record
        WarehouseMaterialStock stock = getOrCreateStock(command.getMaterialId(), command.getWarehouseId());

        // Update stock levels
        if (command.getStockCurrent() != null) {
            stock.setStockCurrent(command.getStockCurrent());
        }
        if (command.getStockReserved() != null) {
            // Validate reserved doesn't exceed current
            if (command.getStockReserved() > stock.getStockCurrent()) {
                throw new WarehouseBusinessException(messageResolver.getMessage("error.stock.reserved.exceeds.current"));
            }
            stock.setStockReserved(command.getStockReserved());
        }
        if (command.getReorderLevel() != null) {
            stock.setReorderLevel(command.getReorderLevel());
        }
        if (command.getExpiryDate() != null) {
            stock.setExpiryDate(command.getExpiryDate());
        }
        if (command.getLotNumber() != null) {
            stock.setLotNumber(command.getLotNumber());
        }
        if (command.getBinLocationCode() != null) {
            stock.setBinLocationCode(command.getBinLocationCode());
        }

        // Maintain audit fields
        if (CurrentUserContext.get() != null) {
            stock.setUpdatedById(CurrentUserContext.get().userId());
        }

        // Save and check threshold
        WarehouseMaterialStock saved = stockCrudPort.save(stock);
        
        // Check threshold after update
        checkThreshold(saved.getId());
        
        return saved;
    }

    @Override
    @Transactional
    public WarehouseMaterialStock getOrCreateStock(UUID materialId, UUID warehouseId) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.stock.tenant.required"));
        }

        // Try to find existing stock
        var existing = stockCrudPort.findByMaterialAndWarehouseAndLot(tenantId, materialId, warehouseId, null);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Create new stock record
        WarehouseMaterialStock newStock = WarehouseMaterialStock.builder()
                .tenantId(tenantId)
                .materialId(materialId)
                .warehouseId(warehouseId)
                .stockCurrent(0.0)
                .stockReserved(0.0)
                .isActive(true)
                .isDeleted(false)
                .build();

        if (CurrentUserContext.get() != null) {
            newStock.setCreatedById(CurrentUserContext.get().userId());
        }

        return stockCrudPort.save(newStock);
    }

    @Override
    @Transactional
    public WarehouseMaterialStock reserveStock(ReserveStockCommand command) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.stock.tenant.required"));
        }

        // Get stock record
        WarehouseMaterialStock stock = getOrCreateStock(command.getMaterialId(), command.getWarehouseId());

        // Validate available stock
        Double availableStock = stock.getAvailableStock();
        if (availableStock < command.getQuantity()) {
            throw new WarehouseBusinessException(
                    messageResolver.getMessage("error.stock.insufficient.available", 
                            new Object[]{availableStock, command.getQuantity()}));
        }

        // Reserve stock
        stock.setStockReserved(stock.getStockReserved() + command.getQuantity());

        // Maintain audit fields
        if (CurrentUserContext.get() != null) {
            stock.setUpdatedById(CurrentUserContext.get().userId());
        }

        WarehouseMaterialStock saved = stockCrudPort.save(stock);
        
        // Check threshold after reservation
        checkThreshold(saved.getId());
        
        return saved;
    }

    @Override
    @Transactional
    public WarehouseMaterialStock releaseStock(ReleaseStockCommand command) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.stock.tenant.required"));
        }

        // Get stock record
        var stockOpt = stockCrudPort.findByMaterialAndWarehouseAndLot(
                tenantId, command.getMaterialId(), command.getWarehouseId(), command.getLotNumber());
        
        if (stockOpt.isEmpty()) {
            throw new WarehouseBusinessException(messageResolver.getMessage("error.stock.not-found"));
        }

        WarehouseMaterialStock stock = stockOpt.get();

        // Validate reserved stock
        if (stock.getStockReserved() < command.getQuantity()) {
            throw new WarehouseBusinessException(
                    messageResolver.getMessage("error.stock.insufficient.reserved", 
                            new Object[]{stock.getStockReserved(), command.getQuantity()}));
        }

        // Release stock
        stock.setStockReserved(stock.getStockReserved() - command.getQuantity());

        // Maintain audit fields
        if (CurrentUserContext.get() != null) {
            stock.setUpdatedById(CurrentUserContext.get().userId());
        }

        WarehouseMaterialStock saved = stockCrudPort.save(stock);
        
        // Check threshold after release
        checkThreshold(saved.getId());
        
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkThreshold(UUID stockId) {
        var stockOpt = stockCrudPort.load(stockId);
        if (stockOpt.isEmpty()) {
            return false;
        }

        WarehouseMaterialStock stock = stockOpt.get();
        
        if (stock.isBelowReorderLevel()) {
            // Send notification
            sendReorderNotification(stock);
            return true;
        }
        
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseMaterialStock> checkAllThresholds(UUID tenantId) {
        List<WarehouseMaterialStock> stocksBelowThreshold = stockCrudPort.findBelowReorderLevel(tenantId);
        
        // Send notifications for all stocks below threshold
        for (WarehouseMaterialStock stock : stocksBelowThreshold) {
            sendReorderNotification(stock);
        }
        
        return stocksBelowThreshold;
    }

    /**
     * Send reorder notification via notification service.
     */
    private void sendReorderNotification(WarehouseMaterialStock stock) {
        try {
            // Build notification message
            String message = messageResolver.getMessage("notification.stock.below.reorder.level",
                    new Object[]{
                            stock.getMaterialId(),
                            stock.getWarehouseId(),
                            stock.getStockCurrent(),
                            stock.getReorderLevel()
                    });

            // Call notification service (stub for now)
            // TODO: Implement actual notification service call
            log.warn("STOCK_THRESHOLD_ALERT | materialId={} | warehouseId={} | current={} | reorderLevel={} | message={}",
                    stock.getMaterialId(), stock.getWarehouseId(), stock.getStockCurrent(), 
                    stock.getReorderLevel(), message);
            
            // notificationServiceClient.sendNotification(...);
            
        } catch (Exception e) {
            log.error("Failed to send reorder notification for stock {}: {}", stock.getId(), e.getMessage(), e);
            // Don't fail the transaction if notification fails
        }
    }
}


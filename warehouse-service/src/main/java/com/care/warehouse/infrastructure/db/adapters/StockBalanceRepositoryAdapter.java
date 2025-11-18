package com.care.warehouse.infrastructure.db.adapters;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.StockBalance;
import com.care.warehouse.domain.ports.out.stock.StockBalancePort;
import com.care.warehouse.infrastructure.db.entities.StockBalanceEntity;
import com.care.warehouse.infrastructure.db.mappers.StockBalanceJpaMapper;
import com.care.warehouse.infrastructure.db.repository.StockBalanceJpaRepository;
import com.sharedlib.core.exception.ValidationException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adapter implementation for StockBalancePort.
 * 
 * Handles stock balance persistence operations with composite primary key.
 * Provides atomic increment/decrement operations for thread-safety.
 * 
 * @author CARE Team
 */
@Component
@RequiredArgsConstructor
public class StockBalanceRepositoryAdapter implements StockBalancePort {

    private final StockBalanceJpaRepository repository;
    private final StockBalanceJpaMapper mapper;
    private final MessageResolver messageResolver;

    @Override
    @Transactional(readOnly = true)
    public Optional<StockBalance> findByWarehouseAndMaterial(UUID warehouseId, UUID materialId) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return Optional.empty();
        }
        
        return repository.findByWarehouseIdAndMaterialId(warehouseId, materialId)
                .filter(entity -> entity.getTenantId().equals(tenantId))
                .map(mapper::toDomain);
    }

    @Override
    @Transactional
    public StockBalance save(StockBalance balance) {
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
        
        // Ensure tenant ID is set
        balance.setTenantId(tenantId);
        
        StockBalanceEntity entity = mapper.toEntity(balance);
        StockBalanceEntity saved = repository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public StockBalance incrementBalance(UUID warehouseId, UUID materialId, BigDecimal quantity, UUID transactionId) {
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
        
        // Check if balance exists
        Optional<StockBalanceEntity> existingOpt = repository.findByWarehouseIdAndMaterialId(warehouseId, materialId);
        
        if (existingOpt.isPresent()) {
            // Balance exists - use atomic increment
            StockBalanceEntity existing = existingOpt.get();
            if (!existing.getTenantId().equals(tenantId)) {
                throw new ValidationException("error.stock.tenant.mismatch", List.of(
                        com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                                .field("warehouseId")
                                .code("error.stock.tenant.mismatch")
                                .message(messageResolver.getMessage("error.stock.tenant.mismatch"))
                                .build()
                ));
            }
            
            int updated = repository.incrementBalance(warehouseId, materialId, quantity, transactionId);
            if (updated == 0) {
                throw new ValidationException("error.stock.balance.update.failed", List.of(
                        com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                                .field("warehouseId")
                                .code("error.stock.balance.update.failed")
                                .message(messageResolver.getMessage("error.stock.balance.update.failed"))
                                .build()
                ));
            }
            
            // Reload to get updated values
            return repository.findByWarehouseIdAndMaterialId(warehouseId, materialId)
                    .map(mapper::toDomain)
                    .orElseThrow(() -> new ValidationException("error.stock.balance.notFound", List.of(
                            com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                                    .field("warehouseId")
                                    .code("error.stock.balance.notFound")
                                    .message(messageResolver.getMessage("error.stock.balance.notFound"))
                                    .build()
                    )));
        } else {
            // Balance doesn't exist - create new with increment value
            StockBalance newBalance = StockBalance.builder()
                    .warehouseId(warehouseId)
                    .materialId(materialId)
                    .tenantId(tenantId)
                    .quantity(quantity)
                    .lastTransactionId(transactionId)
                    .build();
            
            return save(newBalance);
        }
    }

    @Override
    @Transactional
    public StockBalance decrementBalance(UUID warehouseId, UUID materialId, BigDecimal quantity, UUID transactionId) {
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
        
        // Check if balance exists and has sufficient stock
        Optional<StockBalanceEntity> existingOpt = repository.findByWarehouseIdAndMaterialId(warehouseId, materialId);
        
        if (existingOpt.isEmpty()) {
            throw new ValidationException("error.stock.insufficient", List.of(
                    com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                            .field("quantity")
                            .code("error.stock.insufficient")
                            .message(messageResolver.getMessage("error.stock.insufficient", new Object[]{quantity}))
                            .build()
            ));
        }
        
        StockBalanceEntity existing = existingOpt.get();
        if (!existing.getTenantId().equals(tenantId)) {
            throw new ValidationException("error.stock.tenant.mismatch", List.of(
                    com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                            .field("warehouseId")
                            .code("error.stock.tenant.mismatch")
                            .message(messageResolver.getMessage("error.stock.tenant.mismatch"))
                            .build()
            ));
        }
        
        // Check sufficient stock
        if (existing.getQuantity().compareTo(quantity) < 0) {
            throw new ValidationException("error.stock.insufficient", List.of(
                    com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                            .field("quantity")
                            .code("error.stock.insufficient")
                            .message(messageResolver.getMessage("error.stock.insufficient", 
                                    new Object[]{quantity, existing.getQuantity()}))
                            .build()
            ));
        }
        
        // Use atomic decrement (validates quantity >= decrement at database level)
        int updated = repository.decrementBalance(warehouseId, materialId, quantity, transactionId);
        if (updated == 0) {
            throw new ValidationException("error.stock.insufficient", List.of(
                    com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                            .field("quantity")
                            .code("error.stock.insufficient")
                            .message(messageResolver.getMessage("error.stock.insufficient", new Object[]{quantity}))
                            .build()
            ));
        }
        
        // Reload to get updated values
        return repository.findByWarehouseIdAndMaterialId(warehouseId, materialId)
                .map(mapper::toDomain)
                .orElseThrow(() -> new ValidationException("error.stock.balance.notFound", List.of(
                        com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                                .field("warehouseId")
                                .code("error.stock.balance.notFound")
                                .message(messageResolver.getMessage("error.stock.balance.notFound"))
                                .build()
                )));
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockBalance> findByWarehouse(UUID warehouseId) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return List.of();
        }
        
        return repository.findByTenantIdAndWarehouseId(tenantId, warehouseId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockBalance> findByMaterial(UUID materialId) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return List.of();
        }
        
        return repository.findByTenantIdAndMaterialId(tenantId, materialId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getAggregatedBalance(UUID materialId) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal aggregated = repository.getAggregatedBalance(tenantId, materialId);
        return aggregated != null ? aggregated : BigDecimal.ZERO;
    }
}


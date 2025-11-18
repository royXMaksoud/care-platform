package com.care.warehouse.web.controller;

import com.care.warehouse.application.warehousematerialstock.command.ReleaseStockCommand;
import com.care.warehouse.application.warehousematerialstock.command.ReserveStockCommand;
import com.care.warehouse.application.warehousematerialstock.command.UpdateStockCommand;
import com.care.warehouse.domain.model.WarehouseMaterialStock;
import com.care.warehouse.domain.ports.in.warehousematerialstock.*;
import com.care.warehouse.web.dto.warehousematerialstock.ReleaseStockRequest;
import com.care.warehouse.web.dto.warehousematerialstock.ReserveStockRequest;
import com.care.warehouse.web.dto.warehousematerialstock.UpdateStockRequest;
import com.care.warehouse.web.dto.warehousematerialstock.WarehouseMaterialStockResponse;
import com.care.warehouse.web.mapper.WarehouseMaterialStockWebMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for Warehouse Material Stock management.
 * 
 * All endpoints are under /api/warehouse/v1/stock
 * Tenant isolation is enforced automatically via TenantContext.
 */
@RestController
@RequestMapping("/api/warehouse/v1/stock")
@RequiredArgsConstructor
@Tag(name = "Stock Management", description = "APIs for managing stock levels per warehouse per material")
public class WarehouseMaterialStockController {

    private final UpdateStockUseCase updateStockUseCase;
    private final ReserveStockUseCase reserveStockUseCase;
    private final ReleaseStockUseCase releaseStockUseCase;
    private final CheckThresholdUseCase checkThresholdUseCase;
    private final WarehouseMaterialStockWebMapper mapper;

    @PutMapping
    @Operation(summary = "Update stock levels", description = "Updates stock levels for a material in a warehouse")
    @ApiResponse(responseCode = "200", description = "Stock updated successfully",
            content = @Content(schema = @Schema(implementation = WarehouseMaterialStockResponse.class)))
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<WarehouseMaterialStockResponse> updateStock(@Valid @RequestBody UpdateStockRequest request) {
        UpdateStockCommand command = mapper.toUpdateCommand(request);
        WarehouseMaterialStock stock = updateStockUseCase.updateStock(command);
        return ResponseEntity.ok(mapper.toResponse(stock));
    }

    @PostMapping("/reserve")
    @Operation(summary = "Reserve stock", description = "Reserves stock (allocates for orders)")
    @ApiResponse(responseCode = "200", description = "Stock reserved successfully",
            content = @Content(schema = @Schema(implementation = WarehouseMaterialStockResponse.class)))
    @ApiResponse(responseCode = "400", description = "Validation error or insufficient stock")
    public ResponseEntity<WarehouseMaterialStockResponse> reserveStock(@Valid @RequestBody ReserveStockRequest request) {
        ReserveStockCommand command = mapper.toReserveCommand(request);
        WarehouseMaterialStock stock = reserveStockUseCase.reserveStock(command);
        return ResponseEntity.ok(mapper.toResponse(stock));
    }

    @PostMapping("/release")
    @Operation(summary = "Release reserved stock", description = "Releases reserved stock (when order is cancelled or shipped)")
    @ApiResponse(responseCode = "200", description = "Stock released successfully",
            content = @Content(schema = @Schema(implementation = WarehouseMaterialStockResponse.class)))
    @ApiResponse(responseCode = "400", description = "Validation error or insufficient reserved stock")
    public ResponseEntity<WarehouseMaterialStockResponse> releaseStock(@Valid @RequestBody ReleaseStockRequest request) {
        ReleaseStockCommand command = mapper.toReleaseCommand(request);
        WarehouseMaterialStock stock = releaseStockUseCase.releaseStock(command);
        return ResponseEntity.ok(mapper.toResponse(stock));
    }

    @PostMapping("/check-threshold/{stockId:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Check stock threshold", description = "Checks if stock is below reorder level and sends notification if needed")
    @ApiResponse(responseCode = "200", description = "Threshold checked")
    public ResponseEntity<Boolean> checkThreshold(@PathVariable UUID stockId) {
        boolean notificationSent = checkThresholdUseCase.checkThreshold(stockId);
        return ResponseEntity.ok(notificationSent);
    }

    @PostMapping("/check-thresholds/all")
    @Operation(summary = "Check all stock thresholds", description = "Checks all stocks below reorder level for current tenant and sends notifications")
    @ApiResponse(responseCode = "200", description = "Thresholds checked")
    public ResponseEntity<List<WarehouseMaterialStockResponse>> checkAllThresholds() {
        UUID tenantId = com.care.warehouse.application.common.context.TenantContext.get();
        
        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        List<WarehouseMaterialStock> stocks = checkThresholdUseCase.checkAllThresholds(tenantId);
        List<WarehouseMaterialStockResponse> responses = stocks.stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}


package com.care.warehouse.web.controller;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.StockBalance;
import com.care.warehouse.domain.model.StockTransaction;
import com.care.warehouse.domain.ports.in.stock.CreateStockTransactionUseCase;
import com.care.warehouse.domain.ports.out.stock.StockBalancePort;
import com.care.warehouse.domain.ports.out.stock.StockTransactionPort;
import com.care.warehouse.infrastructure.db.mappers.StockTransactionJpaMapper;
import com.care.warehouse.infrastructure.db.repository.StockTransactionJpaRepository;
import com.care.warehouse.web.dto.stock.CreateStockTransactionRequest;
import com.care.warehouse.web.dto.stock.StockBalanceResponse;
import com.care.warehouse.web.dto.stock.StockTransactionResponse;
import com.care.warehouse.web.mapper.StockWebMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for stock transaction and balance operations.
 * 
 * Provides endpoints for:
 * - Creating stock transactions (IN, OUT, TRANSFER, ADJUSTMENT)
 * - Searching stock transactions with filters
 * - Getting stock balances (per warehouse, per material, aggregated)
 * 
 * All operations are tenant-isolated and require authentication.
 * 
 * @author CARE Team
 */
@RestController
@RequestMapping("/api/warehouse/v1/stock")
@RequiredArgsConstructor
@Tag(name = "Stock Management", description = "APIs for managing stock transactions and balances")
public class StockController {

    private final CreateStockTransactionUseCase createStockTransactionUseCase;
    private final StockTransactionPort stockTransactionPort;
    private final StockBalancePort stockBalancePort;
    private final StockTransactionJpaRepository stockTransactionJpaRepository;
    private final StockTransactionJpaMapper stockTransactionJpaMapper;
    private final StockWebMapper mapper;

    @PostMapping("/transactions")
    @Operation(
            summary = "Create a stock transaction",
            description = "Creates a stock transaction and atomically updates stock balances. " +
                    "Supports: Stock-IN (purchase, donation, return, production), " +
                    "Stock-OUT (consumption, sale, disposal, lending), " +
                    "Stock-Transfer (warehouse to warehouse), " +
                    "Stock-Adjustment (inventory correction). " +
                    "All operations are transactional and validated."
    )
    @ApiResponse(responseCode = "201", description = "Stock transaction created successfully",
            content = @Content(schema = @Schema(implementation = StockTransactionResponse.class)))
    @ApiResponse(responseCode = "400", description = "Validation error")
    @ApiResponse(responseCode = "404", description = "Material or warehouse not found")
    public ResponseEntity<StockTransactionResponse> createStockTransaction(
            @Valid @RequestBody CreateStockTransactionRequest request) {
        
        com.care.warehouse.application.stock.command.CreateStockTransactionCommand command = 
                mapper.toCommand(request);
        
        StockTransaction transaction = createStockTransactionUseCase.createStockTransaction(command);
        StockTransactionResponse response = mapper.toResponse(transaction);
        
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping("/transactions")
    @Operation(
            summary = "Search stock transactions",
            description = "Searches stock transactions with pagination and filters. " +
                    "Supports filtering by: materialId, transactionType, warehouseId, reason, date range, referenceDocument."
    )
    @ApiResponse(responseCode = "200", description = "Stock transactions retrieved successfully")
    public ResponseEntity<Page<StockTransactionResponse>> searchStockTransactions(
            @Parameter(description = "Material ID filter") @RequestParam(required = false) UUID materialId,
            @Parameter(description = "Transaction type filter") @RequestParam(required = false) 
                    com.care.warehouse.domain.enums.StockTransactionType transactionType,
            @Parameter(description = "Warehouse ID filter (searches in both source and target)") 
                    @RequestParam(required = false) UUID warehouseId,
            @Parameter(description = "Reason filter") @RequestParam(required = false) 
                    com.care.warehouse.domain.enums.StockTransactionReason reason,
            @Parameter(description = "Reference document filter") @RequestParam(required = false) String referenceDocument,
            @PageableDefault(size = 20) Pageable pageable) {
        
        // Use repository methods directly for better filtering support
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return ResponseEntity.ok(org.springframework.data.domain.Page.empty());
        }
        
        Page<com.care.warehouse.infrastructure.db.entities.StockTransactionEntity> entityPage;
        
        // Apply filters using repository methods
        if (materialId != null) {
            entityPage = stockTransactionJpaRepository.findByMaterialId(materialId, pageable);
        } else if (transactionType != null) {
            entityPage = stockTransactionJpaRepository.findByTenantIdAndTransactionType(tenantId, transactionType, pageable);
        } else if (warehouseId != null) {
            entityPage = stockTransactionJpaRepository.findByWarehouse(tenantId, warehouseId, pageable);
        } else if (referenceDocument != null && !referenceDocument.isBlank()) {
            entityPage = stockTransactionJpaRepository.findByTenantIdAndReferenceDocument(tenantId, referenceDocument, pageable);
        } else {
            entityPage = stockTransactionJpaRepository.findByTenantId(tenantId, pageable);
        }
        
        // Convert entities to domain models and then to responses
        Page<StockTransactionResponse> responsePage = entityPage.map(entity -> {
            StockTransaction domain = stockTransactionJpaMapper.toDomain(entity);
            return mapper.toResponse(domain);
        });
        
        // Apply additional in-memory filters if needed (for reason, etc.)
        if (reason != null || (materialId == null && transactionType == null && warehouseId == null && 
                (referenceDocument == null || referenceDocument.isBlank()))) {
            List<StockTransactionResponse> filtered = responsePage.getContent().stream()
                    .filter(r -> reason == null || 
                            (r.getReason() != null && r.getReason() == reason))
                    .collect(java.util.stream.Collectors.toList());
            
            responsePage = new org.springframework.data.domain.PageImpl<>(
                    filtered, pageable, filtered.size());
        }
        
        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/balance")
    @Operation(
            summary = "Get stock balance",
            description = "Gets stock balance for a material in a warehouse, or aggregated balance across all warehouses. " +
                    "If warehouseId is provided, returns balance for that warehouse. " +
                    "If aggregate=true, returns total balance across all warehouses for the material."
    )
    @ApiResponse(responseCode = "200", description = "Stock balance retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Stock balance not found")
    public ResponseEntity<Object> getStockBalance(
            @Parameter(description = "Material ID (required)") @RequestParam UUID materialId,
            @Parameter(description = "Warehouse ID (optional, for specific warehouse balance)") 
                    @RequestParam(required = false) UUID warehouseId,
            @Parameter(description = "If true, returns aggregated balance across all warehouses") 
                    @RequestParam(defaultValue = "false") boolean aggregate) {
        
        if (aggregate) {
            // Return aggregated balance across all warehouses
            BigDecimal aggregatedBalance = stockBalancePort.getAggregatedBalance(materialId);
            return ResponseEntity.ok(java.util.Map.of(
                    "materialId", materialId,
                    "aggregatedQuantity", aggregatedBalance
            ));
        } else if (warehouseId != null) {
            // Return balance for specific warehouse
            StockBalance balance = stockBalancePort.findByWarehouseAndMaterial(warehouseId, materialId)
                    .orElseThrow(() -> new com.sharedlib.core.exception.NotFoundException(
                            "Stock balance not found for warehouse: " + warehouseId + 
                            " and material: " + materialId));
            
            StockBalanceResponse response = mapper.toResponse(balance);
            return ResponseEntity.ok(response);
        } else {
            // Return all balances for the material (across all warehouses)
            List<StockBalance> balances = stockBalancePort.findByMaterial(materialId);
            List<StockBalanceResponse> responses = balances.stream()
                    .map(mapper::toResponse)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(responses);
        }
    }
}


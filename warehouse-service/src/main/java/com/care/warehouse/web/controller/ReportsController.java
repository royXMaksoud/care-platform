package com.care.warehouse.web.controller;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.ports.ai.InventoryForecastingPort;
import com.care.warehouse.domain.ports.out.warehousematerialstock.WarehouseMaterialStockCrudPort;
import com.care.warehouse.web.dto.reports.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST Controller for Reporting & Analytics.
 * 
 * All endpoints are under /api/warehouse/v1/reports
 * Tenant isolation is enforced automatically via TenantContext.
 */
@RestController
@RequestMapping("/api/warehouse/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports & Analytics", description = "APIs for warehouse reports and analytics")
public class ReportsController {

    private final WarehouseMaterialStockCrudPort stockCrudPort;
    private final InventoryForecastingPort forecastingPort;

    @GetMapping("/stock-summary/{warehouseId}")
    @Operation(summary = "Get stock summary per warehouse", 
               description = "Returns total stock value, stock by material, and reorder level alerts")
    public ResponseEntity<StockSummaryResponse> getStockSummary(@PathVariable UUID warehouseId) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        // Fetch all stock records for warehouse
        var stocks = stockCrudPort.findByWarehouseId(tenantId, warehouseId);
        
        // Calculate summary
        double totalValue = 0.0; // TODO: Calculate with material prices
        int itemsBelowReorder = 0;
        int totalItems = stocks.size();
        
        for (var stock : stocks) {
            if (stock.isBelowReorderLevel()) {
                itemsBelowReorder++;
            }
        }

        StockSummaryResponse response = StockSummaryResponse.builder()
                .warehouseId(warehouseId)
                .totalItems(totalItems)
                .totalValue(totalValue)
                .itemsBelowReorderLevel(itemsBelowReorder)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/slow-moving-items")
    @Operation(summary = "Get slow moving items report", 
               description = "Returns items with low turnover or not moved in specified days")
    public ResponseEntity<List<SlowMovingItemsResponse>> getSlowMovingItems(
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(defaultValue = "90") int days) {
        
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        // TODO: Implement slow moving items logic
        // Query materials with no stock movements in last X days
        List<SlowMovingItemsResponse> response = new ArrayList<>();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/items-below-reorder-level")
    @Operation(summary = "Get items below reorder level", 
               description = "Returns materials below reorder threshold by warehouse")
    public ResponseEntity<List<ItemsBelowReorderLevelResponse>> getItemsBelowReorderLevel(
            @RequestParam(required = false) UUID warehouseId) {
        
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        // Fetch stocks below reorder level
        var stocksBelowThreshold = stockCrudPort.findBelowReorderLevel(tenantId);
        
        // Filter by warehouse if provided
        if (warehouseId != null) {
            stocksBelowThreshold = stocksBelowThreshold.stream()
                    .filter(s -> s.getWarehouseId().equals(warehouseId))
                    .toList();
        }

        List<ItemsBelowReorderLevelResponse> response = stocksBelowThreshold.stream()
                .map(stock -> ItemsBelowReorderLevelResponse.builder()
                        .materialId(stock.getMaterialId())
                        .warehouseId(stock.getWarehouseId())
                        .currentStock(stock.getStockCurrent())
                        .reorderLevel(stock.getReorderLevel())
                        .shortage(stock.getReorderLevel() - stock.getStockCurrent())
                        .build())
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/material-traceability/{materialId}")
    @Operation(summary = "Get material lifecycle traceability", 
               description = "Returns order history, stock movements, and fulfillment timeline")
    public ResponseEntity<MaterialTraceabilityResponse> getMaterialTraceability(
            @PathVariable UUID materialId,
            @RequestParam(required = false) UUID warehouseId) {
        
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        // TODO: Implement traceability logic
        // Query orders, stock movements, fulfillments for material
        
        MaterialTraceabilityResponse response = MaterialTraceabilityResponse.builder()
                .materialId(materialId)
                .warehouseId(warehouseId)
                .orderHistory(new ArrayList<>())
                .stockMovements(new ArrayList<>())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/category-value")
    @Operation(summary = "Get category-wise value report", 
               description = "Returns stock value by category with hierarchy")
    public ResponseEntity<List<CategoryValueResponse>> getCategoryValue(
            @RequestParam(required = false) UUID warehouseId) {
        
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        // TODO: Implement category value calculation
        // Group materials by category and calculate total value
        
        List<CategoryValueResponse> response = new ArrayList<>();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/forecast/{materialId}")
    @Operation(summary = "Get material demand forecast", 
               description = "Returns AI-powered demand forecast for a material")
    public ResponseEntity<ForecastResponse> getForecast(
            @PathVariable UUID materialId,
            @RequestParam(defaultValue = "6") int months,
            @RequestParam(required = false) UUID warehouseId) {
        
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        // Get forecast from AI port
        Map<String, Object> forecastData = forecastingPort.forecastMaterialDemand(
                materialId, warehouseId, months);

        // Map to response DTO
        ForecastResponse response = ForecastResponse.builder()
                .materialId(materialId)
                .warehouseId(warehouseId)
                .timeRangeMonths(months)
                .monthlyForecasts((List<Map<String, Object>>) forecastData.get("monthlyForecasts"))
                .averageDemand((Double) forecastData.get("averageDemand"))
                .totalPredictedDemand((Double) forecastData.get("totalPredictedDemand"))
                .confidenceLevel((Double) forecastData.get("confidenceLevel"))
                .trend((String) forecastData.get("trend"))
                .recommendations((List<String>) forecastData.get("recommendations"))
                .simulatedData((Boolean) forecastData.get("simulatedData"))
                .build();

        return ResponseEntity.ok(response);
    }
}

